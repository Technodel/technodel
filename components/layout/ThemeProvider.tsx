"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("theme-light");
    } else {
      html.classList.remove("theme-light");
    }
  }, [theme]);

  return <>{children}</>;
}
