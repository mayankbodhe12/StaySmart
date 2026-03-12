import api from "./axios";

export const getHostAnalytics = (params = {}) =>
  api.get("/host/analytics", { params });