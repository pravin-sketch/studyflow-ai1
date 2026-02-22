import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2, Sparkles, Phone, MapPin, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    toast({ title: "Message sent! ✨", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const faqs = [
    { q: "How does model routing work?", a: "When you upload a document, our AI analyzes the first few thousand words to detect the subject area, then selects the best specialist model for that topic." },
    { q: "Is my data private?", a: "Yes. Documents are processed in your browser session and never stored on our servers." },
    { q: "What file types are supported?", a: "PDF, TXT, DOC, and DOCX files are fully supported." },
    { q: "Do I need an account?", a: "No! You can use the chatbot without signing up. An account lets you save preferences." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-16 fade-in-up">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm text-green-600 font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" /> Get in touch
          </div>
          <h1 className="text-5xl font-black mb-4 text-gray-900">
            We'd Love to <span className="gradient-text">Hear From You</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Questions, feedback, or ideas? Send us a message and we'll respond quickly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>

            {sent && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                Message sent! We'll get back to you within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="What's this about?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us what's on your mind…"
                  rows={5}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none input-glow transition-all duration-200 focus:bg-white resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 z-10 relative disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send Message</>
                }
              </button>
            </form>
          </div>

          {/* Right side */}
          <div className="space-y-5">
            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Info</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@studyflow.ai"
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Email Support</p>
                    <p className="text-xs text-gray-500">support@studyflow.ai</p>
                  </div>
                </a>
                <Link
                  to="/chatbot"
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all group"
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Open ChatBot</p>
                    <p className="text-xs text-gray-500">Start chatting right now</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Response Time</p>
                    <p className="text-xs text-gray-500">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked</h3>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{faq.q}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
