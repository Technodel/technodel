import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiPath } from "@/lib/api-path";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  rewardPoints: number;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      login: async (email, password) => {
        try {
          set({ loading: true });
          const res = await fetch(apiPath("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, error: data.error || "Login failed" };
          set({ user: data.user, loading: false });
          return { ok: true };
        } catch {
          set({ loading: false });
          return { ok: false, error: "Network error. Please try again." };
        }
      },

      register: async (name, email, password, phone) => {
        try {
          set({ loading: true });
          const res = await fetch(apiPath("/api/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, phone }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, error: data.error || "Registration failed" };
          set({ user: data.user, loading: false });
          return { ok: true };
        } catch {
          set({ loading: false });
          return { ok: false, error: "Network error. Please try again." };
        }
      },

      logout: async () => {
        try {
          await fetch(apiPath("/api/auth/logout"), { method: "POST" });
        } catch {}
        set({ user: null });
      },

      fetchUser: async () => {
        try {
          const res = await fetch(apiPath("/api/auth/me"));
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user });
          }
        } catch {}
      },
    }),
    {
      name: "tn-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
