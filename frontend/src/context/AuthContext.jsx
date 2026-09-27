import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, fetchCurrentUser } from "../api/auth";
import { useTheme } from "./ThemeContext";

const AuthContext = createContext(null);
const TOKEN_KEY = "otakushelf_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setLocalTheme } = useTheme();

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchCurrentUser();
      setUser(me);
      setLocalTheme(me.theme_preference);
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function login(username, password) {
    const { access_token } = await loginUser({ username, password });
    localStorage.setItem(TOKEN_KEY, access_token);
    const me = await fetchCurrentUser();
    setUser(me);
    setLocalTheme(me.theme_preference);
    return me;
  }

  async function register(username, email, password) {
    await registerUser({ username, email, password });
    return login(username, password);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  const value = { user, loading, login, register, logout, refreshUser: loadUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
