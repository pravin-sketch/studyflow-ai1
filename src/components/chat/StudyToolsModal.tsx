import { useState } from "react";
import { X, BookOpen, Brain, ChevronLeft, ChevronRight, RotateCcw, Check, AlertCircle, Loader2, Trophy, RefreshCw } from "lucide-react";
import { generateFlashcards, generateQuiz, type Flashcard, type QuizQuestion } from "@/lib/groq-api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  docContent: string;
  subject: string;
  onClose: () => void;
}

type Mode = "menu" | "flashcards" | "quiz";

// ── Flashcard Viewer ──────────────────────────────────────────────────────────
function FlashcardViewer({ cards, onBack }: { cards: Flashcard[]; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const card = cards[index];
  const progress = Math.round((known.size / cards.length) * 100);

  const next = () => { setIndex(i => Math.min(i + 1, cards.length - 1)); setFlipped(false); };
  const prev = () => { setIndex(i => Math.max(i - 1, 0)); setFlipped(false); };
  const markKnown = () => {
    setKnown(prev => { const n = new Set(prev); n.add(card.id); return n; });
    if (index < cards.length - 1) next();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-sm text-gray-500">
          {index + 1} / {cards.length} · <span className="text-green-600 font-medium">{known.size} known</span>
        </div>
        <button
          onClick={() => { setIndex(0); setFlipped(false); setKnown(new Set()); }}
          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
          title="Restart"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #3b82f6, #10b981)" }}
        />
      </div>

      {/* Card */}
      <div
        className="flex-1 flex items-center justify-center cursor-pointer mb-5"
        onClick={() => setFlipped(f => !f)}
        style={{ perspective: "1000px" }}
      >
        <div
          className="w-full max-w-md h-52 relative"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Question</span>
            <p className="text-gray-800 font-medium text-center text-base leading-relaxed">{card.front}</p>
            <p className="text-xs text-gray-400 mt-4">Click to reveal answer</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col items-center justify-center p-6 shadow-sm"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Answer</span>
            <p className="text-gray-800 font-medium text-center text-base leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {flipped && (
          <button
            onClick={markKnown}
            className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Got it!
          </button>
        )}
        <button
          onClick={next}
          disabled={index === cards.length - 1}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Done state */}
      {known.size === cards.length && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
          <Trophy className="w-4 h-4" /> You've mastered all {cards.length} cards! 🎉
        </div>
      )}
    </div>
  );
}

// ── Quiz Viewer ───────────────────────────────────────────────────────────────
function QuizViewer({ questions, onBack }: { questions: QuizQuestion[]; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.correctIndex;

  const handleSelect = (i: number) => {
    if (isAnswered) return;
    setSelected(i);
    const newAnswers = [...answers];
    newAnswers[index] = i;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setSelected(answers[index + 1]);
    } else {
      setFinished(true);
    }
  };

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col h-full items-center justify-center text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 text-4xl ${
          pct >= 80 ? "bg-green-100" : pct >= 60 ? "bg-yellow-100" : "bg-red-100"
        }`}>
          {pct >= 80 ? "🏆" : pct >= 60 ? "📚" : "💪"}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{score}/{questions.length} Correct</h3>
        <p className="text-gray-500 mb-2">{pct}% score</p>
        <p className="text-sm text-gray-400 mb-6">
          {pct >= 80 ? "Excellent work! You've mastered this material." : pct >= 60 ? "Good job! Review the missed questions." : "Keep studying — you'll get there!"}
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => { setIndex(0); setSelected(null); setAnswers(new Array(questions.length).fill(null)); setFinished(false); }}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm text-gray-500">Question {index + 1} / {questions.length}</span>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
          {answers.filter((a, i) => a === questions[i].correctIndex).length} correct
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((index) / questions.length) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #7c3aed)" }}
        />
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-4 border border-blue-100">
        <p className="text-gray-800 font-semibold text-sm leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 flex-1">
        {q.options.map((opt, i) => {
          let cls = "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ";
          if (!isAnswered) {
            cls += "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50";
          } else if (i === q.correctIndex) {
            cls += "border-green-400 bg-green-50 text-green-700";
          } else if (i === selected) {
            cls += "border-red-400 bg-red-50 text-red-700";
          } else {
            cls += "border-gray-100 text-gray-400";
          }

          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)}>
              <span className="font-bold mr-2">{["A", "B", "C", "D"][i]}.</span>
              {opt}
              {isAnswered && i === q.correctIndex && <Check className="w-4 h-4 inline ml-2 text-green-500" />}
              {isAnswered && i === selected && i !== q.correctIndex && <X className="w-4 h-4 inline ml-2 text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && (
        <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed ${isCorrect ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <strong>{isCorrect ? "✅ Correct!" : "❌ Incorrect."}</strong> {q.explanation}
        </div>
      )}

      {isAnswered && (
        <button
          onClick={handleNext}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}
        >
          {index < questions.length - 1 ? "Next Question →" : "See Results"}
        </button>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function StudyToolsModal({ docContent, subject, onClose }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("menu");
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const startFlashcards = async () => {
    setLoading(true);
    try {
      const cards = await generateFlashcards(docContent, subject, 10);
      if (cards.length === 0) throw new Error("No flashcards generated");
      setFlashcards(cards);
      setMode("flashcards");
    } catch (e: any) {
      toast({ title: "Failed to generate flashcards", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      const questions = await generateQuiz(docContent, subject, 8);
      if (questions.length === 0) throw new Error("No questions generated");
      setQuizQuestions(questions);
      setMode("quiz");
    } catch (e: any) {
      toast({ title: "Failed to generate quiz", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Study Tools</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{subject}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Generating with AI…</p>
            </div>
          )}

          {!loading && mode === "menu" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-6">Choose a study tool to test your knowledge of this document.</p>
              {/* Flashcards */}
              <button
                onClick={startFlashcards}
                className="w-full p-5 rounded-2xl border-2 border-blue-100 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Flashcards</p>
                    <p className="text-sm text-gray-500 mt-0.5">10 AI-generated cards to review key concepts</p>
                  </div>
                </div>
              </button>
              {/* Quiz */}
              <button
                onClick={startQuiz}
                className="w-full p-5 rounded-2xl border-2 border-purple-100 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Quiz Mode</p>
                    <p className="text-sm text-gray-500 mt-0.5">8 multiple-choice questions with explanations</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {!loading && mode === "flashcards" && (
            <FlashcardViewer cards={flashcards} onBack={() => setMode("menu")} />
          )}

          {!loading && mode === "quiz" && (
            <QuizViewer questions={quizQuestions} onBack={() => setMode("menu")} />
          )}
        </div>
      </div>
    </div>
  );
}
