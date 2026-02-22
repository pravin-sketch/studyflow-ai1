import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Send, Upload, Paperclip, X, Sparkles, Bot, User, ChevronDown, Plus, MessageSquare, Trash2, Menu, Zap, Brain, Code2, FlaskConical, Coffee, Mic, Download, BookOpen, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import {
  sendMessageToGroq,
  detectDocumentTopic,
  detectQuestionCategory,
  extractTextFromFile,
  buildSystemPrompt,
  buildRagIndex,
  summarizeDocument,
  transcribeAudio,
  GROQ_MODELS,
  type DetectedTopic,
  type GroqMessage,
  type TopicCategory,
  type RagIndex,
} from "@/lib/groq-api";
import { API_BASE } from "@/config";
import StudyToolsModal from "@/components/chat/StudyToolsModal";
import VoiceRecorderModal from "@/components/chat/VoiceRecorderModal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  topic: DetectedTopic | null;
  docContent: string;            // kept in memory only (not localStorage) for RAG
  hasDoc: boolean;               // true if a doc was uploaded (survives localStorage)
  docName: string;               // original filename (survives localStorage)
  createdAt: Date;
  dbSessionId?: number | null;
  activeModel?: string;
  activeCategory?: TopicCategory;
}

// ── API helpers ───────────────────────────────────────────────────────────────
function getUserEmail(): string | null {
  return localStorage.getItem("userEmail");
}

// Returns { sessionId, blocked } — blocked=true means user was blocked server-side
async function apiCreateSession(title: string): Promise<{ sessionId: number | null; blocked: boolean }> {
  const email = getUserEmail();
  if (!email) return { sessionId: null, blocked: false };
  try {
    const res = await fetch(`${API_BASE}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Email": email },
      body: JSON.stringify({ user_email: email, title }),
    });
    if (res.status === 403) return { sessionId: null, blocked: true };
    const data = await res.json();
    return { sessionId: data.session_id ?? null, blocked: false };
  } catch { return { sessionId: null, blocked: false }; }
}

// Returns blocked=true if server returned 403
async function apiSaveMessage(dbSessionId: number, role: "user" | "assistant", content: string): Promise<boolean> {
  const email = getUserEmail();
  try {
    const res = await fetch(`${API_BASE}/chat/sessions/${dbSessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Email": email || "" },
      body: JSON.stringify({ role, content }),
    });
    return res.status === 403;
  } catch { return false; }
}

async function apiUploadDocument(file: File): Promise<void> {
  const email = getUserEmail();
  if (!email) return;
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("user_email", email);
    form.append("X-User-Email", email);
    await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: form });
  } catch { /* non-blocking */ }
}

async function apiTrackUsage(tokens = 0): Promise<void> {
  const email = getUserEmail();
  if (!email) return;
  try {
    await fetch(`${API_BASE}/users/track-usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Email": email },
      body: JSON.stringify({ tokens, user_email: email }),
    });
  } catch { /* non-blocking */ }
}

// ── Persist sessions to localStorage ─────────────────────────────────────────
// docContent is NOT saved to localStorage (can be 10MB+).
// We save hasDoc + docName so we can show a "re-upload" banner after refresh.
// The RAG index lives in a React ref (memory only) and is rebuilt on re-upload.
function saveSessions(sessions: ChatSession[]) {
  try {
    const toSave = sessions.map(s => ({
      ...s,
      docContent: "",          // never persist large doc text
      createdAt: s.createdAt.toISOString(),
      messages_serialized: s.messages.slice(-50).map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }));
    localStorage.setItem("chatSessions", JSON.stringify(toSave));
  } catch { /* storage full — ignore */ }
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem("chatSessions");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      docContent: "",          // always starts empty — RAG index rebuilt on re-upload
      hasDoc: s.hasDoc || false,
      docName: s.docName || "",
      messages: (s.messages_serialized || s.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch { return []; }
}

type UploadStatus = "idle" | "reading" | "analyzing" | "ready" | "error";

const MODEL_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 className="w-4 h-4" />,
  science: <FlaskConical className="w-4 h-4" />,
  general: <Brain className="w-4 h-4" />,
  casual: <Coffee className="w-4 h-4" />,
};

const MODEL_COLORS: Record<string, string> = {
  coding: "from-green-50 to-emerald-50 border-green-200 text-green-700",
  science: "from-purple-50 to-violet-50 border-purple-200 text-purple-700",
  general: "from-blue-50 to-cyan-50 border-blue-200 text-blue-700",
  casual: "from-orange-50 to-amber-50 border-orange-200 text-orange-700",
};

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function newSession(): ChatSession {
  return {
    id: generateId(),
    title: "New Chat",
    messages: [],
    topic: null,
    docContent: "",
    hasDoc: false,
    docName: "",
    createdAt: new Date(),
  };
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 message-ai">
      <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center flex-shrink-0 pulse-glow">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// ── Upload progress animation ────────────────────────────────────────────────
function UploadProgress({ status, fileName, topic }: { status: UploadStatus; fileName: string; topic: DetectedTopic | null }) {
  const steps = [
    { key: "reading", label: "Reading document…", icon: "📄" },
    { key: "analyzing", label: "Analyzing topic & selecting AI model…", icon: "🧠" },
    { key: "ready", label: "Ready! AI model selected", icon: "✅" },
  ];
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 space-y-4 topic-card-enter">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Paperclip className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
          <p className="text-xs text-gray-400">Processing file…</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const done = currentIdx > idx || status === "ready";
          const active = steps[currentIdx]?.key === step.key;
          return (
            <div key={step.key} className={`flex items-center gap-3 transition-all duration-500 ${done || active ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                done ? "bg-green-100 border border-green-300 text-green-600" :
                active ? "bg-blue-100 border border-blue-300 text-blue-600 pulse-glow" :
                "bg-gray-100 border border-gray-200 text-gray-400"
              }`}>
                {done ? "✓" : active ? <span className="animate-spin">◌</span> : idx + 1}
              </div>
              <span className={`text-sm ${active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>
                {step.icon} {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full hero-gradient transition-all duration-700 ease-out"
          style={{ width: status === "reading" ? "33%" : status === "analyzing" ? "66%" : status === "ready" ? "100%" : "0%" }}
        />
      </div>

      {/* Topic detection result */}
      {status === "ready" && topic && (
        <div className={`rounded-xl p-3 bg-gradient-to-r border ${MODEL_COLORS[topic.category]} topic-card-enter`}>
          <div className="flex items-center gap-2 mb-1">
            {MODEL_ICONS[topic.category]}
            <span className="text-sm font-semibold">{topic.emoji} {topic.subject} detected</span>
          </div>
          <p className="text-xs opacity-70">{topic.description}</p>
        </div>
      )}
    </div>
  );
}

// ── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse message-user" : "message-ai"}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-gradient-to-br from-blue-500 to-purple-600" : "hero-gradient pulse-glow"
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      {/* Bubble */}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
        isUser
          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-sm shadow-md"
          : "bg-white border border-gray-200 shadow-sm rounded-tl-sm"
      }`}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-gray-800 prose-dark">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <p className={`text-xs mt-1.5 ${isUser ? "opacity-60 text-white" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Main ChatBot component ───────────────────────────────────────────────────
export default function ChatBot() {
  const { toast } = useToast();
  const { handleBlockedResponse } = useAuth();

  // Load persisted sessions or start fresh
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded : [newSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded[0].id : sessions[0]?.id || "";
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showStudyTools, setShowStudyTools] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // RAG index lives in memory only — keyed by session id, never saved to localStorage
  // This allows 10MB+ documents without any localStorage size issues
  const ragIndexRef = useRef<Map<string, RagIndex>>(new Map());

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const handleFileUpload = async (file: File) => {
    const allowed = ["application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Please upload PDF, TXT, DOC, or DOCX", variant: "destructive" });
      return;
    }

    setUploadFileName(file.name);
    setUploadStatus("reading");

    try {
      const text = await extractTextFromFile(file);
      setUploadStatus("analyzing");

      // Detect topic AND upload to DB simultaneously
      const [topic] = await Promise.all([
        detectDocumentTopic(text),
        apiUploadDocument(file),
      ]);

      await new Promise(r => setTimeout(r, 600));
      setUploadStatus("ready");

      const welcomeMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `${topic.emoji} **Document analyzed!**\n\n**Subject:** ${topic.subject}\n**AI Model:** ${topic.description}\n\nI've read your document and I'm ready to help you understand it. Ask me anything — from quick summaries to in-depth explanations!`,
        timestamp: new Date(),
      };

      const title = file.name.replace(/\.[^/.]+$/, "").substring(0, 30) || "New Chat";

      // Create a DB session for this document chat
      const { sessionId: dbSessionId, blocked: createBlocked } = await apiCreateSession(title);
      if (createBlocked) { handleBlockedResponse(); return; }

      // Save the welcome message to DB
      if (dbSessionId) {
        await apiSaveMessage(dbSessionId, "assistant", welcomeMsg.content);
      }

      // Build RAG index from full text (in memory only — no size limit)
      const ragIndex = buildRagIndex(text, topic.subject);
      ragIndexRef.current.set(activeSessionId, ragIndex);

      updateSession(activeSessionId, {
        docContent: text,   // stored in React state (memory) — NOT localStorage
        hasDoc: true,
        docName: file.name,
        topic,
        title,
        messages: [welcomeMsg],
        dbSessionId,
        activeModel: topic.model,
        activeCategory: topic.category,
      });

      await new Promise(r => setTimeout(r, 1500));
      setUploadStatus("idle");
    } catch (err: any) {
      setUploadStatus("error");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setTimeout(() => setUploadStatus("idle"), 2000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: generateId(), role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...activeSession.messages, userMsg];

    // ── Dynamic model switching ───────────────────────────────────────────────
    // Detect the category of THIS specific question
    const questionCategory = detectQuestionCategory(text);
    // If no doc is loaded, always use the question's category model.
    // If a doc IS loaded, use the doc's model for doc-related questions,
    // but switch to the question's model if it's a clearly different domain.
    let chosenCategory: TopicCategory = questionCategory;
    let chosenModel: string = GROQ_MODELS[questionCategory];

    if (activeSession.topic && activeSession.docContent) {
      // If question is general (unclassified), keep the doc's model
      if (questionCategory === "general") {
        chosenCategory = activeSession.topic.category;
        chosenModel = activeSession.topic.model;
      }
    }

    updateSession(activeSessionId, {
      messages: updatedMessages,
      activeModel: chosenModel,
      activeCategory: chosenCategory,
    });
    setInput("");
    setIsLoading(true);
    // Keep focus on textarea so user can type next message immediately
    setTimeout(() => textareaRef.current?.focus(), 0);

    // ── Ensure this session has a DB record ───────────────────────────────────
    let dbSessionId = activeSession.dbSessionId;
    if (!dbSessionId) {
      const autoTitle = text.substring(0, 40) + (text.length > 40 ? "…" : "");
      const { sessionId, blocked: createBlocked } = await apiCreateSession(autoTitle);
      if (createBlocked) { handleBlockedResponse(); return; }
      dbSessionId = sessionId;
      if (dbSessionId) {
        updateSession(activeSessionId, { dbSessionId });
      }
    }

    // Save user message to DB — check for block
    if (dbSessionId) {
      const blocked = await apiSaveMessage(dbSessionId, "user", text);
      if (blocked) { handleBlockedResponse(); return; }
    }

    try {
      // Build conversation history (all messages BEFORE the current user message)
      // Include last 20 messages for full context — this lets the AI remember
      // previous answers when user asks follow-ups like "tell me more"
      const history: GroqMessage[] = activeSession.messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      // For RAG follow-up questions with no strong keywords (e.g. "tell me more"),
      // enrich the query with keywords from recent conversation to improve chunk retrieval
      const recentUserMessages = activeSession.messages
        .filter(m => m.role === "user")
        .slice(-3)
        .map(m => m.content)
        .join(" ");
      const enrichedQuery = text.length < 20
        ? `${text} ${recentUserMessages}`.substring(0, 300)
        : text;

      // Build system prompt — use RAG index for large docs, fallback for small ones
      const ragIndex = ragIndexRef.current.get(activeSessionId) || null;
      const systemPrompt = buildSystemPrompt(
        activeSession.topic,
        activeSession.docContent,
        chosenCategory,
        ragIndex,
        enrichedQuery,  // enriched with recent context for better RAG retrieval
      );

      const response = await sendMessageToGroq(text, history, systemPrompt, chosenModel);

      const aiMsg: Message = { id: generateId(), role: "assistant", content: response, timestamp: new Date() };
      updateSession(activeSessionId, { messages: [...updatedMessages, aiMsg] });

      // Save AI response to DB (non-blocking)
      if (dbSessionId) {
        apiSaveMessage(dbSessionId, "assistant", response);
      }

      // Track AI usage (non-blocking)
      // Token estimate: (input chars + output chars) / 4 — standard approximation
      // We include history length too since Groq charges for the full context window
      const historyChars = history.reduce((sum, m) => sum + m.content.length, 0);
      const estimatedTokens = Math.ceil((text.length + response.length + historyChars + systemPrompt.length) / 4);
      apiTrackUsage(estimatedTokens);

      // Auto-title from first user message
      if (activeSession.messages.length === 0 && activeSession.title === "New Chat") {
        updateSession(activeSessionId, { title: text.substring(0, 35) + (text.length > 35 ? "…" : "") });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      const errMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please check your API key or try again.",
        timestamp: new Date(),
      };
      updateSession(activeSessionId, { messages: [...updatedMessages, errMsg] });
    } finally {
      setIsLoading(false);
      // Re-focus textarea after AI responds so user can type immediately
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // ── Voice input (Groq Whisper via modal) ─────────────────────────────────
  const handleVoiceConfirm = (text: string) => {
    setInput(prev => (prev ? prev + " " + text : text));
  };

  // ── AI document summary ───────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!activeSession.docContent && !ragIndexRef.current.has(activeSessionId)) return;
    setIsSummarizing(true);
    // For RAG: get first ~8000 chars from first few chunks for summary
    const ragIndex = ragIndexRef.current.get(activeSessionId);
    const contentForSummary = activeSession.docContent ||
      (ragIndex ? ragIndex.chunks.slice(0, 20).map(c => c.text).join(' ') : '');
    try {
      const summary = await summarizeDocument(contentForSummary, activeSession.topic?.subject || "this document");
      const summaryMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: summary,
        timestamp: new Date(),
      };
      const updatedMsgs = [...activeSession.messages, summaryMsg];
      updateSession(activeSessionId, { messages: updatedMsgs });
      if (activeSession.dbSessionId) {
        apiSaveMessage(activeSession.dbSessionId, "assistant", summary);
      }
    } catch (err: any) {
      toast({ title: "Summary failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  // ── Export chat as text file ──────────────────────────────────────────────
  const handleExportChat = () => {
    if (activeSession.messages.length === 0) {
      toast({ title: "Nothing to export", description: "Start a conversation first.", variant: "destructive" });
      return;
    }
    const lines: string[] = [
      `StudyFlow AI — Chat Export`,
      `Session: ${activeSession.title}`,
      `Exported: ${new Date().toLocaleString()}`,
      "═".repeat(60),
      "",
    ];
    activeSession.messages.forEach(m => {
      lines.push(`[${m.role === "user" ? "You" : "AI"}] ${m.timestamp.toLocaleTimeString()}`);
      lines.push(m.content);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-z0-9]/gi, "_")}_chat.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Chat exported!", description: "Saved as a .txt file." });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createNewSession = () => {
    const s = newSession();
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s.id);
    setUploadStatus("idle");
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) setActiveSessionId(next[0].id);
      return next;
    });
  };

  // Use dynamic active model if set, otherwise fall back to topic or default
  const currentCategory = (activeSession.activeCategory || activeSession.topic?.category || "general") as TopicCategory;
  const categoryEmojis: Record<TopicCategory, string> = { coding: "💻", science: "🔬", general: "📚", casual: "☕" };
  const categoryNames: Record<TopicCategory, string> = {
    coding: "LLaMA 3.3 70B — Code Expert",
    science: "LLaMA 3.3 70B — STEM Expert",
    general: "LLaMA 3.3 70B — Versatile",
    casual: "LLaMA3 8B — Conversational",
  };
  const currentModel = {
    name: categoryNames[currentCategory],
    category: currentCategory,
    emoji: categoryEmojis[currentCategory],
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 flex-shrink-0 overflow-hidden chat-sidebar border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text text-sm">StudyFlow AI</span>
          </div>
          <Button
            onClick={createNewSession}
            className="w-full btn-primary rounded-xl h-9 text-sm gap-2 z-10 relative"
          >
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 chat-scroll">
          <p className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1 font-semibold">Recent</p>
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`history-item group flex items-center gap-2 ${session.id === activeSessionId ? "active" : ""}`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-700 flex-1 truncate">{session.title}</span>
              <button
                onClick={e => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0 space-y-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              {MODEL_ICONS[currentModel.category]}
              <span className="text-xs text-blue-700 font-medium truncate">{currentModel.emoji} Active Model</span>
            </div>
            <p className="text-xs text-blue-500 leading-relaxed truncate">{currentModel.name}</p>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
          >
            <User className="w-3.5 h-3.5" />
            <span>My Profile &amp; History</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(o => !o)}
              className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-gray-800 truncate max-w-xs">{activeSession.title}</h1>
              <div className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r border text-xs ${MODEL_COLORS[currentModel.category]}`}>
                {MODEL_ICONS[currentModel.category]}
                <span className="truncate max-w-[200px]">{currentModel.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Summary button — only shown when doc is loaded */}
            {activeSession.docContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 gap-1.5 text-xs h-8 px-2.5"
                title="Summarize document"
              >
                {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isSummarizing ? "Summarizing…" : "Summary"}</span>
              </Button>
            )}
            {/* Study tools — only shown when doc is loaded */}
            {activeSession.docContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStudyTools(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1.5 text-xs h-8 px-2.5"
                title="Flashcards & Quiz"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Study</span>
              </Button>
            )}
            {/* Export chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportChat}
              className="w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              title="Export chat"
            >
              <Download className="w-4 h-4" />
            </Button>
            {/* Attach file */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="Attach document"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            {/* New chat */}
            <Button
              onClick={createNewSession}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Messages area */}
        <div
          className={`flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-5 ${isDragging ? "upload-zone dragging" : ""}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* Upload progress card */}
          {uploadStatus !== "idle" && (
            <div className="max-w-md mx-auto">
              <UploadProgress status={uploadStatus} fileName={uploadFileName} topic={activeSession.topic} />
            </div>
          )}

          {/* Re-upload banner — shown when session had a doc but page was refreshed (RAG index lost) */}
          {activeSession.hasDoc && !activeSession.docContent && !ragIndexRef.current.has(activeSessionId) && uploadStatus === "idle" && (
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Document context was cleared on refresh</p>
                  <p className="text-xs text-amber-600 truncate mt-0.5">
                    Re-upload <strong>{activeSession.docName || "your document"}</strong> to restore AI document access
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Re-upload
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeSession.messages.length === 0 && uploadStatus === "idle" && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 fade-in-up">
              <div className="w-20 h-20 hero-gradient rounded-2xl flex items-center justify-center mb-6 float-animation pulse-glow">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-3">Hello! I'm your AI</h2>
              <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                Ask me anything — or upload a document and I'll automatically pick the best AI model to help you study it.
              </p>
              {/* Quick start suggestions */}
              <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                {[
                  { label: "📄 Upload a PDF to study", action: () => fileInputRef.current?.click() },
                  { label: "🧮 Explain calculus", action: () => setInput("Explain calculus in simple terms") },
                  { label: "💻 Help me debug code", action: () => setInput("I need help debugging my code") },
                  { label: "🌍 Tell me about history", action: () => setInput("Tell me about World War II") },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={s.action}
                    className="bg-white border border-gray-200 shadow-sm feature-card p-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:border-blue-200 transition-all duration-200 rounded-xl"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Drag hint — bigger drop zone */}
              <div
                className="mt-6 p-10 w-full max-w-lg flex flex-col items-center gap-4 cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-2xl transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shadow-sm">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-700">Drop a file or click to upload</p>
                  <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX, TXT supported</p>
                  <p className="text-xs text-blue-500 mt-2 font-medium">Click here or drag & drop anywhere</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeSession.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className={`flex items-end gap-3 bg-gray-50 border rounded-2xl px-4 py-3 transition-all duration-200 ${input ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"}`}>
            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-blue-500"
              title="Upload document"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            {/* Voice input button — opens ChatGPT-style modal */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex-shrink-0 w-8 h-8 rounded-xl border bg-white hover:bg-purple-50 border-gray-200 hover:border-purple-300 flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-purple-500"
              title="Voice input (Whisper AI)"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, or upload a document above…"
              rows={1}
              autoFocus
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none leading-relaxed min-h-[24px] max-h-[160px]"
              disabled={isLoading}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isLoading
                  ? "hero-gradient text-white hover:scale-110 pulse-glow"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            Powered by Groq · Smart model routing · Press <kbd className="bg-gray-100 text-gray-500 px-1 rounded text-xs border border-gray-200">Enter</kbd> to send
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.doc,.docx"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* Study Tools Modal (Flashcards + Quiz) */}
      {showStudyTools && activeSession.docContent && (
        <StudyToolsModal
          docContent={activeSession.docContent}
          subject={activeSession.topic?.subject || "this document"}
          onClose={() => setShowStudyTools(false)}
        />
      )}

      {/* Voice Recorder Modal (ChatGPT-style) */}
      {showVoiceModal && (
        <VoiceRecorderModal
          onConfirm={handleVoiceConfirm}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
}
