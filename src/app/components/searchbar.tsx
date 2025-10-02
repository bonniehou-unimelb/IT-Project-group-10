"use client"

import { useState } from "react";

function SearchBar() {
    const [search, setSearch] = useState("");
    return (
        <div className="flex justify-start">
            <div>
                <form>
                    <input
                        id="search"
                        type="text"
                        value={search}
                        onChange={(t) => setSearch(t.target.value)}
                        className="pl-1 pr-1 py-3 min-w-250 bg-gray-200 border-gray-600 rounded-xl text-gray-900 indent-2 hover:bg-gray-300"
                        placeholder="Search for a Template..."
                        required
                    />
                    <button
                        type="submit"
                        className="translate-x-2 min-h-10 min-w-20 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg transition"
                    > 
                        Submit
                    </button>
                </form>
            </div>
        </div>
    )
}

export { SearchBar };