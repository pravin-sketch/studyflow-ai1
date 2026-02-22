import { useEffect, useRef, useState } from "react";
import { Mic, X, Check, Loader2 } from "lucide-react";

interface Props {
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export default function VoiceRecorderModal({ onConfirm, onClose }: Props) {
  const [phase, setPhase] = useState<"recording" | "transcribing" | "done" | "error">("recording");
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [level, setLevel] = useState(0); // 0–100 audio level
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start recording on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Web Audio for level meter
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel(Math.min(100, avg * 2.5));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();

        // MediaRecorder
        const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
        audioChunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          cancelAnimationFrame(animFrameRef.current);
          if (!mounted) return;
          setPhase("transcribing");
          try {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const text = await transcribeAudioGroq(blob);
            setTranscript(text);
            setPhase("done");
          } catch (e: any) {
            setErrorMsg(e.message || "Transcription failed");
            setPhase("error");
          }
        };
        mr.start();
        mediaRecorderRef.current = mr;

        // Timer
        timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      } catch {
        if (mounted) { setErrorMsg("Microphone access denied."); setPhase("error"); }
      }
    })();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
    onClose();
  };

  const handleOk = () => {
    if (transcript.trim()) {
      onConfirm(transcript.trim());
    }
    onClose();
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Waveform bars ─────────────────────────────────────────────────────────
  const BAR_COUNT = 28;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = BAR_COUNT / 2;
    const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
    const base = level * (1 - dist * 0.7); // taller bars at center
    return Math.max(4, base + Math.random() * 8); // add slight noise
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full sm:w-auto sm:min-w-[380px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {phase === "recording" && "Listening…"}
            {phase === "transcribing" && "Transcribing…"}
            {phase === "done" && "Ready"}
            {phase === "error" && "Error"}
          </h2>
          {phase === "recording" && (
            <p className="text-xs text-gray-400 mt-1">{fmtTime(seconds)} · Speak clearly into your microphone</p>
          )}
        </div>

        {/* Waveform / status area */}
        <div className="flex items-center justify-center px-6 py-6" style={{ minHeight: 120 }}>
          {phase === "recording" && (
            <div className="flex items-end gap-[3px] h-16">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-75"
                  style={{
                    width: 4,
                    height: `${Math.min(100, h)}%`,
                    background: h > 20
                      ? `linear-gradient(to top, #3b82f6, #8b5cf6)`
                      : "#e5e7eb",
                  }}
                />
              ))}
            </div>
          )}
          {phase === "transcribing" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Processing with Whisper AI…</p>
            </div>
          )}
          {phase === "done" && (
            <div className="w-full">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 leading-relaxed max-h-32 overflow-y-auto">
                {transcript || <span className="text-gray-400 italic">No speech detected</span>}
              </div>
            </div>
          )}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-500">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Mic pulse indicator (recording only) */}
        {phase === "recording" && (
          <div className="flex justify-center pb-4">
            <div className="relative flex items-center justify-center">
              {/* Pulse rings */}
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: 64 + level * 0.4,
                  height: 64 + level * 0.4,
                  background: `rgba(239,68,68,${0.08 + level * 0.002})`,
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 56 + level * 0.3,
                  height: 56 + level * 0.3,
                  background: `rgba(239,68,68,${0.12 + level * 0.002})`,
                }}
              />
              {/* Mic button — click to stop */}
              <button
                onClick={stopRecording}
                className="relative z-10 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all"
                title="Stop recording"
              >
                <Mic className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          {phase === "recording" && (
            <button
              onClick={stopRecording}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Done
            </button>
          )}
          {phase === "done" && (
            <button
              onClick={handleOk}
              disabled={!transcript.trim()}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" /> Use this
            </button>
          )}
          {phase === "error" && (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Groq Whisper transcription ────────────────────────────────────────────────
async function transcribeAudioGroq(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");
  form.append("language", "en");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Whisper error: ${res.status}`);
  }
  const data = await res.json();
  return data.text?.trim() || "";
}
