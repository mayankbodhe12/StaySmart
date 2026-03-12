import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: false,

      setAccessToken: (token) => set({ accessToken: token }),

      register: async (payload) => {
        set({ loading: true });
        try {
          const res = await api.post("/auth/register", payload);

          set({
            user: res.data.user,
            accessToken: res.data.accessToken,
            loading: false,
          });

          return { ok: true, user: res.data.user };
        } catch (e) {
          set({ loading: false });
          return {
            ok: false,
            message: e.response?.data?.message || "Register failed",
          };
        }
      },

      login: async (payload) => {
        set({ loading: true });
        try {
          const res = await api.post("/auth/login", payload);

          set({
            user: res.data.user,
            accessToken: res.data.accessToken,
            loading: false,
          });

          return { ok: true, user: res.data.user };
        } catch (e) {
          set({ loading: false });
          return {
            ok: false,
            message: e.response?.data?.message || "Login failed",
          };
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get("/users/me");
          set({ user: res.data.user });
          return true;
        } catch {
          return false;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {}
        set({ user: null, accessToken: null });
      },

      logoutLocal: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "staysmart-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;