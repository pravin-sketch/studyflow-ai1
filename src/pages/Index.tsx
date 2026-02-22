import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Brain, Code2, FlaskConical, Coffee, Zap, MessageSquare, Upload, Star, ChevronRight, Shield } from "lucide-react";

const models = [
  { icon: <Brain className="w-5 h-5" />, name: "LLaMA 3.3 70B", tag: "General Q&A", color: "from-blue-50 to-cyan-50 border-blue-200 text-blue-600", iconBg: "bg-blue-100 text-blue-600" },
  { icon: <Code2 className="w-5 h-5" />, name: "GPT OSS 120B", tag: "Coding & CS", color: "from-green-50 to-emerald-50 border-green-200 text-green-600", iconBg: "bg-green-100 text-green-600" },
  { icon: <FlaskConical className="w-5 h-5" />, name: "LLaMA 4 Maverick", tag: "Science & Math", color: "from-purple-50 to-violet-50 border-purple-200 text-purple-600", iconBg: "bg-purple-100 text-purple-600" },
  { icon: <Coffee className="w-5 h-5" />, name: "GPT OSS 20B", tag: "Casual Chat", color: "from-orange-50 to-amber-50 border-orange-200 text-orange-600", iconBg: "bg-orange-100 text-orange-600" },
];

const steps = [
  { icon: <MessageSquare className="w-6 h-6" />, title: "Open the Chat", desc: "Jump straight into conversation — no setup needed.", color: "from-blue-500 to-blue-600" },
  { icon: <Upload className="w-6 h-6" />, title: "Upload a Document", desc: "PDF, DOC, DOCX or TXT — any study material you have.", color: "from-purple-500 to-purple-600" },
  { icon: <Brain className="w-6 h-6" />, title: "AI Detects the Topic", desc: "Groq reads your document and identifies the subject automatically.", color: "from-green-500 to-green-600" },
  { icon: <Zap className="w-6 h-6" />, title: "Best Model Activated", desc: "The perfect specialist LLM is selected just for your content.", color: "from-orange-500 to-orange-600" },
];

const features = [
  { icon: "🤖", title: "Smart Model Routing", desc: "Automatically picks the best AI model — coding, science, general, or casual — based on your document.", color: "bg-blue-50 border-blue-100" },
  { icon: "⚡", title: "Groq-Powered Speed", desc: "Groq's LPU inference delivers sub-second responses that feel instant.", color: "bg-purple-50 border-purple-100" },
  { icon: "📄", title: "Document Intelligence", desc: "Upload PDF, Word, or text files. The AI reads and masters them in seconds.", color: "bg-green-50 border-green-100" },
  { icon: "💬", title: "Chat History", desc: "Multiple chat sessions saved in your sidebar. Switch between topics seamlessly.", color: "bg-orange-50 border-orange-100" },
  { icon: "🎨", title: "Beautiful Animations", desc: "Every interaction has satisfying micro-animations and loading states.", color: "bg-pink-50 border-pink-100" },
  { icon: "🔒", title: "Private & Fast", desc: "Your documents stay in your browser. No storage, no tracking.", color: "bg-cyan-50 border-cyan-100" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid pt-16">
        {/* Soft colour blobs */}
        <div className="hero-blob w-[600px] h-[600px] bg-blue-400 top-[-100px] left-[-200px]" />
        <div className="hero-blob w-[400px] h-[400px] bg-purple-400 bottom-[-50px] right-[-100px]" style={{ animationDelay: "2s" }} />
        <div className="hero-blob w-[300px] h-[300px] bg-green-400 top-[40%] right-[20%]" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 container mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-600 font-medium mb-8 fade-in-up shadow-sm">
            <Sparkles className="w-4 h-4" />
            Powered by Groq · 4 Specialist AI Models
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 fade-in-up leading-tight text-gray-900" style={{ animationDelay: "0.1s" }}>
            The AI That{" "}
            <span className="gradient-text">Chooses Itself</span>
            <br />For Your Topic
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 fade-in-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Upload any document — textbook, code file, research paper — and StudyFlow AI
            automatically routes to the <strong className="text-gray-700">best specialist model</strong> for your subject.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link
              to="/chatbot"
              className="inline-flex items-center justify-center gap-2 btn-primary rounded-2xl px-8 py-4 text-base font-semibold z-10 relative"
            >
              <MessageSquare className="w-5 h-5" /> Start Chatting Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl px-8 py-4 text-base font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              See Features <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Model pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-12 fade-in-up" style={{ animationDelay: "0.5s" }}>
            {models.map((m, i) => (
              <div key={i} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium bg-gradient-to-r border shadow-sm ${m.color}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${m.iconBg}`}>{m.icon}</span>
                {m.name} · {m.tag}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 fade-in-up" style={{ animationDelay: "0.6s" }}>
            {[
              { label: "Students Using It", value: "10,000+" },
              { label: "AI Models Available", value: "4" },
              { label: "Avg Response Time", value: "< 1s" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black gradient-text">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-300 animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-gray-300" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 relative bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 text-xs text-purple-600 font-semibold mb-4">
              Simple Process
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Four steps from zero to expert AI tutoring</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="feature-card p-6 text-center relative group shadow-sm">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <span className="text-white">{step.icon}</span>
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODELS SECTION ── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-xs text-green-600 font-semibold mb-4">
              AI Models
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              <span className="gradient-text">4 Specialist Models</span>, 1 Smart Router
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              No more picking the wrong AI. Our router analyzes your document and activates the perfect expert.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {models.map((m, i) => (
              <div key={i} className={`feature-card p-5 bg-gradient-to-br border shadow-sm ${m.color}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${m.iconBg}`}>
                  {m.icon}
                </div>
                <h3 className="font-bold text-sm mb-1 text-gray-800">{m.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{m.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-xs text-blue-600 font-semibold mb-4">
              Features
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Everything You Need</h2>
            <p className="text-gray-500 text-lg">Built for students who want results, not complexity</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <div key={i} className={`feature-card p-6 border shadow-sm ${f.color}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / TRUST ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
            "StudyFlow AI figured out I was studying biochemistry from my PDF and immediately switched to the science model. It answered things my textbook couldn't explain."
          </p>
          <p className="text-sm text-gray-400 mt-4">— Medical student, Year 2</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="hero-blob w-[500px] h-[500px] bg-blue-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8" />
        <div className="hero-blob w-[300px] h-[300px] bg-purple-400 top-0 right-0 opacity-8" />
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xl p-12">
            <div className="w-16 h-16 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-4 text-gray-900">
              Ready to Study <span className="gradient-text">Smarter?</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
              Join thousands of students already using AI-powered tutoring that adapts to their subject.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/chatbot"
                className="inline-flex items-center justify-center gap-2 btn-primary rounded-2xl px-8 py-4 text-base font-bold z-10 relative"
              >
                <Sparkles className="w-5 h-5" /> Launch StudyFlow AI <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-8 py-4 text-base font-medium text-gray-600 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                Create Free Account
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> No credit card required · Free to use
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
