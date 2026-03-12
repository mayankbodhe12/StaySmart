import Notification from "../models/Notification.js";

export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.sub,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (e) {
    next(e);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user.sub,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ ok: true, notification });
  } catch (e) {
    next(e);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user.sub, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}