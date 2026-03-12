import api from "./axios";

export const createReview = (payload) => api.post("/reviews", payload);

export const getListingReviews = (listingId) =>
  api.get(`/reviews/listing/${listingId}`);

export const replyToReview = (reviewId, text) =>
  api.put(`/reviews/${reviewId}/reply`, { text });