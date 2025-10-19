"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface SystemData {
  totalUsers: number;
  subjects: number;
  templates: number;
  activeCoordinators: number;
}

export default function SystemOverview() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://127.0.0.1:8000/system-overview/");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching system overview:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const metrics = [
    { label: "Total Users", value: data?.totalUsers },
    { label: "Subjects", value: data?.subjects },
    { label: "Templates", value: data?.templates },
    { label: "Active Coordinators", value: data?.activeCoordinators },
  ];

  return (
    <div className="border rounded-xl shadow-sm bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">System Overview</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border bg-gray-50 text-center hover:bg-gray-100 transition"
          >
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-2xl font-semibold">
              {loading ? "…" : item.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
