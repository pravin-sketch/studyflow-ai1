import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Users,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: "dashboard" | "documents" | "settings";
}

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { key: "documents", label: "Documents", icon: FileText, path: "/admin/documents" },
  { key: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
] as const;

const AdminLayout = ({ children, activePage }: AdminLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const adminUser = localStorage.getItem("adminUser") || "Admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div
                className="text-sm font-bold leading-tight"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                StudyFlow Admin
              </div>
              <div className="text-xs text-gray-400 font-medium">Control Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
          </div>
          {navItems.map(({ key, label, icon: Icon, path }) => {
            const isActive = activePage === key;
            return (
              <Link
                key={key}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                style={
                  isActive
                    ? { background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }
                    : {}
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}

        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}
            >
              {adminUser.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{adminUser}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
