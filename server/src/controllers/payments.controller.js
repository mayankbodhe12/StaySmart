import Booking from "../models/Booking.js";
import crypto from "crypto";
import { rzp } from "../config/razorpay.js";
import { getIO } from "../socket.js";

export async function createRazorpayOrder(req, res) {
  try {
    const { bookingId, email } = req.body;

    if (!bookingId || !email) {
      return res.status(400).json({ message: "bookingId and email required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const member = (booking.splitMembers || []).find(
      (m) => String(m.email).toLowerCase() === String(email).toLowerCase(),
    );
    if (!member)
      return res.status(404).json({ message: "Split member not found" });
    if (member.paid) return res.status(400).json({ message: "Already paid" });

    if (!member.amount || Number(member.amount) <= 0) {
      return res.status(400).json({ message: "Invalid member amount" });
    }

    // Razorpay expects paise (integer)
    const amountPaise = Math.round(Number(member.amount) * 100);

    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bk_${String(bookingId).slice(-10)}_${Date.now().toString().slice(-8)}`, // ✅ <= 40
      notes: {
        bookingId: String(bookingId),
        email: String(email),
        groupId: booking.groupId || "",
      },
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId,
      email,
      keyId: process.env.RAZORPAY_KEY_ID, // optional, but useful
    });
  } catch (e) {
    console.log("RZP ORDER ERROR:", e);
    return res
      .status(500)
      .json({ message: "Failed to create Razorpay order", details: e.message });
  }
}

export async function verifyRazorpayPayment(req, res) {
  try {
    const {
      bookingId,
      email,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !email ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    // verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // mark member paid
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const idx = booking.splitMembers.findIndex(
      (m) => String(m.email).toLowerCase() === String(email).toLowerCase(),
    );
    if (idx === -1)
      return res.status(404).json({ message: "Member not found" });

    booking.splitMembers[idx].paid = true;

    const paidCount = booking.splitMembers.filter((m) => m.paid).length;
    booking.paymentStatus =
      paidCount === booking.splitMembers.length ? "paid" : "partial";

    if (booking.paymentStatus === "paid") booking.status = "confirmed";

    await booking.save();

    const io = getIO();

    const paidMember = booking.splitMembers.find(
      (m) => String(m.email).toLowerCase() === String(email).toLowerCase(),
    );

    const listingTitle =
      booking.listingId && typeof booking.listingId === "object"
        ? booking.listingId.title
        : booking.listingTitle || "Listing";

    const amount = paidMember?.amount || 0;

    io.to(`host:${booking.hostId}`).emit("payment:notification", {
      bookingId: booking._id,
      groupId: booking.groupId,
      email,
      amount,
      listingTitle,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      time: Date.now(),
    });

    if (booking.groupId) {
      io.to(`group:${booking.groupId}`).emit("booking:updated", {
        groupId: booking.groupId,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
      });
    }

    return res.json({
      ok: true,
      booking,
      paymentStatus: booking.paymentStatus,
    });
  } catch (e) {
    console.log("RZP VERIFY ERROR:", e);
    return res
      .status(500)
      .json({ message: "Failed to verify payment", details: e.message });
  }
}
