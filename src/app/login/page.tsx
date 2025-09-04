"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "lol" && password === "enda") {
        console.log("Login successful");
        // redirect logic here
      } else if (email && password) {
        setError("Invalid Email or Password");
      }
    }, 1500);

    console.log("Form Submitted", { email, password });
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="relative w-full max-w-md">
            {/*Login Container*/}
            <div className = "bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-2xl text-white">🔒</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gray-900 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-900">
                        Sign in to your account
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top duration-300">
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="space-y-5">
                    {/* Email Field*/}
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
                </div>
            </div>
        </div>
    </div>
  );
}