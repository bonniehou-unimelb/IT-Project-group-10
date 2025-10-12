"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SideBar } from '../components/sidebar';
import { TopBar } from '../components/topbar';
import { SearchBar } from '../components/searchbar';
import { CreateTemplateButton } from "../components/createTemplateButton";
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
  ownerUsername?: string;
  isPublishable: boolean;
  isTemplate: boolean;
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
    const res = await fetch(`${API_BACKEND_URL}/token/`, { credentials: "include", cache: "no-store" });
    try {
      const body = await res.json();
      token = body?.csrfToken || getCookie("csrftoken");
    } catch {;}
  }
  return token;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, pageLoading, refresh } = useAuth();

  const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // search (kept) — now triggers server-side query
  const [query, setQuery] = useState("");

  // paging (added)
  const [offset, setOffset] = useState(0);
  const [limit] = useState(25);
  const [total, setTotal] = useState<number | null>(null);
  const hasMore = total === null ? true : offset < (total ?? 0);

  const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";

  // cancel stale requests
  const inFlight = useRef<AbortController | null>(null);

  // Reroute to log in page if user session invalid
  useEffect(() => {
    if (!pageLoading && !user) router.replace("/login");
  }, [pageLoading, user, router]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user]);

  const handleRowClick = (template_id: number) => {
    router.push(`/?template_id=${template_id}`);
  };

  // Fetch cookie for user session (kept)
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BACKEND_URL}/token/`, { credentials: "include", cache: "no-store" })
      .catch(() => {;});
  }, [user]);

  // ---- NEW: fetch from community endpoint (server-side search + paging) ----
  const fetchCommunity = async (opts: { reset?: boolean } = {}) => {
    // abort previous
    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;

    try {
      setLoading(true);
      setError("");

      const nextOffset = opts.reset ? 0 : offset;
      const url = new URL(`${API_BACKEND_URL}/templates/community/`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(nextOffset));
      url.searchParams.set("order", "recent");
      if (query.trim()) url.searchParams.set("q", query.trim());

      const res = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const body = await res.json();

      const rows: TemplateSummary[] = (body?.results || []).map((r: any) => ({
        templateId: r.templateId,
        name: r.name,
        version: r.version,
        subjectCode: r.subjectCode,
        year: r.year,
        semester: r.semester,
        ownerName: r.ownerName,
        ownerUsername: r.ownerUsername,
        isPublishable: !!r.isPublishable,
        isTemplate: !!r.isTemplate,
      }));

      setTotal(typeof body?.count === "number" ? body.count : null);
      setTemplateSum((prev) => (opts.reset ? rows : [...prev, ...rows]));
      setOffset(nextOffset + rows.length);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message || "Failed to load community templates");
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchCommunity({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-query immediately on search change (no debounce)
  useEffect(() => {
    setTemplateSum([]);
    setOffset(0);
    setTotal(null);
    fetchCommunity({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const displayName = user?.username ?? "Account";

  // Keep your variable name "filtered" (now equal to server results)
  const filtered = templateSum;

  // Handles creating new AI use scale from scratch (kept)
  const createNewScale = async () => {
    setIsCreating(true);
    setError("");

    try {
      const csrftoken = await ensureCsrf();
      const payload = {
        username: user?.username ?? "",
        name: "New AI Use Scale",
        subjectCode: "DRAFT",
        year: 2025,
        semester: 1,
        scope: "",
        description: "",
        version: 0,          
        isPublishable: false,
        isTemplate: false,
      };

      const res = await fetch(`${API_BACKEND_URL}/template/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrftoken ? { "X-CSRFToken": csrftoken, "X-Requested-With": "XMLHttpRequest" } : {}),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body: any = {};
      try { body = JSON.parse(text); } catch {}

      if (!res.ok || !body?.templateId) {
        throw new Error(body?.error || text || "Failed to create template");
      }

      router.push(`/?template_id=${body.templateId}`);
    } catch (e:any) {
      setError(String(e?.message ?? e) || "Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <SideBar />
        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {}
          <TopBar pageName="All Templates"/>

          {/* Content */}
          <main className={`${layout} py-5`}>

            {/* Title */}
            <h2 className="font-bold text-3xl">
              Community Templates
            </h2>
            
            {/* Search */}
            <div className="pt-3">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by name, subject code, or owner…"
              />
            </div>

            {loading && filtered.length === 0 && (
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
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                        No {query ? "matching" : ""} templates{query ? " for your search." : " yet."}
                      </td>
                    </tr>
                  )}

                  {filtered.map((tpl) => (
                    <tr
                      key={tpl.templateId}
                      className="hover:bg-gray-50"
                      onClick={() => handleRowClick(tpl.templateId)}
                    >
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
                          <button
                            className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              router.push(`/?template_id=${tpl.templateId}`); 
                            }}
                          >
                            Preview
                          </button>
                          {/* Duplicate button for every row */}
                          <button
                            className="px-3 py-1 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50"
                            onClick={async (e) => {
                              e.stopPropagation(); 
                              try {
                                const res = await fetch(`${API_BACKEND_URL}/template/duplicate/`, {
                                  method: "POST",
                                  credentials: "include",
                                  cache: "no-store",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ templateId: tpl.templateId }),
                                });
                                if (!res.ok) throw new Error("Failed to duplicate template");
                                const data = await res.json();
                                setTemplateSum((prev) => [data.new_template, ...prev]);
                              } catch (err) {
                                console.error(err);
                                alert("Failed to duplicate template");
                              }
                            }}
                          >
                            Duplicate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paging controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {total !== null
                  ? `Showing ${Math.min(offset, total)} of ${total}`
                  : templateSum.length > 0
                  ? `Showing ${templateSum.length}…`
                  : ""}
              </div>
              {hasMore && (
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  onClick={() => fetchCommunity()}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>

            <p className="pl-1 pt-6 text-xl"> Or create your own!</p>

            <div className="pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                onClick={() => {
                  if (!user || isCreating) return;
                  createNewScale();
                  router.push("/templates/new");
                }}
                disabled={!user || isCreating}
              >
                + Create New AI Use Scale
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
