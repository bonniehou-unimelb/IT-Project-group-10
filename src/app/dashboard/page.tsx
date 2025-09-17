"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/zoom.css";

const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

export default function Dashboard() {
  const router = useRouter();
  const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);
  const [username, setUsername] = useState<string>("benconnor@unimelb.edu.au");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col bg-blue-900 text-white">
          <div className="px-6 py-5 text-xl font-bold">⚙️ Dashboard</div>
          <nav className="mt-2 flex-1">
            <button className="w-full text-left px-6 py-3 hover:bg-blue-950">My Templates</button>
            <button className="w-full text-left px-6 py-3 hover:bg-blue-950">All Templates</button>
            <button className="w-full text-left px-6 py-3 hover:bg-blue-950">Profile</button>
          </nav>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
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
                <MenuItem>Log Out</MenuItem>
              </Menu>
            </div>
          </header>

          {/* Content */}
          <main className={`${layout} py-5`}>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                onClick={() => router.push("/templates/new")}
              >
                + Create New AI Use Scale
              </button>
            </div>

            {loading && (
              <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
                Loading…
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-900">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="max-w table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-700">
                    <th className="px-4 py-3 font-medium w-[24rem]">Template Name</th>
                    <th className="px-4 py-3 font-medium w-32">Subject Code</th>
                    <th className="px-4 py-3 font-medium w-24 text-center">Semester</th>
                    <th className="px-4 py-3 font-medium w-24 text-center">Year</th>
                    <th className="px-4 py-3 font-medium w-24 text-center">Version</th>
                    <th className="px-4 py-3 font-medium w-40">Creator Name</th>
                    <th className="px-4 py-3 font-medium w-28">Type</th>
                    <th className="px-4 py-3 font-medium w-28">Publishable?</th>
                    <th className="px-4 py-3 font-medium w-44">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {templateSum.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                        No templates yet.
                      </td>
                    </tr>
                  )}

                  {templateSum.map((tpl) => (
                    <tr key={tpl.templateId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 truncate">{tpl.name}</td>
                      <td className="px-4 py-3">{tpl.subjectCode}</td>
                      <td className="px-4 py-3 text-center">{tpl.semester}</td>
                      <td className="px-4 py-3 text-center">{tpl.year}</td>
                      <td className="px-4 py-3 text-center">v{tpl.version}</td>
                      <td className="px-4 py-3">{tpl.ownerName || "NA"}</td>
                      <td className="px-4 py-3">{tpl.isTemplate ? "Template" : "Instance"}</td>
                      <td className="px-4 py-3">{tpl.isPublishable ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">
                            Preview
                          </button>
                          <button className="px-3 py-1 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50">
                            Duplicate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
