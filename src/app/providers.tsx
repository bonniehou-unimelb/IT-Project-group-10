"use client";
import React from "react";
import { AuthProvider } from "./authentication/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
