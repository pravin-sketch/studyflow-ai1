import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMenuProps {
  handleAction: (action: string) => void;
  menuStep: string;
  setMenuStep: (step: string) => void;
}

export const ChatMenu = ({ handleAction, menuStep, setMenuStep }: ChatMenuProps) => {
  const modeItems = [
    { label: "🚀 Let's Begin", action: "lets_begin" },
    { label: "⚡ Quick Learn", action: "depth_quick" },
    { label: "🌊 Shallow Learn", action: "depth_standard" },
    { label: "🧩 Deep Dive", action: "depth_deep" },
  ];

  const styleItems = [
    { label: "Normal", action: "style_normal" },
    { label: "Your Buddy", action: "style_buddy" },
  ];

  const contentItems = [
    { label: "Independent Questions", action: "content_independent" },
    { label: "Topics", action: "content_topics" },
    { label: "Same Questions", action: "content_same" },
  ];

  const handleMenuAction = (action: string, nextStep: string) => {
    handleAction(action);
    setMenuStep(nextStep);
  };

  return (
    <div className="p-4 border-r bg-card text-card-foreground">
      <h2 className="text-lg font-semibold mb-4">Chatbot Menu</h2>
      <div className="space-y-2">
        {menuStep === 'mode' && modeItems.map((item) => (
          <Button
            key={item.action}
            variant="secondary"
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground"
            onClick={() => handleMenuAction(item.action, 'style')}
          >
            {item.label}
          </Button>
        ))}
        {menuStep === 'style' && styleItems.map((item) => (
          <Button
            key={item.action}
            variant="secondary"
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground"
            onClick={() => handleMenuAction(item.action, 'content')}
          >
            {item.label}
          </Button>
        ))}
        {menuStep === 'content' && contentItems.map((item) => (
          <Button
            key={item.action}
            variant="secondary"
            className="w-full justify-start hover:bg-primary hover:text-primary-foreground"
            onClick={() => handleAction(item.action)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};