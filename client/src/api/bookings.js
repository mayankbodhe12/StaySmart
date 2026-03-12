import api from "./axios";

export const createBooking = (payload) => api.post("/bookings", payload);
export const getMyBookings = () => api.get("/bookings/me");
export const getGroupBooking = (groupId) => api.get(`/bookings/group/${groupId}`);
export const payGroupShare = (groupId, email) =>
  api.post(`/bookings/group/${groupId}/pay`, { email });
export const getHostBookings = () => api.get("/bookings/host");
export const checkAvailability = (params) =>
  api.get("/bookings/availability", { params });
export const getBookedRanges = (listingId) =>
  api.get(`/bookings/listing/${listingId}/ranges`);