"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
const API_BACKEND_URL = "http://localhost:8000";

// setup user session cookie 
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;

  // Send POST request with a CSRF cookie
  async function ensureCsrf(): Promise<string | null> {
    let token = getCookie("csrftoken");
    if (!token) {
      const res = await fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" });
      try {
        const body = await res.json();
        token = body?.csrfToken || getCookie("csrftoken");
      } catch { ; }
    }
    return token;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check if passwords match before submitting
    if (!passwordsMatch) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    //Attempt API registration call to backend server with login details
    try {
      const csrftoken = await ensureCsrf();
      const auth_result = await fetch(`${API_BACKEND_URL}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", ...(csrftoken ? { "X-CSRFToken": csrftoken, "X-Requested-With": "XMLHttpRequest" } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          username: email, 
          password: password,
          first_name: firstName,
          last_name: lastName,
          role: role
        }),
      });

      const data = await auth_result.json().catch(() => ({}));
      console.log(data)

      if (!auth_result.ok || !data.success){
        console.log("Registration attempt failed");
        setError("Registration attempt failed");
        setIsLoading(false);
        return ;
      } else {
        console.log("Registration successful");
        //Redirect registered user to their dashboard
        // TO DO: redirect according to their user role
        router.push("/login");
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
        {/* Registration Container */}
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
            <p className="text-gray-900">Register an Account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top duration-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First & Last Name Fields */}
            <div className="flex gap-4">
              {/* First Name */}
              <div className="flex-1 space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700"> 
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-300 border-gray-600 rounded-xl text-gray-900 placeholder-gray-500 hover:bg-gray-100"
                  placeholder="Enter first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="flex-1 space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-300 border-gray-600 rounded-xl text-gray-900 placeholder-gray-500 hover:bg-gray-100"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            {/* Role Dropdown */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 bg-gray-300 border-gray-600 rounded-xl text-gray-900 hover:bg-gray-100"
                  required
                >
                  <option value="STAFF">Staff</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl text-gray-900 placeholder-gray-500 hover:bg-gray-100 ${
                    showPasswordMismatch 
                      ? 'bg-red-50 border-red-300' 
                      : 'bg-gray-300 border-gray-600'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                >
                  {showConfirmPassword ? (
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
              {/* Password mismatch warning */}
              {showPasswordMismatch && (
                <p className="text-red-600 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || password.length === 0}
              className="w-full py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition"
            >
              {isLoading ? "Registering..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}