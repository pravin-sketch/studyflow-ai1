import { useState, useEffect, useCallback } from "react";
import {
  Users,
  FileText,
  BarChart3,
  Eye,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  X,
  MessageSquare,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { API_BASE } from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_users: number;
  blocked_users: number;
  total_documents: number;
  total_ai_calls: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  ai_usage_count: number;
  ai_tokens_used: number;
  is_blocked: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface UserHistory {
  sessions: Session[];
  documents: Document[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const avatarColor = (email: string) => {
  const colors = [
    "#3b82f6", "#7c3aed", "#10b981", "#f59e0b",
    "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className="rounded-xl p-2.5" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500 font-medium">{label}</div>
  </div>
);

// ─── User History Modal ───────────────────────────────────────────────────────

const UserHistoryModal = ({
  user,
  onClose,
  adminToken,
}: {
  user: User;
  onClose: () => void;
  adminToken: string;
}) => {
  const [tab, setTab] = useState<"chat" | "docs">("chat");
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users/${user.id}/history`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        // API returns chat_sessions, normalize to sessions
        setHistory({
          sessions: data.chat_sessions || data.sessions || [],
          documents: data.documents || [],
        });
      } catch {
        setError("Failed to load user history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id, adminToken]);

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDownload = async (docId: string, filename: string) => {
    setDownloading(docId);
    try {
      const res = await fetch(`${API_BASE}/admin/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail - user can retry
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: avatarColor(user.email) }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-500">User Activity History</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-gray-100">
          {[
            { key: "chat", label: "Chat History", icon: MessageSquare },
            { key: "docs", label: "Documents", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as "chat" | "docs")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150 -mb-px ${
                tab === key
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 flex-col gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : tab === "chat" ? (
            <div className="space-y-3">
              {!history?.sessions?.length ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No chat sessions found</p>
                </div>
              ) : (
                history.sessions.map((session) => {
                  const expanded = expandedSessions.has(session.id);
                  return (
                    <div key={session.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSession(session.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-800 truncate max-w-xs">
                              {session.title || "Untitled Session"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{fmtDate(session.created_at)}</span>
                              <span className="text-xs text-gray-400">·</span>
                              <span className="text-xs text-gray-400">
                                {session.messages?.length || 0} messages
                              </span>
                            </div>
                          </div>
                        </div>
                        {expanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {expanded && (
                        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                          {!session.messages?.length ? (
                            <p className="px-4 py-3 text-sm text-gray-400">No messages in this session.</p>
                          ) : (
                            session.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`px-4 py-3 flex gap-3 ${
                                  msg.role === "user" ? "bg-blue-50/40" : "bg-white"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                    msg.role === "user"
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-purple-100 text-purple-600"
                                  }`}
                                >
                                  {msg.role === "user" ? "U" : "AI"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                                    {msg.content}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">{fmtDate(msg.created_at)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!history?.documents?.length ? (
                <div className="text-center text-gray-400 py-12">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No documents uploaded</p>
                </div>
              ) : (
                history.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.filename}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: fileTypeBadge(doc.file_type).background, color: fileTypeBadge(doc.file_type).color }}
                        >
                          {fileTypeBadge(doc.file_type).label}
                        </span>
                        <span className="text-xs text-gray-400">{fmtSize(doc.file_size)}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{fmtDate(doc.uploaded_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.id, doc.filename)}
                      disabled={downloading === doc.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      {downloading === doc.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── File type badge helper ───────────────────────────────────────────────────

const fileTypeBadge = (type: string) => {
  const t = (type || "").toLowerCase();
  // Handle both extension strings ("pdf") and MIME types ("application/pdf")
  if (t.includes("pdf")) return { background: "#fef2f2", color: "#dc2626", label: "PDF" };
  if (t.includes("txt") || t.includes("plain")) return { background: "#eff6ff", color: "#2563eb", label: "TXT" };
  if (t.includes("docx") || t.includes("wordprocessingml")) return { background: "#f0fdf4", color: "#16a34a", label: "DOCX" };
  if (t.includes("doc") || t.includes("msword")) return { background: "#f5f3ff", color: "#7c3aed", label: "DOC" };
  return { background: "#f9fafb", color: "#6b7280", label: (type || "FILE").split("/").pop()?.toUpperCase() || "FILE" };
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  const adminToken = localStorage.getItem("adminToken") || "";

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // API returns { status, stats: { total_users, blocked_users, ... } }
      setStats(data.stats || data);
    } catch {
      setStatsError("Could not load stats.");
    } finally {
      setLoadingStats(false);
    }
  }, [adminToken]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const list: User[] = Array.isArray(data) ? data : data.users || [];
      setUsers(list);
      setFilteredUsers(list);
    } catch {
      setUsersError("Could not load users.");
    } finally {
      setLoadingUsers(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    // Auto-refresh stats every 30 seconds for real-time AI call counts
    const interval = setInterval(() => {
      fetchStats();
      fetchUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredUsers(
      users.filter((u) => u.email.toLowerCase().includes(q))
    );
  }, [search, users]);

  const toggleBlock = async (user: User) => {
    setTogglingUser(user.id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
      );
    } catch {
      // silently fail
    } finally {
      setTogglingUser(null);
    }
  };

  return (
    <AdminLayout activePage="dashboard">
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of your platform activity</p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchUsers(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-5 mb-8">
          {loadingStats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
                <div className="w-16 h-7 bg-gray-100 rounded mb-2" />
                <div className="w-24 h-4 bg-gray-100 rounded" />
              </div>
            ))
          ) : statsError ? (
            <div className="col-span-3 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {statsError}
            </div>
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats?.total_users ?? 0}
                color="#3b82f6"
                bg="#eff6ff"
              />
              <StatCard
                icon={FileText}
                label="Total Documents"
                value={stats?.total_documents ?? 0}
                color="#10b981"
                bg="#f0fdf4"
              />
              <StatCard
                icon={BarChart3}
                label="Total AI Calls"
                value={stats?.total_ai_calls ?? 0}
                color="#7c3aed"
                bg="#f5f3ff"
              />
            </>
          )}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filteredUsers.length} users total</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-60"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : usersError ? (
            <div className="flex items-center justify-center py-16 flex-col gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-gray-500 text-sm">{usersError}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-16 flex-col gap-3">
              <Users className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Calls</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: avatarColor(user.email) }}
                          >
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 truncate max-w-[180px]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Joined */}
                      <td className="px-6 py-4 text-gray-500">{user.created_at ? fmtDate(user.created_at) : "—"}</td>
                      {/* AI Calls */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-gray-700 font-medium">{user.ai_usage_count || 0}</span>
                        </div>
                      </td>
                      {/* Tokens */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-gray-700 font-medium">{(user.ai_tokens_used || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        {user.is_blocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View History
                          </button>
                          <button
                            onClick={() => toggleBlock(user)}
                            disabled={togglingUser === user.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                              user.is_blocked
                                ? "text-green-600 border-green-200 hover:bg-green-50"
                                : "text-red-500 border-red-200 hover:bg-red-50"
                            }`}
                          >
                            {togglingUser === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : user.is_blocked ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            {user.is_blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserHistoryModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          adminToken={adminToken}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
