// Gemini API integration for chat functionality
// You need to get your own API key from https://makersuite.google.com/app/apikey
// Set your API key in the .env file as VITE_GEMINI_API_KEY

import * as pdfjsLib from 'pdfjs-dist';


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAAmKJ1mAG3XZZGsX8oXcSIX4AEhFAqN5A';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StudyMaterial {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  file_data: Uint8Array;
  uploaded_at: string;
}

export interface Question {
  id: string;
  material_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  created_at: string;
  is_independent: boolean;
}

export const sendMessageToGemini = async (
  message: string,
  material: StudyMaterial | null,
  questions: Question[],
  conversationHistory: ChatMessage[] = []
): Promise<string | { text: string; actions: { text: string; value: string }[] }> => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Please set up your Gemini API key in src/lib/gemini-api.ts');
  }

  try {
    let documentContent = '';
    if (material) {
      documentContent = await extractTextFromFile(material);
    }

    const questionsContext = questions.map((q, index) =>
      `${index + 1}. ${q.question_text} (${q.difficulty} - ${q.question_type})`
    ).join('\n');

    const conversationContext = conversationHistory.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    let systemPrompt = `You are an AI Study Buddy. Your goal is to help students learn from their uploaded materials.`;

    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage === "lets_begin") {
      systemPrompt = `You are an AI Study Buddy. Your user has just uploaded a document and is ready to start learning.
Your first task is to introduce yourself and give a brief overview of the study material.
The material is titled: '${material?.filename}'.
After the introduction, you should ask the user to choose a learning mode: Quick Learn, Shallow Learn, or Deep Dive.
Keep your introduction concise and friendly.`;
    } else if (lowerCaseMessage.startsWith('depth_')) {
      systemPrompt = `You are an AI Study Buddy. The user has chosen a learning mode.
The chosen mode is: '${message}'.
Acknowledge the user's choice and briefly explain what it means for the session.
Then, ask the user to choose a study style: Normal or Your Buddy.
Example for Quick Learn: 'Great, we'll go through the material at a fast pace, focusing on the key points. Now, how would you like me to interact with you? As a straightforward tutor (Normal) or as a friendly study partner (Your Buddy)?'`;
    } else if (lowerCaseMessage.startsWith('style_')) {
        systemPrompt = `You are an AI Study Buddy. The user has chosen a study style.
The chosen style is: '${message}'.
Acknowledge the user's choice and explain how you will interact with them.
Then, ask the user what they would like to cover first: Independent Questions, Topics, or Same Questions.
Example for Your Buddy: 'Awesome! I'll be your study buddy for this session. We can chat and learn together. What should we start with? We can go through independent questions, cover the topics one by one, or look at similar questions.'`;
    } else if (lowerCaseMessage.startsWith('content_')) {
        systemPrompt = `You are an AI Study Buddy. The user has chosen what to cover first.
The chosen content is: '${message}'.
Start the learning session based on the user's choice.
If the user chose 'Independent Questions', first list all independent questions, then start by explaining the first one.
If the user chose 'Topics', start by listing the main topics from the material.
If the user chose 'Same Questions', start by grouping similar questions and presenting the first group.
Remember to follow the chosen learning mode and study style.`;
    } else {
        systemPrompt = `You are an AI Study Buddy designed to help students learn from their uploaded materials. You have access to:

1. Document Content: "${material?.filename || 'No document'}"
${documentContent ? `Content: ${documentContent.substring(0, 2000)}...` : 'No content available'}

2. Generated Questions:
${questionsContext}

3. Learning Context:
- The student has uploaded study material and generated questions
- Your role is to help them understand the content, answer questions, and provide explanations
- Be encouraging, educational, and interactive
- Reference the document content and questions when relevant

Previous Conversation:
${conversationContext}

Please respond to the student's message in a helpful, educational manner. If they ask about specific questions, provide detailed explanations. If they need clarification on concepts from the document, explain them clearly.`;
    }


    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nStudent's Message: ${message}`
            }
          ]
        }
      ]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: GEMINI_API_URL
      });
      
      let errorMessage = 'Unknown error';
      if (response.status === 402) {
        errorMessage = 'Billing/quota exceeded. Please check your API key or wait for quota reset.';
      } else if (response.status === 403) {
        errorMessage = 'API access forbidden. Please check your API key permissions.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('No response received from Gemini API');
    }

    return aiResponse;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
};

// Helper function to extract text content from different file types
export const extractTextFromFile = async (material: StudyMaterial): Promise<string> => {
  try {
    if (material.file_type === 'text/plain') {
      const decoder = new TextDecoder();
      return decoder.decode(material.file_data);
    } else if (material.file_type === 'application/pdf') {
      const pdf = await pdfjsLib.getDocument({ data: material.file_data }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    }
    return 'Unsupported file type for text extraction.';
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return 'Error extracting text from the uploaded file.';
  }
};
