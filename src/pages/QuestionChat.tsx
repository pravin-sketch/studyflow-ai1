import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { MessageInput } from "@/components/chat/MessageInput";
import { getGeneratedQuestions, getStudyMaterials } from "@/lib/queries";
import { sendMessageToGemini, extractTextFromFile } from "@/lib/gemini-api";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: {
    text: string;
    onClick: () => void;
  }[];
}

const QuestionChat = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get("materialId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [docContent, setDocContent] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const allMaterials = getStudyMaterials() || [];
  const material = materialId ? allMaterials.find(m => m.id === parseInt(materialId)) || null : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (material) {
      extractTextFromFile(material).then(setDocContent).catch(() => setDocContent("Error loading document."));
    }
  }, [material]);

  useEffect(() => {
    if (messages.length === 0 && material) {
      const initialMessage: Message = {
        role: "assistant",
        content: "Hello! I'm your AI Study Guide. Ask me anything about the uploaded material.",
      };
      setMessages([initialMessage]);
    }
  }, [messages.length, material]);

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content) return;

    if (isLoading) return;

    setIsLoading(true);

    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);

    if (!messageContent) {
      setInput("");
    }

    try {
      const questions = materialId ? getGeneratedQuestions(parseInt(materialId)) : [];
      const aiResponse = await sendMessageToGemini(content, material, questions, messages.map(m => ({ role: m.role, content: m.content })));

      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });

      const errorMessage: Message = {
        role: "assistant",
        content: "I'm having trouble responding right now.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!materialId || !material) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
          <Card className="p-6">
            <p className="text-muted-foreground">No material selected</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen pt-20 bg-gradient-to-br from-background to-muted/20 flex flex-col">
        <div className="container mx-auto px-6 py-8 flex-1 flex flex-col max-h-screen overflow-hidden">
          <div className="mb-6 flex items-center gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
          </div>

          <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
            <Card className="flex flex-col flex-1 min-h-0 shadow-xl border-0 bg-card/95 backdrop-blur-sm">
              <CardHeader className="flex-shrink-0 pb-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">AI Study Guide</span>
                    <p className="text-sm font-normal text-muted-foreground">{material.filename}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex overflow-hidden min-h-0 p-6 pt-4">
                <div className="flex w-full gap-4">
                  {/* Left side: Document content */}
                  <div className="flex-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Uploaded Document</CardTitle>
                      </CardHeader>
                      <CardContent className="h-full overflow-hidden">
                        <ScrollArea className="h-full">
                          <pre className="whitespace-pre-wrap text-sm">{docContent || "Loading document..."}</pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Right side: Chat */}
                  <div className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 pr-4 mb-4 min-h-[200px] max-h-[60vh] overflow-y-auto" ref={scrollRef}>
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Ask me anything about the document!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-4 h-full">
                          {messages.map((msg, idx) => (
                            <div
                              key={`${msg.role}-${idx}`}
                              className={`flex w-full ${
                                msg.role === "user" ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`p-4 rounded-lg max-w-[85%] ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {msg.role === "assistant" ? (
                                  <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                {msg.actions && msg.actions.length > 0 && (
                                  <div className="flex gap-2 mt-2 flex-wrap justify-end">
                                    {msg.actions.map((action, idx) => (
                                      <Button key={idx} onClick={action.onClick} size="sm" variant="outline">
                                        {action.text}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2 flex-shrink-0 mt-4 border-t pt-4">
                      <MessageInput
                        input={input}
                        setInput={setInput}
                        sendMessage={handleSendMessage}
                        isLoading={isLoading}
                        handleKeyPress={handleKeyPress}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="flex-shrink-0"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default QuestionChat;
