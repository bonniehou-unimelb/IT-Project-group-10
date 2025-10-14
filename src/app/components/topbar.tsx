// The top bar of the web page
// It displays the username of the current user as well as the current page they are on

"use client"

import { useEffect, useState } from "react";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import { useRouter } from "next/navigation";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";
import { useAuth } from "../authentication/auth";

const API_BACKEND_URL = "http://localhost:8000";

export type TemplateSummary = {
  templateId: number;
  name: string;
  version: number;
  subjectCode: string;
  year: number;
  semester: number;
  ownerName: string;
  isPublishable: boolean;
  isTemplate: boolean;
};

type TopBarProps = {
  pageName?: string;
  subtitle?: string;
};

// CSRF Cookie management
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
    } catch {;}
  }
  return token;
}

function TopBar({ pageName = "Dashboard"}: TopBarProps) {
    const router = useRouter();
    const { user, pageLoading, refresh, logout } = useAuth();
    const [username, setUsername] = useState<string>("");
    const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);

    // Reroute to log in page if user session invalid
    useEffect(() => {
      if (!pageLoading && !user) router.replace("/login");
    }, [pageLoading, user, router]);

    useEffect(() => { refresh(); }, []); 

    useEffect(() => {
      if (user?.username) setUsername(user.username);
    }, [user]);

    // Fetch cookie for user session
    useEffect(() => {
      if (!user) return;
      fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" })
        .catch(() => {;});
    }, [user]);

    useEffect(() => {
        if (!username) return;
        (async () => {
          try {
            setLoading(true);
            setError("");
            const res = await fetch(
              `${API_BACKEND_URL}/template/summary/?username=${encodeURIComponent(username)}`,
              { method: "GET", credentials: "include" }
            );
            const data = (await res.json()) as { templates: TemplateSummary[] };
            setTemplateSum(data.templates || []);
          } catch {
            setError("Failed to load dashboard information");
          } finally {
            setLoading(false);
          }
        })();
      }, [username]);

    // Log out cookie session
    const handleLogout = async () => {
      try { await logout(); } finally { router.replace("/login"); }
    };

    return (
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className={`${layout} py-3 flex items-center justify-between`}>
                
                {/* Display name of page here */}
                <div className="leading-tight">
                    <p className="text-xs sm:text-sm text-gray-500">{pageName}</p>
                </div>
                
                {/* Log out button */}
                <Menu
                    menuButton={<MenuButton className="px-3 py-2 rounded-md border">{username} ▿</MenuButton>}
                    transition
                >
                    <MenuItem
                        onClick={handleLogout}>
                        Log Out
                    </MenuItem>
              </Menu>

            </div>
        </header>
    );
}

export { TopBar };