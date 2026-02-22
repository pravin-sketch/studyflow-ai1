import { ArrowRight, Upload, Brain, MessageCircle, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Upload,
    title: "Upload Study Material",
    description: "Share your PDF, Word, or text files with StudyFlow AI. It reads the full document instantly.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    icon: Brain,
    title: "AI Detects the Topic",
    description: "Our AI analyzes your document and automatically picks the best specialist model for that subject.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    iconBg: "bg-purple-100",
  },
  {
    icon: MessageCircle,
    title: "Ask Any Question",
    description: "Chat naturally about the document or any topic. The AI answers with full context from your material.",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
    iconBg: "bg-green-100",
  },
  {
    icon: Target,
    title: "Learn Smarter",
    description: "Use flashcards, quizzes, summaries and voice input to study faster and retain more.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    iconBg: "bg-orange-100",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-16">
      {/* Hero */}
      <div className="text-center mb-16 fade-in-up container mx-auto px-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-600 font-medium mb-6 shadow-sm">
          <Zap className="w-4 h-4" /> Simple & Powerful
        </div>
        <h1 className="text-5xl font-black mb-4 text-gray-900">
          How <span className="gradient-text">StudyFlow AI</span> Works
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          From upload to understanding in seconds — no setup, no complexity.
        </p>
      </div>

      {/* Steps */}
      <div className="container mx-auto px-6 max-w-5xl mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-12 left-full w-5 items-center justify-center z-10 -translate-x-2.5">
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
              <div className={`feature-card p-6 border shadow-sm ${step.bg} ${step.border} h-full`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.iconBg}`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className={`w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center text-xs font-bold ${step.color} border-current`}>
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed flow */}
      <div className="container mx-auto px-6 max-w-4xl mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Learning Flow</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
            <h3 className="font-bold text-blue-700 mb-2">📄 Smart Document Analysis</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload any PDF, Word, or text file. Our RAG system splits the document into chunks and retrieves the most relevant sections for each question — even for 10MB+ documents.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-purple-700 mb-2">🤖 Automatic Model Selection</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Each message is analyzed and routed to the best Groq model — LLaMA 3.3 70B for general, coding, and STEM topics, or LLaMA3 8B for casual conversation.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
            <h3 className="font-bold text-green-700 mb-2">🎓 Study Tools Built In</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Generate AI flashcards and quizzes from any document, export chat history, use voice input via Groq Whisper, and get one-click AI summaries.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-6 text-center">
        <div className="inline-block bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to try it?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Upload a document and start learning in under 10 seconds.
          </p>
          <Link
            to="/chatbot"
            className="inline-flex items-center gap-2 btn-primary rounded-2xl px-8 py-4 text-base font-semibold z-10 relative"
          >
            <MessageCircle className="w-5 h-5" /> Start Learning Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
