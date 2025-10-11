"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SideBar } from '../components/sidebar';
import { TopBar } from '../components/topbar';
import { SearchBar } from '../components/searchbar';
import { CreateTemplateButton } from "../components/createTemplateButton";

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

export default function Dashboard() {
  const router = useRouter();
  const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);
  const [username, setUsername] = useState<string>("benconnor@unimelb.edu.au");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");

  const layout = "mx-auto w-full max-w-[1280px] px-6 md:px-8";

  const handleRowClick = (template_id: number) => {
    router.push(`/?template_id=${template_id}`);
  };

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
          <TopBar />
          <main className={`${layout} py-5`}>
            <h2 className="font-bold text-3xl">My Templates</h2>

            <div className="pt-6">
              <CreateTemplateButton />
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
