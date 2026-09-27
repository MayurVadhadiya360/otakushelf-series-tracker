import { createContext, useContext, useEffect, useState } from "react";
import { updateTheme as apiUpdateTheme } from "../api/users";
import { DEFAULT_THEME } from "../constants";

const ThemeContext = createContext(null);
const STORAGE_KEY = "otakushelf_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /** Applies a theme locally without calling the API — used when we load
   * the user's saved preference on login, to avoid an unnecessary write. */
  function setLocalTheme(newTheme) {
    if (!newTheme) return;
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }

  /** Applies a theme and persists it to the user's account. */
  async function setTheme(newTheme) {
    setLocalTheme(newTheme);
    try {
      await apiUpdateTheme(newTheme);
    } catch (err) {
      // Non-fatal — the theme still applies locally for this session.
      console.error("Failed to save theme preference", err);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setLocalTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
