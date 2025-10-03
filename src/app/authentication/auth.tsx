"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
const API_BACKEND_URL = "http://localhost:8000";

//Define states for user session and authentication
type User = { username: string; role?: string | null; };
type AuthState = {
  user: User | null;
  pageLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

//API helper calls for authentication (logout, user session)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch(`${API_BACKEND_URL}/session/`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setPageLoading(false);
    }
  };

  const logout = async () => {
    await fetch(`${API_BACKEND_URL}/logout/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    setUser(null);
  };

  useEffect(() => {
    //Set csrf token for current user session
    fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" }).finally(refresh);
  }, []);

  return (
    <AuthContext.Provider value={{ user, pageLoading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("auth context error");
  return ctx;
}
