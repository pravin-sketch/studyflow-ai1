import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        localStorage.setItem("adminToken", data.token || "");
        localStorage.setItem("adminUser", data.admin?.username || username);
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #0f172a 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-64 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">StudyFlow AI</div>
            <div className="text-blue-200 text-xs font-medium tracking-wider uppercase">Admin Panel</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-8 backdrop-blur-sm">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Welcome to the<br />
            <span className="text-blue-300">Admin Portal</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Manage users, monitor platform activity, and control your StudyFlow AI ecosystem.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { icon: Users, label: "Total Users", value: "Manage" },
              { icon: FileText, label: "Documents", value: "Review" },
              { icon: BarChart3, label: "AI Calls", value: "Monitor" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white/10 rounded-xl p-4 border border-white/15 backdrop-blur-sm hover:bg-white/15 transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-blue-300 mb-2" />
                <div className="text-white font-semibold text-sm">{value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            Secured admin access · StudyFlow AI Platform
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Admin Panel</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #eff6ff, #f5f3ff)" }}>
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Sign In</h1>
              <p className="text-gray-500 text-sm mt-1">Enter your admin credentials to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? "#93c5fd"
                    : "linear-gradient(135deg, #3b82f6, #7c3aed)",
                  boxShadow: loading ? "none" : "0 4px 15px rgba(59, 130, 246, 0.35)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.35)";
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>

            {/* Hint */}
            <div className="mt-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Default Credentials</p>
              <p className="text-xs text-blue-500">
                Username: <span className="font-mono font-semibold">admin</span> &nbsp;·&nbsp; Password:{" "}
                <span className="font-mono font-semibold">admin123</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            StudyFlow AI Admin Portal · Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
