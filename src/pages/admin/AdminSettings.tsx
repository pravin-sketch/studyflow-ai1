import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Eye, EyeOff, Key, Lock, CheckCircle, AlertCircle, Loader2, Save, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:5000";
const ADMIN_TOKEN = "admin-token-here";

export default function AdminSettings() {
  // ── Change Password ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── API Keys ─────────────────────────────────────────────────────────────
  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [maskedGroq, setMaskedGroq] = useState("");
  const [maskedGemini, setMaskedGemini] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysFetching, setKeysFetching] = useState(true);
  const [keysMsg, setKeysMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load masked API keys on mount
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/api-keys`, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setMaskedGroq(data.keys?.groq || "");
          setMaskedGemini(data.keys?.gemini || "");
        }
      } catch { /* server might be offline */ }
      finally { setKeysFetching(false); }
    };
    fetchKeys();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setPwLoading(true);
    try {
      const adminUser = localStorage.getItem("adminUser") || "admin";
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ username: adminUser, current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setPwMsg({ type: "success", text: "Password updated successfully!" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setPwMsg({ type: "error", text: data.message || "Failed to update password." });
      }
    } catch {
      setPwMsg({ type: "error", text: "Server error. Is Flask running?" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysMsg(null);
    if (!groqKey && !geminiKey) {
      setKeysMsg({ type: "error", text: "Enter at least one API key to save." });
      return;
    }
    setKeysLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ groq: groqKey, gemini: geminiKey }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setKeysMsg({ type: "success", text: `Saved: ${data.updated.join(", ")}` });
        // Refresh masked keys
        const r2 = await fetch(`${API_BASE}/admin/api-keys`, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });
        const d2 = await r2.json();
        if (d2.status === "success") {
          setMaskedGroq(d2.keys?.groq || "");
          setMaskedGemini(d2.keys?.gemini || "");
        }
        setGroqKey(""); setGeminiKey("");
      } else {
        setKeysMsg({ type: "error", text: data.message || "Failed to save keys." });
      }
    } catch {
      setKeysMsg({ type: "error", text: "Server error. Is Flask running?" });
    } finally {
      setKeysLoading(false);
    }
  };

  return (
    <AdminLayout activePage="settings">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage admin password and API keys</p>
        </div>

        {/* ── Change Password ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-400">Update your admin account password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Message */}
            {pwMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                pwMsg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {pwMsg.type === "success"
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {pwLoading ? "Saving…" : "Update Password"}
            </button>
          </form>
        </div>

        {/* ── API Keys ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">API Keys</h2>
              <p className="text-xs text-gray-400">Add or update your AI provider API keys</p>
            </div>
          </div>

          <form onSubmit={handleSaveKeys} className="space-y-5">
            {/* Groq */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Groq API Key</label>
                {keysFetching ? (
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>
                ) : maskedGroq ? (
                  <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Key set: <code className="font-mono">{maskedGroq}</code>
                  </span>
                ) : (
                  <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">Not set</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGroq ? "text" : "password"}
                  value={groqKey}
                  onChange={e => setGroqKey(e.target.value)}
                  placeholder="gsk_••••••••••••••••••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                />
                <button type="button" onClick={() => setShowGroq(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Get your key at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">console.groq.com</a></p>
            </div>

            {/* Gemini */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Gemini API Key</label>
                {keysFetching ? (
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>
                ) : maskedGemini ? (
                  <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Key set: <code className="font-mono">{maskedGemini}</code>
                  </span>
                ) : (
                  <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">Not set</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIza••••••••••••••••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                />
                <button type="button" onClick={() => setShowGemini(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Get your key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">aistudio.google.com</a></p>
            </div>

            {/* Message */}
            {keysMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                keysMsg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {keysMsg.type === "success"
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {keysMsg.text}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={keysLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {keysLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {keysLoading ? "Saving…" : "Save API Keys"}
              </button>
              <button
                type="button"
                onClick={() => { setGroqKey(""); setGeminiKey(""); setKeysMsg(null); }}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-500 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Clear
              </button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
}
