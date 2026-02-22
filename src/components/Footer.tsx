import { Link, useLocation } from "react-router-dom";
import { Zap, Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  if (location.pathname === "/chatbot") return null;

  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">StudyFlow AI</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Intelligent AI tutoring powered by Groq. Automatically selects the best model for your subject — coding, science, general, or casual.
            </p>
            <div className="flex gap-3 mt-4">
              {[Github, Twitter, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2">
              {[["Chat", "/chatbot"], ["Features", "/features"], ["About", "/about"]].map(([name, href]) => (
                <li key={name}>
                  <Link to={href} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Models</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>LLaMA 3.3 70B</li>
              <li>GPT OSS 120B</li>
              <li>LLaMA 4 Maverick</li>
              <li>GPT OSS 20B</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© 2025 StudyFlow AI. All rights reserved.</p>
          <p className="text-xs text-gray-400">
            Powered by <span className="text-blue-500 font-medium">Groq</span> · Built for learners everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
