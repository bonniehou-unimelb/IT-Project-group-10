"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onChange("");
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onChange]);

  return (
    <div className="flex justify-start">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(value.trim());
        }}
        className="relative"
      >
        <input
          ref={inputRef}
          id="search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-1 pr-10 py-3 min-w-250 bg-gray-200 border border-gray-300 rounded-xl text-gray-900 indent-2 hover:bg-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder={placeholder ?? "Search for a Template..."}
          aria-label="Search templates"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-24 top-1/2 -translate-y-1/2 px-2 text-gray-600 hover:text-gray-800"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        )}
        <button
          type="submit"
          className="ml-2 min-h-10 min-w-20 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
