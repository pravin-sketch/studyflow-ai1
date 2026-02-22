import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  X,
  Download,
  Loader2,
  AlertCircle,
  HardDrive,
  File,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const API_BASE = "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  filename: string;
  user_email: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
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

const totalSize = (docs: Document[]) => {
  const total = docs.reduce((acc, d) => acc + (d.file_size || 0), 0);
  return fmtSize(total);
};

const fileTypeBadge = (type: string): React.CSSProperties & { label: string } => {
  const t = (type || "").toLowerCase();
  // Handle both extension strings and MIME types
  if (t.includes("pdf")) return { background: "#fef2f2", color: "#dc2626", label: "PDF" };
  if (t.includes("txt") || t.includes("plain")) return { background: "#eff6ff", color: "#2563eb", label: "TXT" };
  if (t.includes("docx") || t.includes("wordprocessingml")) return { background: "#f0fdf4", color: "#16a34a", label: "DOCX" };
  if (t.includes("doc") || t.includes("msword")) return { background: "#f5f3ff", color: "#7c3aed", label: "DOC" };
  return { background: "#f9fafb", color: "#6b7280", label: (type || "FILE").split("/").pop()?.toUpperCase() || "FILE" };
};

const FileIcon = ({ type }: { type: string }) => {
  const t = (type || "").toLowerCase();
  const color =
    t.includes("pdf") ? "#dc2626" :
    t.includes("txt") || t.includes("plain") ? "#2563eb" :
    t.includes("docx") || t.includes("wordprocessingml") ? "#16a34a" :
    t.includes("doc") || t.includes("msword") ? "#7c3aed" : "#6b7280";
  const bg =
    t.includes("pdf") ? "#fef2f2" :
    t.includes("txt") || t.includes("plain") ? "#eff6ff" :
    t.includes("docx") || t.includes("wordprocessingml") ? "#f0fdf4" :
    t.includes("doc") || t.includes("msword") ? "#f5f3ff" : "#f9fafb";

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      <File className="w-5 h-5" style={{ color }} />
    </div>
  );
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
  value: string | number;
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

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filtered, setFiltered] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const adminToken = localStorage.getItem("adminToken") || "";

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/documents`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      const list: Document[] = Array.isArray(data) ? data : data.documents || [];
      setDocuments(list);
      setFiltered(list);
    } catch {
      setError("Could not load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      documents.filter(
        (d) =>
          d.filename.toLowerCase().includes(q) ||
          (d.user_email || "").toLowerCase().includes(q)
      )
    );
  }, [search, documents]);

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.id);
    try {
      const res = await fetch(`${API_BASE}/admin/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
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

  // Normalize MIME type to simple key for grouping
  const getTypeKey = (mime: string) => {
    const t = (mime || "").toLowerCase();
    if (t.includes("pdf")) return "pdf";
    if (t.includes("plain") || t.includes("txt")) return "txt";
    if (t.includes("wordprocessingml") || t.includes("docx")) return "docx";
    if (t.includes("msword") || t.includes("doc")) return "doc";
    return "other";
  };

  // Group by normalized type for stats
  const typeCounts = documents.reduce<Record<string, number>>((acc, d) => {
    const key = getTypeKey(d.file_type);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout activePage="documents">
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-1">All user-uploaded documents across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
                <div className="w-16 h-7 bg-gray-100 rounded mb-2" />
                <div className="w-24 h-4 bg-gray-100 rounded" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                icon={FileText}
                label="Total Documents"
                value={documents.length}
                color="#3b82f6"
                bg="#eff6ff"
              />
              <StatCard
                icon={HardDrive}
                label="Total Storage"
                value={totalSize(documents)}
                color="#10b981"
                bg="#f0fdf4"
              />
              <StatCard
                icon={File}
                label="PDF Files"
                value={typeCounts["pdf"] || 0}
                color="#dc2626"
                bg="#fef2f2"
              />
              <StatCard
                icon={FileText}
                label="Word / Text Files"
                value={
                  (typeCounts["txt"] || 0) +
                  (typeCounts["doc"] || 0) +
                  (typeCounts["docx"] || 0) +
                  (typeCounts["other"] || 0)
                }
                color="#7c3aed"
                bg="#f5f3ff"
              />
            </>
          )}
        </div>

        {/* Documents table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">All Documents</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} documents</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename or email…"
                className="pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-full sm:w-72"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 flex-col gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={fetchDocuments}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 flex-col gap-3">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-gray-400 text-sm">
                {search ? "No documents match your search" : "No documents found"}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((doc) => {
                    const badge = fileTypeBadge(doc.file_type);
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Filename */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon type={doc.file_type} />
                            <div>
                              <div className="font-medium text-gray-800 truncate max-w-[200px]">
                                {doc.filename}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* User email */}
                        <td className="px-6 py-4">
                          <span className="text-gray-500 truncate max-w-[180px] block">
                            {doc.user_email || "—"}
                          </span>
                        </td>
                        {/* Type badge */}
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: badge.background, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        {/* Size */}
                        <td className="px-6 py-4 text-gray-500">
                          {fmtSize(doc.file_size)}
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4 text-gray-500">
                          {fmtDate(doc.uploaded_at)}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
