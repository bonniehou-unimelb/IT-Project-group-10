"use client"

import { useRouter } from "next/navigation";

function CreateTemplateButton(){
    const router = useRouter();
    return (
        <div className="flex justify-start">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                onClick={() => router.push("/templates/new")}
              >
                + Create New AI Use Scale
              </button>
            </div>
    );
}

export { CreateTemplateButton };