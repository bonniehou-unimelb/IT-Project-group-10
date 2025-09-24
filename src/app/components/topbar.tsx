"use client"

import { useEffect, useState } from "react";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import { useRouter } from "next/navigation";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";

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

function TopBar() {
    const router = useRouter();
    const [username, setUsername] = useState<string>("benconnor@unimelb.edu.au");
    const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);

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

    return (
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className={`${layout} py-3 flex items-center justify-between`}>
                <div className="leading-tight">
                    <p className="text-xs sm:text-sm text-gray-500">Dashboard</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back!</h1>
                </div>
                <Menu
                    menuButton={<MenuButton className="px-3 py-2 rounded-md border">{username} ▿</MenuButton>}
                    transition
                >
                    {/* TODO: Fix so it erases previous user information */}
                    <MenuItem
                        onClick = {() => router.push('/login')}>
                        Log Out
                    </MenuItem>
              </Menu>
            </div>
        </header>
    );
}

export { TopBar };