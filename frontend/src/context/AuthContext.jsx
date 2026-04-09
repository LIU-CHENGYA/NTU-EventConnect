import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const formatUser = (u) => {
    if (!u) return null;
    return {
      ...u,
      avatarUrl: u.avatar_url 
        ? (u.avatar_url.startsWith('http') ? u.avatar_url : `http://localhost:8000${u.avatar_url}`)
        : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`
    };
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((data) => {
        // 手動加上轉換邏輯，確保全站 user.avatarUrl 都有值
        const formattedUser = {
          ...data,
          avatarUrl: data.avatar_url 
            ? (data.avatar_url.startsWith('http') ? data.avatar_url : `http://localhost:8000${data.avatar_url}`)
            : `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.id}`
        };
        setUser(formattedUser);
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setReady(true));
  }, []);
    const login = async (email, password) => {
      try {
        const { access_token, user: u } = await authApi.login(email, password);
        localStorage.setItem("token", access_token);
        // 這裡原本是 setUser(u)，請改成：
        setUser(formatUser(u)); 
        return { success: true };
      } catch (e) {
        return { success: false, error: e?.response?.data?.detail || "登入失敗" };
      }
    };

  const register = async (name, email, password) => {
    try {
      const { access_token, user: u } = await authApi.register(name, email, password);
      localStorage.setItem("token", access_token);
      setUser(formatUser(u));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.detail || "註冊失敗" };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { access_token, user: u, needs_username } = await authApi.googleLogin(credential);
      localStorage.setItem("token", access_token);
      setUser(formatUser(u));
      return { success: true, needsUsername: needs_username };
    } catch (e) {
      return { success: false, error: e?.response?.data?.detail || "Google 登入失敗" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, googleLogin, setUser, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
