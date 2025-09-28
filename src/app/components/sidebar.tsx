"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

function SideBar() {
    const router = useRouter();
    return (
        <aside className="hidden md:flex md:w-64 md:flex-col bg-blue-900 text-white">
            <div className="w-40 h-40 mx-auto flex items-center justify-center translate-y-2">
                <span className="text-2xl text-white">
                    <Image src="icons/logo.svg" alt="University of Melbourne" width={200} height={200}/>
                </span>
            </div>
            <nav className="mt-5 flex-1">
                <button 
                    className="w-full text-left px-6 py-3 hover:bg-blue-950"
                    onClick={() => router.push("/homePage")}
                >
                    Home
                </button>
                <button 
                    className="w-full text-left px-6 py-3 hover:bg-blue-950"
                    onClick={() => router.push("/myTemplates")}
                >
                    My Templates
                </button>
                <button 
                    className="w-full text-left px-6 py-3 hover:bg-blue-950"
                    onClick={() => router.push("/allTemplates")}
                >
                    All Templates
                </button>
                </nav>
        </aside>
    );
}

export { SideBar };