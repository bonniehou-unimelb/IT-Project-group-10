"use client";
import { useEffect, useState } from "react";
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
    const res = await fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" });
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
  const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";
  const [query, setQuery] = useState<string>("");

  // Reroute to log in page if user session invalid
    useEffect(() => {
      if (!pageLoading && !user) router.replace("/login");
    }, [pageLoading, user, router]);
  
    useEffect(() => { refresh(); }, []); 
  
    useEffect(() => {
      if (user?.username) setUsername(user.username);
    }, [user]);
  
  
    const handleRowClick = (template_id: number) => {
      router.push(`/?template_id=${template_id}`);
    };
  
    // Fetch cookie for user session
    useEffect(() => {
      if (!user) return;
      fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" })
        .catch(() => {;});
    }, [user]);
  
    // Fetch summary details of the templates the current user owns
    useEffect(() => {
      if (!username || !user) return; 
      (async () => {
        try {
          setLoading(true);
          setError("");
          const res = await fetch(
            `${API_BACKEND_URL}/template/summary/?username=${encodeURIComponent(user.username)}`,
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
    
    // Handles creating new AI use scale from scratch
    const createNewScale = async () => {
      setIsCreating(true);
      setError("");
  
      try {
        const csrftoken = await ensureCsrf();
        const now = new Date();
        const payload = {
          username: user?.username ?? "",
          name: "New AI Use Scale",
          subjectCode: "DRAFT",
          year: 2025,
          semester: 1,
          scope: "",
          description: "",
          version: 0,          
          isPublishable: false,  // start as non-publishable 
          isTemplate: false,  // start as non-template
        };
  
        const res = await fetch(`${API_BACKEND_URL}/template/update/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrftoken ? { "X-CSRFToken": csrftoken, "X-Requested-With": "XMLHttpRequest" } : {}),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
  
        // Fetch template ID only from backend 
        const text = await res.text();
        let body: any = {};
        try { body = JSON.parse(text); } catch {}
  
        if (!res.ok || !body?.templateId) {
          throw new Error(body?.error || text || "Failed to create template");
        }
  
        //Route to default template creation with specified template ID
        router.push(`/?template_id=${body.templateId}`);
      } catch (e:any) {
        setError(String(e?.message ?? e) || "Failed to create template");
      } finally {
        setIsCreating(false);
      }
    };

  const filtered = query.trim()
    ? templateSum.filter((t) =>
        [t.name, t.subjectCode, t.ownerName]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
    : templateSum;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <TopBar pageName="My Templates"/>
          <main className={`${layout} py-5`}>
            <h2 className="font-bold text-3xl">My Templates</h2>

            <div className="pt-6">
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

            <p className="pt-7 text-xl">Or edit an existing template:</p>

            {}
            <div className="pt-3">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by name, subject code, or owner…"
              />
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

            {}
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
                    <tr>
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
                          <button
                            className="px-3 py-1 rounded-lg text-red-600 border border-red-400 hover:bg-red-50">
                            Delete
                          </button>
                          {}
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
