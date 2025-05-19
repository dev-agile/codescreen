import { Progress } from "@/components/ui/progress";

interface TestProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

export function TestProgress({ currentQuestionIndex, totalQuestions }: TestProgressProps) {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-500 mr-4">
        Progress: {currentQuestionIndex + 1}/{totalQuestions} questions
      </span>
      <Progress value={progress} className="w-32 h-2.5" />
    </div>
  );
}

export default TestProgress;
