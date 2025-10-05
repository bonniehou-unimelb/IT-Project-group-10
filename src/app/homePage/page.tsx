"use client";
import HomePage from "./homepageTemplate";

// This file is only responsible for rendering HomePage
export default function Page() {
  return (
    <HomePage
      userRole="student"
      userName="Ben Conner"
      onNavigate={(page) => console.log("Navigating to:", page)}
    />
  );
}
