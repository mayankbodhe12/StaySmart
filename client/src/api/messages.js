import api from "./axios";

export const getBookingMessages = (bookingId) =>
  api.get(`/messages/booking/${bookingId}`);

export const sendBookingMessage = (bookingId, text) =>
  api.post(`/messages/booking/${bookingId}`, { text });

export const markBookingMessagesRead = (bookingId) =>
  api.post(`/messages/booking/${bookingId}/read`);

export const getBookingChatMeta = () => api.get("/messages/meta");