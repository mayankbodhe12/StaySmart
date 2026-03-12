import api from "./axios";

export const createListing = (data) => api.post("/listings", data);

export const getMyListings = () => api.get("/listings/host/mine");

export const uploadListingImages = (listingId, files) => {
  const fd = new FormData();
  for (const f of files) fd.append("images", f);

  return api.post(`/listings/${listingId}/images`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAllListings = (params = {}) => api.get("/listings", { params });

export const getPublicListings = (params) => api.get("/listings", { params });
export const getListingById = (id) => api.get(`/listings/${id}`);

export const searchListings = (params = {}) =>
  api.get("/listings/search", { params });

export const getPricePreview = (params) =>
  api.get("/listings/price-preview", { params });

export const deleteListing = (id) => api.delete(`/listings/${id}`);

export const getSimilarListings = (id) =>
  api.get(`/listings/${id}/similar`);

export const getListingBlockedRanges = (id) =>
  api.get(`/listings/${id}/blocked-ranges`);

export const addListingBlockedRange = (id, payload) =>
  api.post(`/listings/${id}/blocked-ranges`, payload);

export const deleteListingBlockedRange = (id, rangeId) =>
  api.delete(`/listings/${id}/blocked-ranges/${rangeId}`);