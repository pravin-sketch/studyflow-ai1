import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Valid Groq model IDs (updated 2025) ──────────────────────────────────────
export const GROQ_MODELS = {
  general:  'llama-3.3-70b-versatile',          // General purpose Q&A
  coding:   'llama-3.3-70b-versatile',          // Coding
  science:  'llama-3.3-70b-versatile',          // STEM (llama-3.1-70b-versatile decommissioned)
  casual:   'llama3-8b-8192',                   // Lightweight conversational
};

export type TopicCategory = 'general' | 'coding' | 'science' | 'casual';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DetectedTopic {
  category: TopicCategory;
  subject: string;
  model: string;
  confidence: number;
  emoji: string;
  description: string;
}

const MODEL_DESCRIPTIONS: Record<TopicCategory, string> = {
  coding:  'LLaMA3 70B — Optimized for code & algorithms',
  science: 'LLaMA 3.1 70B — Expert in STEM subjects',
  general: 'LLaMA 3.3 70B — Versatile knowledge base',
  casual:  'LLaMA3 8B — Friendly conversational AI',
};

const MODEL_EMOJIS: Record<TopicCategory, string> = {
  coding:  '💻',
  science: '🔬',
  general: '📚',
  casual:  '☕',
};

// ── Detect topic from any text (document or user question) ───────────────────
export async function detectDocumentTopic(content: string): Promise<DetectedTopic> {
  const snippet = content.substring(0, 3000);

  const prompt = `Analyze this text and classify it into exactly one category.

Text:
"""
${snippet}
"""

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "category": "coding" | "science" | "general" | "casual",
  "subject": "short subject name e.g. Biology, Python Programming, History",
  "confidence": 0.0-1.0,
  "emoji": "single relevant emoji"
}

Rules:
- coding: programming, software, algorithms, web dev, data structures, CS theory
- science: biology, chemistry, physics, mathematics, medicine, engineering
- general: history, literature, philosophy, business, law, economics, social sciences
- casual: personal topics, creative writing, recipes, travel, daily life`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODELS.general,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const category = parsed.category as TopicCategory;
      return {
        category,
        subject: parsed.subject || 'General',
        model: GROQ_MODELS[category] || GROQ_MODELS.general,
        confidence: parsed.confidence || 0.8,
        emoji: parsed.emoji || MODEL_EMOJIS[category],
        description: MODEL_DESCRIPTIONS[category],
      };
    }
  } catch (e) {
    console.error('Topic detection failed:', e);
  }

  return {
    category: 'general',
    subject: 'General',
    model: GROQ_MODELS.general,
    confidence: 0.5,
    emoji: '📚',
    description: MODEL_DESCRIPTIONS.general,
  };
}

// ── Detect topic of a single user question (lightweight, no API call) ────────
export function detectQuestionCategory(question: string): TopicCategory {
  const q = question.toLowerCase();
  const codingKw = ['code', 'function', 'algorithm', 'debug', 'error', 'syntax', 'program', 'javascript', 'python', 'typescript', 'react', 'html', 'css', 'sql', 'api', 'class', 'object', 'variable', 'loop', 'array', 'compile', 'runtime', 'stack', 'recursion', 'git', 'docker'];
  const scienceKw = ['biology', 'chemistry', 'physics', 'math', 'equation', 'formula', 'molecule', 'atom', 'cell', 'dna', 'protein', 'force', 'energy', 'reaction', 'theorem', 'integral', 'derivative', 'calculus', 'statistics', 'hypothesis', 'experiment'];
  const casualKw = ['recipe', 'food', 'travel', 'movie', 'music', 'sport', 'weather', 'fun', 'joke', 'how are you', 'what do you think', 'opinion', 'feeling', 'love', 'friend', 'family'];

  const score = (keywords: string[]) => keywords.filter(k => q.includes(k)).length;
  const codingScore = score(codingKw);
  const scienceScore = score(scienceKw);
  const casualScore = score(casualKw);

  if (codingScore >= 2 || (codingScore >= 1 && codingScore > scienceScore && codingScore > casualScore)) return 'coding';
  if (scienceScore >= 2 || (scienceScore >= 1 && scienceScore > codingScore && scienceScore > casualScore)) return 'science';
  if (casualScore >= 1 && casualScore >= codingScore && casualScore >= scienceScore) return 'casual';
  return 'general';
}

// ── Send a message to Groq with full conversation history ─────────────────────
// NOTE: conversationHistory should include ALL messages BEFORE the current user message.
// The current user message is appended here automatically.
export async function sendMessageToGroq(
  userMessage: string,
  conversationHistory: GroqMessage[],  // messages BEFORE current user message
  systemPrompt: string,
  model: string = GROQ_MODELS.general
): Promise<string> {
  // Build messages array: system + full history + current user message
  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

// ── Extract text from PDF ─────────────────────────────────────────────────────
export async function extractTextFromPDF(fileData: Uint8Array): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
}

// ── Extract text from any supported file ─────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const lowerName = file.name.toLowerCase();

  // ── Plain text ──────────────────────────────────────────────────────────
  if (
    file.type === 'text/plain' ||
    lowerName.endsWith('.txt')
  ) {
    // Try UTF-8 first, fall back to latin-1 for older files
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
    } catch {
      return new TextDecoder('latin-1').decode(arrayBuffer);
    }
  }

  // ── PDF ────────────────────────────────────────────────────────────────
  if (
    file.type === 'application/pdf' ||
    lowerName.endsWith('.pdf')
  ) {
    return await extractTextFromPDF(new Uint8Array(arrayBuffer));
  }

  // ── DOCX (OpenXML — ZIP + XML) ─────────────────────────────────────────
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    // mammoth extracts clean plain text from .docx reliably
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();
    if (!text) throw new Error('Could not extract text from this DOCX file. It may be empty or image-only.');
    return text;
  }

  // ── DOC (old binary Word format) ───────────────────────────────────────
  // mammoth can handle some .doc files too
  if (
    file.type === 'application/msword' ||
    lowerName.endsWith('.doc')
  ) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      if (text) return text;
    } catch { /* fall through to basic extraction */ }
    // Fallback: try to extract readable ASCII text from binary .doc
    const bytes = new Uint8Array(arrayBuffer);
    let text = '';
    for (let i = 0; i < bytes.length - 1; i++) {
      const c = bytes[i];
      const next = bytes[i + 1];
      // Pick printable ASCII chars; skip null-padded UTF-16LE runs
      if (c >= 32 && c < 127) {
        if (next === 0) { text += String.fromCharCode(c); i++; }
        else text += String.fromCharCode(c);
      } else if (c === 10 || c === 13) {
        text += '\n';
      }
    }
    text = text.replace(/\s{3,}/g, '\n\n').trim();
    if (!text || text.length < 50) {
      throw new Error('Could not extract readable text from this .doc file. Please save it as .docx or .txt and try again.');
    }
    return text;
  }

  throw new Error('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT.');
}

// ── Voice transcription via Groq Whisper ─────────────────────────────────────
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  form.append('language', 'en');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Whisper API error: ${response.status}`);
  }
  const data = await response.json();
  return data.text?.trim() || '';
}

// ── AI document summary ───────────────────────────────────────────────────────
export async function summarizeDocument(docContent: string, subject: string): Promise<string> {
  const prompt = `You are an expert study assistant. Create a comprehensive, well-structured summary of this document about "${subject}".

Structure your summary as:
## 📋 Overview
[2-3 sentence overview]

## 🔑 Key Points
[5-8 bullet points of the most important concepts]

## 📚 Main Topics Covered
[List the main sections/topics]

## 💡 Key Takeaways
[3-5 actionable insights or conclusions]

Document content:
"""
${docContent.substring(0, 10000)}
"""`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODELS.general,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error(`Summary API error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Could not generate summary.';
}

// ── Flashcard generator ───────────────────────────────────────────────────────
export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export async function generateFlashcards(docContent: string, subject: string, count = 10): Promise<Flashcard[]> {
  const prompt = `You are a study assistant. Generate exactly ${count} flashcards from this document about "${subject}".

Each flashcard should test a key concept, definition, or fact from the document.

Respond with ONLY a JSON array (no markdown, no explanation):
[
  {"front": "Question or concept", "back": "Answer or explanation"},
  ...
]

Document content:
"""
${docContent.substring(0, 8000)}
"""`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODELS.general,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) throw new Error(`Flashcard API error: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  const cards = JSON.parse(jsonMatch[0]);
  return cards.map((c: any, i: number) => ({ id: String(i), front: c.front, back: c.back }));
}

// ── Quiz generator ────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function generateQuiz(docContent: string, subject: string, count = 8): Promise<QuizQuestion[]> {
  const prompt = `You are a study assistant. Generate exactly ${count} multiple-choice quiz questions from this document about "${subject}".

Each question must have exactly 4 options with one correct answer.

Respond with ONLY a JSON array (no markdown, no explanation):
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct"
  },
  ...
]

Document content:
"""
${docContent.substring(0, 8000)}
"""`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODELS.general,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) throw new Error(`Quiz API error: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  const questions = JSON.parse(jsonMatch[0]);
  return questions.map((q: any, i: number) => ({
    id: String(i),
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}

// ── RAG Engine ────────────────────────────────────────────────────────────────
// Splits document into chunks and retrieves the most relevant ones per query.
// This allows large documents (10MB+) to work without hitting context limits.

const CHUNK_SIZE = 400;      // words per chunk
const CHUNK_OVERLAP = 80;    // overlap words between chunks for continuity
const TOP_K_CHUNKS = 8;      // number of chunks to inject into prompt (more = better context)

export interface DocChunk {
  id: number;
  text: string;
  wordStart: number;
}

export interface RagIndex {
  chunks: DocChunk[];
  subject: string;
  totalWords: number;
}

/** Split full document text into overlapping word chunks */
export function buildRagIndex(docContent: string, subject = 'document'): RagIndex {
  const words = docContent.split(/\s+/).filter(Boolean);
  const chunks: DocChunk[] = [];
  let i = 0;
  let id = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + CHUNK_SIZE);
    chunks.push({ id: id++, text: slice.join(' '), wordStart: i });
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return { chunks, subject, totalWords: words.length };
}

/** Score a chunk against a query using TF-style keyword overlap */
function scoreChunk(chunk: DocChunk, query: string): number {
  const qWords = new Set(
    query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
  const cWords = chunk.text.toLowerCase().split(/\s+/);
  let score = 0;
  for (const w of cWords) {
    if (qWords.has(w)) score++;
    // Bonus for exact multi-word phrase match
  }
  // Boost score for chunks earlier in doc (introduction/summary)
  const posBoost = Math.max(0, 1 - chunk.wordStart / 5000) * 2;
  return score + posBoost;
}

/** Retrieve top-K most relevant chunks for the query.
 *  Strategy:
 *  1. Always include first 2 chunks (intro/overview context)
 *  2. Score all chunks by keyword match against query
 *  3. Add top scoring chunks until we have TOP_K total
 *  4. Re-sort by position for natural reading order
 *  This ensures the AI always has baseline context even for vague follow-ups.
 */
export function retrieveRelevantChunks(index: RagIndex, query: string, topK = TOP_K_CHUNKS): string {
  if (!index || !index.chunks.length) return '';

  const selectedIds = new Set<number>();
  const result: DocChunk[] = [];

  // Step 1: Always include first 2 chunks (document intro/overview)
  const introChunks = index.chunks.slice(0, 2);
  introChunks.forEach(c => { selectedIds.add(c.id); result.push(c); });

  // Step 2: Score remaining chunks by keyword relevance
  const scored = index.chunks
    .filter(c => !selectedIds.has(c.id))
    .map(c => ({ chunk: c, score: scoreChunk(c, query) }));

  scored.sort((a, b) => b.score - a.score);

  // Step 3: Add top scored chunks until we reach topK
  for (const { chunk } of scored) {
    if (result.length >= topK) break;
    if (!selectedIds.has(chunk.id)) {
      selectedIds.add(chunk.id);
      result.push(chunk);
    }
  }

  // Step 4: Sort by position for natural reading order
  result.sort((a, b) => a.wordStart - b.wordStart);

  return result.map(c => c.text).join('\n\n---\n\n');
}

// ── Build system prompt (RAG-aware) ──────────────────────────────────────────
// Uses RAG index to retrieve relevant chunks instead of full docContent.
// Falls back to first 12000 chars if no RAG index (small docs).
export function buildSystemPrompt(
  topic: DetectedTopic | null,
  docContent: string,
  questionCategory?: TopicCategory,
  ragIndex?: RagIndex | null,
  userQuery?: string,
): string {
  const personalityMap: Record<TopicCategory, string> = {
    coding:  'You are an expert programming tutor and software engineer. Use code examples, explain algorithms clearly, and help debug issues. Format code in markdown code blocks.',
    science: 'You are a brilliant STEM tutor with expertise in biology, chemistry, physics, and mathematics. Use clear explanations, step-by-step solutions, and real-world examples.',
    general: 'You are a knowledgeable academic tutor with broad expertise. Provide clear, well-structured answers with context and examples.',
    casual:  'You are a friendly, helpful AI assistant. Be conversational, warm, and engaging.',
  };

  const category = questionCategory || topic?.category || 'general';
  const personality = personalityMap[category];

  const topicInfo = topic
    ? `The user has uploaded a document about "${topic.subject}" (${topic.category}).`
    : '';

  let docSection = '';
  if (ragIndex && ragIndex.chunks.length > 0) {
    // RAG mode: retrieve most relevant chunks for this question
    // Always includes intro chunks + query-matched chunks
    const relevantText = userQuery
      ? retrieveRelevantChunks(ragIndex, userQuery)
      : ragIndex.chunks.slice(0, TOP_K_CHUNKS).map(c => c.text).join('\n\n---\n\n');

    const totalChunks = ragIndex.chunks.length;
    const totalWords = ragIndex.totalWords.toLocaleString();

    docSection = `\n\nYou have FULL ACCESS to a document about "${ragIndex.subject}" (${totalWords} words, ${totalChunks} sections indexed).

The most relevant sections for this question are shown below. You can answer questions about ANY part of this document across the entire conversation — your RAG system retrieves the right sections each time.

Relevant document sections:
"""
${relevantText}
"""

IMPORTANT RULES:
- You have persistent access to this document throughout the conversation
- Answer confidently based on the document content shown above
- For follow-up questions ("tell me more", "explain that", "what else"), use your context from previous messages AND the document sections shown
- Only say you cannot find information if it is genuinely not in the document at all
- Never say you "don't have access" or "cannot retain" document information — you DO have access via the RAG system`;
  } else if (docContent) {
    // Fallback for small docs: inject first 12000 chars directly
    docSection = `\n\nYou have FULL ACCESS to the following document. Use it as your PRIMARY knowledge source for all questions in this conversation:\n"""\n${docContent.substring(0, 12000)}\n"""\n\nAnswer all questions about this document confidently. If something is genuinely not in the document, use your general knowledge and mention that.`;
  }

  return `${personality}

${topicInfo}${docSection}

Guidelines:
- Always give accurate, helpful responses
- Use markdown formatting (headers, bullets, code blocks) where helpful  
- Be encouraging and supportive
- Keep responses concise but complete
- If a document is provided, always refer to it for document-related questions`;
}
