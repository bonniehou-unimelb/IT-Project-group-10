"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../authentication/auth";
const API_BACKEND_URL = "http://localhost:8000";

// Cookie reader
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  
  
  const router = useRouter();

  // Warm up cookie session
  useEffect(() => {
    fetch(`${API_BACKEND_URL}/token/`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    //Attempt API login call to backend server with login details
    try {
      // ensure we have a CSRF cookie (fallback if mount fetch hasn't run yet)
      await fetch(`${API_BACKEND_URL}/token/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }).catch(() => {});

      const csrf = getCookie("csrftoken");

      const auth_result = await fetch(`${API_BACKEND_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": csrf } : {}),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await auth_result.json().catch(() => ({}));

      if (!auth_result.ok || !data.success){
        console.log("Log in attempt failed");
        setError("Log in attempt failed");
        setIsLoading(false);
        return ;
      } else {
        console.log("Log in successful");
        await refresh();
        //Redirect logged in user to their dashboard
        router.push("/homePage");
      }
    } catch (err){
      console.log("Server error");
      setError("Server error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full max-w-md">
        {/* Login Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
          <div className="text-center space-y-2">
            <div className="w-32 h-32 bg-white/95 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl text-white">
                <Image src="icons/unimelb-logo.svg" alt="University of Melbourne" width={128} height={128}/>
              </span>
            </div>
            <h1 className="text-3xl font-bold bg-gray-900 bg-clip-text text-transparent">
               AI Use Scale Editor
            </h1>
            <p className="text-gray-900">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top duration-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-300 border-gray-600 rounded-xl text-gray-900 placeholder-gray-500 hover:bg-gray-100"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-300 border-gray-600 rounded-xl text-gray-900 placeholder-gray-500 hover:bg-gray-100"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? (
                    <Image 
                        src="icons/eye-closed.svg"
                        alt="Hide password"
                        width={20}
                        height={20}
                        className="opacity-70 hover:opacity-100 transition"
                        />
                    ) : (
                    <Image 
                        src="icons/eye-open.svg"
                        alt="Show password"
                        width={20}
                        height={20}
                        className="opacity-70 hover:opacity-100 transition"
                        />
                    )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-lg transition"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Extra Links */}
            <div className="text-center text-sm">
              <a href="#" className="text-blue-700 hover:underline">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
