import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
}

interface QuestionListProps {
  questions: Question[] | undefined;
  isLoading: boolean;
}

export const QuestionList = ({ questions, isLoading }: QuestionListProps) => {
  return (
    // --- THE ONLY CHANGE IS ON THIS LINE ---
    // Instead of `h-full`, we give it a specific height.
    // `h-[85vh]` means "85% of the viewport's (screen's) height".
    // You can change this value to `h-[700px]` or `h-[80vh]` to get the exact size you need.
    <Card className="flex flex-col h-[85vh]">
      <CardHeader>
        <CardTitle>Generated Questions ({questions?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {questions?.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium mb-2 break-words">{q.question_text}</p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {q.question_type}
                        </span>
                        <span className="text-xs px-2 py-1 bg-accent/50 rounded">
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
