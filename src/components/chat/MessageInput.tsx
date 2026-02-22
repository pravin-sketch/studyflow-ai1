import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export const MessageInput = ({
  input,
  setInput,
  sendMessage,
  isLoading,
  handleKeyPress,
}: MessageInputProps) => {
  return (
    <div className="flex gap-2 flex-shrink-0 mt-4">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask about the questions or material..."
        disabled={isLoading}
        className="flex-1 min-w-0"
      />
      <Button
        onClick={sendMessage}
        disabled={isLoading || !input.trim()}
        size="icon"
        className="flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};
