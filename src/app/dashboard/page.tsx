"use client";
import { useState } from "react";
import Table from 'react';

export default function Dashboard() {
    const [search, setSearch] = useState("");
    
    return (
        <div className="max-h-screen bg-gray-100">
            <h1 className="text-3xl text-black font-bold translate-x-52 translate-y-15"> Welcome Back *username*!</h1>
            
            {/* Search Bar */}
            <div className="translate-x-52 translate-y-17">
              <div>
                <form>
                    <input
                        id="search"
                        type="text"
                        value={search}
                        onChange={(t) => setSearch(t.target.value)}
                        className="pl-1 pr-1 py-3 min-w-250 bg-gray-200 border-gray-600 rounded-xl text-gray-900 hover:bg-gray-300"
                        placeholder="🔍 Search"
                        required
                    />
                    <button
                        type="submit"
                        className="translate-x-2 min-h-10 min-w-20 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-lg transition"
                    > 
                        Submit
                    </button>
                </form>
              </div>
            </div>

            {/* Top Panel */}
            <div className="min-h-13 bg-white p-4 translate-x-50 -translate-y-22">
                <p className="text-gray-500"> Dashboard  </p>
            </div>

            {/* Side Menu */}
            <div className="min-h-screen max-w-50 bg-blue-900 -translate-y-35">
                <p className="font-bold text-xl text-white translate-x-6 translate-y-4"> ⚙️ Dashboard </p>
            </div>
        </div>
    );
}