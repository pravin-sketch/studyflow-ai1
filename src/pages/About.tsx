import { Link } from "react-router-dom";
import { Zap, Brain, Code2, FlaskConical, Coffee, MessageSquare, Sparkles, Target, Heart, Lightbulb } from "lucide-react";

const stats = [
  { value: "4", label: "Specialist AI Models", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  { value: "<1s", label: "Response Time", color: "text-green-600", bg: "bg-green-50 border-green-100" },
  { value: "100%", label: "Private & Local", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  { value: "∞", label: "Topics Supported", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
];

const models = [
  { icon: <Brain className="w-5 h-5" />, name: "LLaMA 3.3 70B", use: "General Q&A & academics", iconBg: "bg-blue-100", iconColor: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50" },
  { icon: <Code2 className="w-5 h-5" />, name: "GPT OSS 120B", use: "Programming & Computer Science", iconBg: "bg-green-100", iconColor: "text-green-600", border: "border-green-100", bg: "bg-green-50" },
  { icon: <FlaskConical className="w-5 h-5" />, name: "LLaMA 4 Maverick", use: "Science, Biology, Math", iconBg: "bg-purple-100", iconColor: "text-purple-600", border: "border-purple-100", bg: "bg-purple-50" },
  { icon: <Coffee className="w-5 h-5" />, name: "GPT OSS 20B", use: "Casual daily conversation", iconBg: "bg-orange-100", iconColor: "text-orange-600", border: "border-orange-100", bg: "bg-orange-50" },
];

const values = [
  { icon: <Target className="w-6 h-6" />, title: "Precision", desc: "The right AI model for every subject, every time.", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  { icon: <Lightbulb className="w-6 h-6" />, title: "Simplicity", desc: "Zero setup. Upload and start learning immediately.", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  { icon: <Heart className="w-6 h-6" />, title: "Accessibility", desc: "Free, fast, and available to every student worldwide.", color: "text-green-600", bg: "bg-green-50 border-green-100" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Hero */}
        <div className="text-center mb-20 fade-in-up">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 text-sm text-purple-600 font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" /> Our Mission
          </div>
          <h1 className="text-5xl font-black mb-6 text-gray-900">
            AI That Works <span className="gradient-text">For You</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            StudyFlow AI was built with one goal: give every student access to the right AI expert for their subject — instantly, with no setup.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {stats.map((s, i) => (
            <div key={i} className={`feature-card p-6 text-center border shadow-sm ${s.bg}`}>
              <div className={`text-4xl font-black mb-2 ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Why We Built This</h2>
          </div>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Students struggle not because they lack intelligence, but because they don't have access to the right expert at the right time. A biology student needs a different kind of help than a programmer — yet most AI tools treat all questions the same.
            </p>
            <p>
              StudyFlow AI changes that. By combining Groq's blazing-fast inference with intelligent model routing, we ensure your question always reaches the AI best equipped to answer it — whether that's a STEM specialist, a coding expert, or a general academic tutor.
            </p>
            <p>
              Upload a document, ask a question, or just start chatting — the AI does the rest.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {values.map((v, i) => (
            <div key={i} className={`feature-card p-6 border shadow-sm ${v.bg}`}>
              <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm ${v.color}`}>
                {v.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Models */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">The Models Behind StudyFlow</h2>
          <p className="text-gray-500 text-sm mb-6">Four specialist models, each an expert in their domain.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {models.map((m, i) => (
              <div key={i} className={`rounded-xl p-4 border flex items-center gap-4 shadow-sm ${m.bg} ${m.border}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                  <span className={m.iconColor}>{m.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-800">{m.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{m.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Start Learning Smarter Today</h2>
          <p className="text-gray-500 text-sm mb-6">No account needed. Just open the chat and go.</p>
          <Link
            to="/chatbot"
            className="inline-flex items-center gap-2 btn-primary rounded-2xl px-8 py-4 text-base font-semibold z-10 relative"
          >
            <MessageSquare className="w-5 h-5" /> Start Learning Now
          </Link>
        </div>
      </div>
    </div>
  );
}
