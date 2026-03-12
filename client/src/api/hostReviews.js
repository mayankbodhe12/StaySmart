import api from "./axios";

export const getHostReviewsDashboard = () => api.get("/host-reviews/dashboard");