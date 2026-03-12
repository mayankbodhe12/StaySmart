import api from "./axios";

export function getTrendingListings() {
  return api.get("/listings/trending");
}