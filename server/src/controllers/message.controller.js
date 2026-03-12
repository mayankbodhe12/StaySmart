import mongoose from "mongoose";
import Message from "../models/Message.js";
import Booking from "../models/Booking.js";
import { createNotification } from "../utils/notify.js";

function isBookingParticipant(booking, userId) {
  return (
    String(booking.guestId) === String(userId) ||
    String(booking.hostId) === String(userId)
  );
}

export async function getBookingMessages(req, res, next) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const userId = req.user.sub;
    if (!isBookingParticipant(booking, userId)) {
      return res.status(403).json({ message: "Not allowed to view this chat" });
    }

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (e) {
    next(e);
  }
}

export async function sendBookingMessage(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { text } = req.body;

    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const userId = req.user.sub;

    let senderRole = null;
    if (String(booking.guestId) === String(userId)) senderRole = "guest";
    if (String(booking.hostId) === String(userId)) senderRole = "host";

    if (!senderRole) {
      return res.status(403).json({ message: "Not allowed to send message" });
    }

    const message = await Message.create({
      bookingId,
      senderId: userId,
      senderRole,
      text: cleanText,
      readBy: [userId],
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`booking:${bookingId}`).emit("chat:message", {
        _id: message._id,
        bookingId: String(message.bookingId),
        senderId: String(message.senderId),
        senderRole: message.senderRole,
        text: message.text,
        createdAt: message.createdAt,
      });
    }

    const recipientId =
      senderRole === "guest" ? booking.hostId : booking.guestId;

    await createNotification(req, {
      userId: recipientId,
      type: "chat_message",
      title: "New message",
      message: cleanText.slice(0, 80),
      link: `/chat/${bookingId}`,
      meta: {
        bookingId,
        senderRole,
      },
    });

    res.status(201).json({ message });
  } catch (e) {
    next(e);
  }
}

export async function markBookingMessagesRead(req, res, next) {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!isBookingParticipant(booking, userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Message.updateMany(
      {
        bookingId,
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readBy: { $ne: new mongoose.Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new mongoose.Types.ObjectId(userId) },
      },
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function getBookingChatMeta(req, res, next) {
  try {
    const userId = req.user.sub;

    const bookings = await Booking.find({
      $or: [{ guestId: userId }, { hostId: userId }],
    }).select("_id guestId hostId");

    const bookingIds = bookings.map((b) => b._id);

    const messages = await Message.find({
      bookingId: { $in: bookingIds },
    }).sort({ createdAt: -1 });

    const metaMap = new Map();

    for (const msg of messages) {
      const key = String(msg.bookingId);

      if (!metaMap.has(key)) {
        metaMap.set(key, {
          bookingId: key,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      const isMine = String(msg.senderId) === String(userId);
      const isRead = (msg.readBy || []).some(
        (id) => String(id) === String(userId),
      );

      if (!isMine && !isRead) {
        const current = metaMap.get(key);
        current.unreadCount += 1;
      }
    }

    res.json({
      chatMeta: Array.from(metaMap.values()),
    });
  } catch (e) {
    next(e);
  }
}