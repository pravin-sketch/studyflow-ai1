import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight, Loader2, Sparkles, BookOpen, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "../config";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-green-400"];
  const strengthLabels = ["", "Too short", "Good", "Strong"];
  const strengthTextColors = ["", "text-red-500", "text-yellow-500", "text-green-600"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Account created!", description: "Please sign in to continue." });
        navigate("/login");
      } else {
        throw new Error(data.message || "Signup failed");
      }
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #059669 100%)" }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 50%), radial-gradient(circle at 20% 80%, #60a5fa 0%, transparent 50%)"
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">StudyFlow AI</div>
            <div className="text-purple-200 text-xs font-medium tracking-wider uppercase">Smart Learning</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Join Thousands<br />
            <span className="text-purple-200">of Smart Learners</span>
          </h2>
          <p className="text-purple-100 text-lg leading-relaxed max-w-sm">
            Create your free account and unlock AI-powered tutoring that understands your subject automatically.
          </p>

          <div className="space-y-3 mt-10">
            {[
              { icon: BookOpen, text: "Upload any document — PDF, DOC, TXT" },
              { icon: Sparkles, text: "AI auto-detects your subject instantly" },
              { icon: Shield, text: "Your data stays private, always" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/15 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-purple-200 text-sm">Free forever · No credit card required</p>
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
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-500 text-sm mt-1">Start your AI-powered learning journey today — it's free</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
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

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map(level => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level ? strengthColors[passwordStrength] : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthTextColors[passwordStrength]}`}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : (
                  <>Create Free Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5" />
              Free forever · No credit card required
            </div>
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

export default Signup;
