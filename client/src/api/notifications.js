import api from "./axios";

export const getMyNotifications = () => api.get("/notifications");

export const markNotificationRead = (notificationId) =>
  api.post(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
  api.post("/notifications/read-all");