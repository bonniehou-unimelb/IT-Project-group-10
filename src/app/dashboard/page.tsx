"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
const API_BACKEND_URL = "http://localhost:8000";

{/* Dependencies required for drop down menu */}
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

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
    const [search, setSearch] = useState("");
    const [templateSum, setTemplateSum] = useState<TemplateSummary[]>([]);
    const [username, setUsername] = useState<string>("benconnor@unimelb.edu.au");
    const [loading, setLoading] = useState(false);
    
    // Get dashboard template summary
    useEffect(() => {
        if (!username) return;
        (async () => {
        try {
        setLoading(true);
        const res = await fetch(
        `${API_BACKEND_URL}/template/summary/?username=${encodeURIComponent(
        username)}`,
        {
            method: "GET",
            credentials: "include"
        }
        );

        const data = (await res.json()) as { templates: TemplateSummary[] };        
        setTemplateSum(data.templates || []);
    } catch (e: any) {
        console.log("Fail to load dashboard information")
    } finally {
        setLoading(false);
    }
        })();    
    }, [username]);

    return (
        <div className="max-h-screen bg-gray-100">
            <h1 className="text-3xl text-black font-bold translate-x-52 translate-y-15"> Welcome Back!</h1>

            {/* Search Bar */}
            <div className="translate-x-52 translate-y-17">
              <div>
                <form>
                    <input
                        id="search"
                        type="text"
                        value={search}
                        onChange={(t) => setSearch(t.target.value)}
                        className="pl-1 pr-1 py-3 min-w-240 bg-gray-200 border-gray-600 rounded-xl text-gray-900 hover:bg-gray-300"
                        placeholder="🔍 Search"
                        required
                    />
                    <button
                        type="submit"
                        className="translate-x-2 min-h-10 min-w-20 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-lg transition"> 
                        Submit
                    </button>
                </form>
              </div>
            </div>

            {/* Create new template button */}
            {/* TODO: Link to table creation page later */}
            <button
                type="button"
                className="translate-x-52 translate-y-20 text-white py-1 px-2 rounded-lg bg-blue-700 font-semibold hover:bg-blue-800 shadow-lg">
                + Create New Template
            </button>

            {/* Navigation Table, displays summary data for each template owned by user for each row */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                    <tr className="text-left text-gray-700">
                    <th className="px-4 py-3 font-medium">Template ID</th>
                    <th className="px-4 py-3 font-medium">Template Name</th>
                    <th className="px-4 py-3 font-medium">Subject Code</th>
                    <th className="px-4 py-3 font-medium">Semester</th>
                    <th className="px-4 py-3 font-medium">Year</th>
                    <th className="px-4 py-3 font-medium">Version</th>
                    <th className="px-4 py-3 font-medium">Creator Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Publishable?</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
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

                    {/* map each template to each row of table */}
                    {templateSum.map((tpl) => (
                    <tr key={tpl.templateId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{tpl.templateId}</td>
                        <td className="px-4 py-3">{tpl.name}</td>
                        <td className="px-4 py-3">{tpl.subjectCode}</td>
                        <td className="px-4 py-3">{tpl.semester}</td>
                        <td className="px-4 py-3">{tpl.year}</td>
                        <td className="px-4 py-3">v{tpl.version}</td>
                        <td className="px-4 py-3">{tpl.ownerName || "NA"}</td>
                        <td className="px-4 py-3">{tpl.isTemplate ? "Template" : "Instance"}</td>
                        <td className="px-4 py-3">{tpl.isPublishable ? "✓" : "✘"}</td>
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
            </div>


            {/* Top Panel */}
            <div className="min-h-13 max-h-13 bg-white p-4 translate-x-50 -translate-y-57">
                <p className="text-gray-500"> Dashboard </p>
                <div className="float-right -translate-x-50 -translate-y-6">
                    <Menu menuButton={<MenuButton>{username} ▿</MenuButton>} transition>
                        {/* TODO: Link this back to the log in page */}
                        <MenuItem>Log Out</MenuItem>
                    </Menu>
                </div>
            </div>

            {/* Side Menu */}
            <div className="min-h-screen max-w-50 bg-blue-900 -translate-y-69.75">
                <p className="font-bold text-xl text-white translate-x-6 translate-y-4"> ⚙️ Dashboard </p>
                {/* Menu Buttons -- currently unimplemented. Should we make these go somewhere? */}
                <div className="translate-y-10 hover:bg-blue-950">
                    <button 
                        type="button"
                        className="text-white m-2">
                        My Templates
                    </button>
                </div>
                <div className="translate-y-11 hover:bg-blue-950">
                    <button 
                        type="button"
                        className="text-white m-2">
                        All Templates
                    </button>
                </div>
                <div className="translate-y-11 hover:bg-blue-950">
                    <button 
                        type="button"
                        className="text-white m-2">
                        Profile
                    </button>
                </div>
            </div>
        </div>
    );
}