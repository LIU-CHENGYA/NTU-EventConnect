import { createContext, useContext, useEffect, useState } from "react";
import { authApi, mapUser } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

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
        // data 已經被 authApi.me() 裡的 mapUser 處理過了
        setUser(data);
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setReady(true));
  }, []);
    const login = async (email, password) => {
      try {
        const { access_token, user: u } = await authApi.login(email, password);
        localStorage.setItem("token", access_token);
        // authApi.login 已經回傳 mapUser 處理過的 user
        setUser(u); 
        return { success: true };
      } catch (e) {
        return { success: false, error: e?.response?.data?.detail || "登入失敗" };
      }
    };

  const register = async (name, email, password) => {
    try {
      const { access_token, user: u } = await authApi.register(name, email, password);
      localStorage.setItem("token", access_token);
      setUser(u);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.detail || "註冊失敗" };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { access_token, user: u, needs_username } = await authApi.googleLogin(credential);
      localStorage.setItem("token", access_token);
      setUser(u);
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
