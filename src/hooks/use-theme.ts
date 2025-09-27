import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "dark"; // default dark
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (newTheme: Theme) => {
      if (newTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.toggle("dark", systemTheme === "dark");
      } else {
        root.classList.toggle("dark", newTheme === "dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    // react to system changes only if theme=system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, setTheme };
}
