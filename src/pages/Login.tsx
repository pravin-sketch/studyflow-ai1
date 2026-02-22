import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight, Loader2, BookOpen, Brain, Sparkles, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get("blocked") === "1") {
      const blockedEmail = localStorage.getItem("blockedEmail") || "Your account";
      setBlockedMsg(`${blockedEmail} has been blocked by an administrator. Please contact support.`);
      localStorage.removeItem("blockedEmail");
    }
    if (searchParams.get("session_expired") === "1") {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        // Store email and userId for API calls (chat save, usage tracking)
        localStorage.setItem("userEmail", email);
        if (data.user?.id) localStorage.setItem("userId", String(data.user.id));
        login(email, data.token || "token");
        toast({ title: "Welcome back!", description: "Logged in successfully." });
        navigate("/chatbot");
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #059669 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%)"
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">StudyFlow AI</div>
            <div className="text-blue-200 text-xs font-medium tracking-wider uppercase">Smart Learning</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Learn Smarter<br />
            <span className="text-blue-200">With AI That Adapts</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Upload any document and let our AI automatically pick the best specialist model for your subject.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: BookOpen, label: "Any Subject", value: "Covered" },
              { icon: Brain, label: "AI Models", value: "4 Active" },
              { icon: Sparkles, label: "Response", value: "< 1 sec" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 border border-white/15 backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                <Icon className="w-5 h-5 text-blue-200 mb-2" />
                <div className="text-white font-semibold text-sm">{value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-sm">StudyFlow AI · Intelligent tutoring for every learner</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 hero-gradient rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">StudyFlow AI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Blocked account banner */}
            {blockedMsg && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <ShieldOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Account Blocked</p>
                  <p className="text-xs text-red-500 mt-0.5">{blockedMsg}</p>
                </div>
              </div>
            )}
            {/* Session expired banner */}
            {sessionExpired && !blockedMsg && (
              <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <ShieldOff className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Session Expired</p>
                  <p className="text-xs text-amber-600 mt-0.5">Your session has expired. Please sign in again.</p>
                </div>
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to continue your learning journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
                Forgot password?
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center mt-4">
            <Link to="/chatbot" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Continue without signing in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
