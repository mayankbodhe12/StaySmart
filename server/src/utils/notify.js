import Notification from "../models/Notification.js";

export async function createNotification(req, payload) {
  const io = req.app.get("io");

  const notification = await Notification.create(payload);

  if (io) {
    io.to(`user:${payload.userId}`).emit("notification:new", {
      _id: notification._id,
      userId: String(notification.userId),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      isRead: notification.isRead,
      meta: notification.meta,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}
