import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QuestionNavigationProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answeredQuestions: number[];
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigation({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  onQuestionSelect,
}: QuestionNavigationProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <Button
            key={index}
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              currentQuestionIndex === index && "border-2 border-primary-600",
              answeredQuestions.includes(index) 
                ? "bg-primary-600 text-white border-primary-600" 
                : "bg-white text-gray-700 border-primary-200"
            )}
            onClick={() => onQuestionSelect(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default QuestionNavigation;
