import api from "./axios";

export const createRzpOrder = (bookingId, email) =>
  api.post("/payments/razorpay/order", { bookingId, email });

export const verifyRzpPayment = (payload) =>
  api.post("/payments/razorpay/verify", payload);