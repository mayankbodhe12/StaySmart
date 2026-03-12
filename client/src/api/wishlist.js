import api from "./axios";

export const getMyWishlist = () => api.get("/wishlist");
export const toggleWishlist = (listingId) =>
  api.post("/wishlist/toggle", { listingId });

export const getWishlistStatus = (listingId) =>
  api.get(`/wishlist/status/${listingId}`);