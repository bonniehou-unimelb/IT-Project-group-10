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

// Cookie session getters
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}
async function ensureCsrf(): Promise<string | null> {
  let token = getCookie("csrftoken");
  if (!token) {
    const res = await fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" });
    try {
      const body = await res.json();
      token = body?.csrfToken || getCookie("csrftoken");
    } catch {}
  }
  return token;
}

//API helper calls for authentication (logout, user session)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  

  const refresh = async () => {
    try {
      const res = await fetch(`${API_BACKEND_URL}/session/`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();

        // Accept either {user: {...}} or {...} or null
        const u = (data && typeof data === "object")
          ? (("user" in data) ? (data as any).user : data)
          : null;

        // Basic sanity: must be object with username
        const userObj = (u && typeof u === "object" && "username" in u) ? u as any : null;
        setUser(userObj);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setPageLoading(false);  // ok for bootstrap; see optional tweak in §4
    }
  };


  const logout = async () => {
    const csrftoken = await ensureCsrf();
    await fetch(`${API_BACKEND_URL}/logout/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrftoken ? { "X-CSRFToken": csrftoken, "X-Requested-With": "XMLHttpRequest" } : {}),
      },
      body: "{}", 
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
