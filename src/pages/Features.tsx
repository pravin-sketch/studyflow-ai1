import { Link } from "react-router-dom";
import { Brain, Code2, FlaskConical, Coffee, Zap, Upload, MessageSquare, Sparkles, Shield, Clock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-7 h-7" />,
    title: "Smart Model Routing",
    desc: "Our AI analyzes your document's topic and automatically selects the most capable specialist model — no manual configuration needed.",
    bg: "bg-blue-50 border-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <Code2 className="w-7 h-7" />,
    title: "Coding Expert (GPT OSS 120B)",
    desc: "For programming, algorithms, data structures, and computer science topics. Includes syntax highlighting and code explanation.",
    bg: "bg-green-50 border-green-100",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: <FlaskConical className="w-7 h-7" />,
    title: "STEM Specialist (LLaMA 4 Maverick)",
    desc: "Optimized for biology, chemistry, physics, and mathematics. Step-by-step problem solving and scientific explanations.",
    bg: "bg-purple-50 border-purple-100",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    title: "General Knowledge (LLaMA 3.3 70B)",
    desc: "History, literature, business, law, economics — broad academic knowledge with clear structured answers.",
    bg: "bg-cyan-50 border-cyan-100",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    icon: <Coffee className="w-7 h-7" />,
    title: "Casual Assistant (GPT OSS 20B)",
    desc: "Friendly conversational AI for everyday questions, creative writing, and general chat.",
    bg: "bg-orange-50 border-orange-100",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: <Upload className="w-7 h-7" />,
    title: "Document Intelligence",
    desc: "Upload PDF, Word, or text files. The AI reads the full document and answers questions about it instantly.",
    bg: "bg-pink-50 border-pink-100",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Groq-Powered Speed",
    desc: "Groq's custom LPU hardware delivers sub-second inference — responses feel truly instant.",
    bg: "bg-yellow-50 border-yellow-100",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Private by Design",
    desc: "Documents are processed in your browser and never stored on external servers.",
    bg: "bg-gray-50 border-gray-200",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: "Chat History",
    desc: "Multiple sessions saved locally in your sidebar. Switch between study topics without losing context.",
    bg: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-16">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16 fade-in-up">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-600 font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" /> Everything included
          </div>
          <h1 className="text-5xl font-black mb-4 text-gray-900">
            Built for <span className="gradient-text">Serious Learners</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Every feature is designed to make studying faster, smarter, and more effective.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-16">
          {features.map((f, i) => (
            <div
              key={i}
              className={`feature-card p-6 border shadow-sm ${f.bg}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                <span className={f.iconColor}>{f.icon}</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
            <div className="w-14 h-14 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-5 pulse-glow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to try it?</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              No sign-up required. Start chatting with your AI tutor in seconds.
            </p>
            <Link
              to="/chatbot"
              className="inline-flex items-center gap-2 btn-primary rounded-2xl px-8 py-4 text-base font-semibold z-10 relative"
            >
              <MessageSquare className="w-5 h-5" /> Try It Now — It's Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
