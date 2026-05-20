import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeStore {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "tn-theme" }
  )
);
