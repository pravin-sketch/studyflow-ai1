import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Zap, MessageSquare, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (location.pathname === "/chatbot") return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm"
          : "bg-white/80 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform pulse-glow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">StudyFlow AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              asChild
              className="btn-primary rounded-xl h-9 px-4 text-sm gap-2 z-10 relative"
            >
              <Link to="/chatbot">
                <MessageSquare className="w-4 h-4" /> Open Chat
              </Link>
            </Button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 max-w-[150px] truncate bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
                >
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                asChild
                variant="ghost"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-sm gap-1.5 ml-1"
              >
                <Link to="/login"><User className="w-4 h-4" /> Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-gray-100 fade-in-up">
            <div className="flex flex-col space-y-1 mt-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/chatbot"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hero-gradient mt-1"
              >
                <MessageSquare className="w-4 h-4" /> Open Chat
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="text-sm text-red-500 text-left px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm text-gray-500 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
