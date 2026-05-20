"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "bestbuy") {
      html.classList.add("theme-bb");
    } else {
      html.classList.remove("theme-bb");
    }
  }, [theme]);

  return <>{children}</>;
}
