"use client";

import { useEffect, useState } from "react";
import { Clock, User, BookOpen, FileText } from "lucide-react";

interface RecentActivityData {
  recentUsers: { username: string; date_joined: string }[];
  recentSubjects: { name: string; subjectCode: string; year: number; semester: number }[];
  recentTemplates: { name: string; version: number }[];
}

export default function RecentActivity() {
  const [data, setData] = useState<RecentActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://127.0.0.1:8000/recent-activity/");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch recent activity:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="border rounded-xl shadow-sm bg-white p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-4">Loading recent updates…</div>
      ) : (
        <div className="space-y-6 text-sm">
          {/* Users */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              New Users
            </h3>
            {data?.recentUsers?.length ? (
              <ul className="space-y-1">
                {data.recentUsers.map((u, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-800">{u.username}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-xs pl-6">No new users</p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              Recent Subjects
            </h3>
            {data?.recentSubjects?.length ? (
              <ul className="space-y-1">
                {data.recentSubjects.map((s, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-800">
                      {s.name} ({s.subjectCode})
                    </span>
                    <span className="text-xs text-gray-500">
                      {s.year} S{s.semester}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-xs pl-6">No new subjects</p>
            )}
          </div>

          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Recent Templates
            </h3>
            {data?.recentTemplates?.length ? (
              <ul className="space-y-1">
                {data.recentTemplates.map((t, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-800">{t.name}</span>
                    <span className="text-xs text-gray-500">v{t.version}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-xs pl-6">No recent templates</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
