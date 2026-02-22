import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Mail, Calendar, BarChart3, FileText, MessageSquare,
  ChevronDown, ChevronUp, Download, LogOut, ArrowLeft,
  Brain, Zap, Clock, Shield, BookOpen, Loader2, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/config";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

interface ChatSession {
  id: number;
  title: string;
  message_count: number;
  created_at: string | null;
  last_message_at: string | null;
  messages: ChatMessage[];
}

interface Document {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string | null;
}

interface UserProfile {
  id: number;
  email: string;
  created_at: string | null;
  ai_usage_count: number;
  ai_tokens_used: number;
  is_blocked: boolean;
  total_sessions: number;
  total_documents: number;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtTokens(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const fileTypeBadge = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("pdf")) return { bg: "bg-red-100 text-red-700", label: "PDF" };
  if (t.includes("txt") || t.includes("plain")) return { bg: "bg-blue-100 text-blue-700", label: "TXT" };
  if (t.includes("docx") || t.includes("wordprocessingml")) return { bg: "bg-green-100 text-green-700", label: "DOCX" };
  if (t.includes("doc") || t.includes("msword")) return { bg: "bg-purple-100 text-purple-700", label: "DOC" };
  return { bg: "bg-gray-100 text-gray-600", label: (type || "FILE").split("/").pop()?.toUpperCase() || "FILE" };
};

export default function Profile() {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chats" | "docs">("overview");

  const email = userEmail || localStorage.getItem("userEmail");

  useEffect(() => {
    if (!email) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [email]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/profile?email=${encodeURIComponent(email!)}`);
      const data = await res.json();
      if (data.status === "success") {
        setProfile(data.user);
        setSessions(data.chat_sessions || []);
        setDocuments(data.documents || []);
      } else {
        toast({ title: "Could not load profile", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("userId");
    localStorage.removeItem("chatSessions");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "AI Conversations",
      value: profile?.ai_usage_count ?? 0,
      icon: Brain,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Tokens Used",
      value: fmtTokens(profile?.ai_tokens_used ?? 0),
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      label: "Chat Sessions",
      value: profile?.total_sessions ?? 0,
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      label: "Documents",
      value: profile?.total_documents ?? 0,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/chatbot" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProfile}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Profile Hero ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Gradient banner */}
          <div className="h-24 relative" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 60%, #059669 100%)" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #60a5fa, transparent 50%), radial-gradient(circle at 80% 20%, #a78bfa, transparent 50%)" }} />
          </div>

          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center -mt-10 mb-4" style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}>
              <User className="w-9 h-9 text-white" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{email}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {fmtDate(profile?.created_at ?? null)}
                  </span>
                  {profile?.is_blocked && (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                      <Shield className="w-3 h-3" /> Account Restricted
                    </span>
                  )}
                  {!profile?.is_blocked && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                      <Shield className="w-3 h-3" /> Active Account
                    </span>
                  )}
                </div>
              </div>
              <Link
                to="/chatbot"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
              >
                <MessageSquare className="w-4 h-4" />
                New Chat
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-5 flex flex-col gap-3`}>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {(["overview", "chats", "docs"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "overview" ? "Overview" : tab === "chats" ? `Chats (${sessions.length})` : `Documents (${documents.length})`}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Recent sessions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  Recent Chats
                </h2>
                {sessions.length > 3 && (
                  <button onClick={() => setActiveTab("chats")} className="text-xs text-blue-600 hover:underline">
                    View all →
                  </button>
                )}
              </div>
              {sessions.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No chats yet. <Link to="/chatbot" className="text-blue-600 hover:underline">Start a conversation!</Link></p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sessions.slice(0, 3).map(s => (
                    <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.title || "Untitled Chat"}</p>
                          <p className="text-xs text-gray-400">{s.message_count} messages · {fmtDate(s.created_at)}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-4">
                        <Clock className="w-3 h-3" />
                        {fmtDate(s.last_message_at || s.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  Recent Documents
                </h2>
                {documents.length > 3 && (
                  <button onClick={() => setActiveTab("docs")} className="text-xs text-blue-600 hover:underline">
                    View all →
                  </button>
                )}
              </div>
              {documents.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {documents.slice(0, 3).map(d => {
                    const badge = fileTypeBadge(d.file_type);
                    return (
                      <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{d.filename}</p>
                            <p className="text-xs text-gray-400">{fmtSize(d.file_size)} · {fmtDate(d.uploaded_at)}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-4 ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chats Tab ── */}
        {activeTab === "chats" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                All Chat Sessions
                <span className="ml-1 text-xs text-gray-400 font-normal">({sessions.length})</span>
              </h2>
            </div>
            {sessions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                <p className="text-gray-400">No chat sessions yet.</p>
                <Link to="/chatbot" className="inline-block mt-3 text-sm text-blue-600 hover:underline font-medium">Start chatting →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map(s => (
                  <div key={s.id} className="hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.title || "Untitled Chat"}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">{s.message_count} messages</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {fmtDateTime(s.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedSession === s.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Expanded messages */}
                    {expandedSession === s.id && s.messages.length > 0 && (
                      <div className="px-6 pb-4 space-y-3 max-h-96 overflow-y-auto">
                        {s.messages.map((m, i) => (
                          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              m.role === "user" ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-green-400 to-emerald-500"
                            }`}>
                              {m.role === "user"
                                ? <User className="w-3.5 h-3.5 text-white" />
                                : <Brain className="w-3.5 h-3.5 text-white" />
                              }
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                              m.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-sm"
                                : "bg-gray-100 text-gray-800 rounded-tl-sm"
                            }`}>
                              <p className="whitespace-pre-wrap line-clamp-6">{m.content}</p>
                              {m.created_at && (
                                <p className={`text-xs mt-1 ${m.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                                  {fmtDateTime(m.created_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {expandedSession === s.id && s.messages.length === 0 && (
                      <p className="px-6 pb-4 text-sm text-gray-400">No messages in this session.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === "docs" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Uploaded Documents
                <span className="ml-1 text-xs text-gray-400 font-normal">({documents.length})</span>
              </h2>
            </div>
            {documents.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FileText className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                <p className="text-gray-400">No documents uploaded yet.</p>
                <Link to="/chatbot" className="inline-block mt-3 text-sm text-blue-600 hover:underline font-medium">Upload a document →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {documents.map(d => {
                  const badge = fileTypeBadge(d.file_type);
                  return (
                    <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{d.filename}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${badge.bg}`}>{badge.label}</span>
                            <span className="text-xs text-gray-400">{fmtSize(d.file_size)}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {fmtDate(d.uploaded_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${API_BASE}/admin/documents/${d.id}/download?token=${localStorage.getItem("adminToken") || ""}`}
                        className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Download"
                        download
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── AI Usage Card ── */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              AI Usage Summary
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{profile?.ai_usage_count ?? 0}</p>
                <p className="text-xs text-gray-500">Total AI Calls</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{fmtTokens(profile?.ai_tokens_used ?? 0)}</p>
                <p className="text-xs text-gray-500">Tokens Consumed</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {profile?.ai_usage_count ? Math.round((profile.ai_tokens_used ?? 0) / profile.ai_usage_count) : 0}
                </p>
                <p className="text-xs text-gray-500">Avg Tokens / Call</p>
              </div>
            </div>
          </div>
          {/* Usage bar */}
          {(profile?.ai_tokens_used ?? 0) > 0 && (
            <div className="px-6 pb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Token usage</span>
                <span>{fmtTokens(profile?.ai_tokens_used ?? 0)} used</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((profile?.ai_tokens_used ?? 0) / 100000) * 100)}%`,
                    background: "linear-gradient(90deg, #3b82f6, #7c3aed)",
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">of 100K token display limit</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
