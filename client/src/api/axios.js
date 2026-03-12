import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // if access token expired -> refresh once
    if (
      err.response?.status === 401 &&
      !original._retry &&
      original.url !== "/auth/refresh"
    ) {
      original._retry = true;
      try {
        const r = await api.post("/auth/refresh");
        useAuthStore.getState().setAccessToken(r.data.accessToken);
        original.headers.Authorization = `Bearer ${r.data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logoutLocal();
      }
    }
    return Promise.reject(err);
  },
);

export default api;
