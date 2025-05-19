import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TestScore = {
  name: string;
  score: number;
};

interface PerformanceChartProps {
  scores: TestScore[];
}

export function PerformanceChart({ scores }: PerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Average Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scores.map((score, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                <span className="truncate">{score.name}</span>
                <span>{score.score}%</span>
              </div>
              <Progress value={score.score} className="h-2 bg-gray-200" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
