"use client";

import { redirect } from "next/navigation";

export default function App() {
  // Automatically send users to the login page
  redirect("/login");
}