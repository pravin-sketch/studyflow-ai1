import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Zap, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate sending reset email (no backend reset yet — shows success UI)
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast({ title: "Reset link sent!", description: "Check your inbox for the password reset link." });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 hero-gradient rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">StudyFlow AI</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {!sent ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                We've sent a password reset link to <strong className="text-gray-700">{email}</strong>.
                Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
