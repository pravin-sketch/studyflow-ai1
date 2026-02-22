import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { RefObject } from "react";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: {
    text: string;
    onClick: () => void;
  }[];
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement>;
}

export const MessageList = ({ messages, isLoading, scrollRef }: MessageListProps) => {
  return (
    <ScrollArea className="flex-1 pr-4 mb-4 min-h-[200px] max-h-[60vh] overflow-y-auto" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Ask me anything about the questions or the material!</p>
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
  );
};