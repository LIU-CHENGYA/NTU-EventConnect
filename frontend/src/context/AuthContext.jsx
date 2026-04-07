import { createContext, useContext, useState } from "react";
import { mockUsers } from "../mock/data";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // Mock login: accept any email that matches a mock user
    const found = mockUsers.find((u) => u.email === email);
    if (found) {
      setUser(found);
      return { success: true };
    }
    // For demo: allow login with any email
    setUser(mockUsers[0]);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const register = (name, email, password) => {
    // Mock register
    const newUser = {
      ...mockUsers[0],
      id: Date.now(),
      name,
      email,
    };
    setUser(newUser);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
