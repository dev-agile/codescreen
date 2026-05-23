import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileJson } from "lucide-react";

const SAMPLE_JSON = JSON.stringify(
  [
    {
      type: "multipleChoice",
      content: "Which of the following is NOT a JavaScript data type?",
      options: ["String", "Boolean", "Float", "Symbol"],
      answer: "2",
      points: 1,
    },
    {
      type: "coding",
      content: "Write a function that returns the sum of two numbers.",
      codeSnippet: "function sum(a, b) {\n  // your code here\n}",
      testCases: [
        { input: "1, 2", output: "3" },
        { input: "10, 20", output: "30" },
      ],
      points: 5,
    },
    {
      type: "subjective",
      content: "Explain the difference between == and === in JavaScript.",
      evaluationGuidelines:
        "Type coercion explanation (3pts), examples (3pts), when to use each (4pts)",
      points: 10,
    },
  ],
  null,
  2
);

interface BulkImportQuestionsProps {
  testId: number;
  onClose: () => void;
}

export function BulkImportQuestions({ testId, onClose }: BulkImportQuestionsProps) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const createQuestion = useMutation({
    mutationFn: async (question: any) => {
      const res = await apiRequest("POST", "/api/questions", { ...question, testId });
      return res.json();
    },
  });

  async function handleImport() {
    setError("");
    let questions: any[];

    try {
      const parsed = JSON.parse(jsonText);
      questions = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
      return;
    }

    if (questions.length === 0) {
      setError("No questions found in the JSON.");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const q of questions) {
      try {
        await createQuestion.mutateAsync(q);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });

    if (failCount === 0) {
      toast({ title: `${successCount} question${successCount > 1 ? "s" : ""} imported successfully` });
      onClose();
    } else {
      toast({
        title: `${successCount} imported, ${failCount} failed`,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Questions from JSON</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Paste a JSON array of questions. Each question needs at least <code className="bg-gray-100 px-1 rounded">type</code> and <code className="bg-gray-100 px-1 rounded">content</code>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 ml-4"
              onClick={() => { setJsonText(SAMPLE_JSON); setError(""); }}
            >
              <FileJson className="h-4 w-4 mr-1.5" />
              Load Sample
            </Button>
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(""); }}
            placeholder={`Paste your JSON here, or click "Load Sample" to see the format...`}
            rows={16}
            className="font-mono text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="text-xs text-gray-400 space-y-0.5">
            <p><strong>type</strong> options: <code className="bg-gray-100 px-1 rounded">multipleChoice</code> · <code className="bg-gray-100 px-1 rounded">coding</code> · <code className="bg-gray-100 px-1 rounded">subjective</code> · <code className="bg-gray-100 px-1 rounded">patternRecognition</code></p>
            <p>For <strong>multipleChoice</strong>: include <code className="bg-gray-100 px-1 rounded">options</code> (array) and <code className="bg-gray-100 px-1 rounded">answer</code> (index as string, e.g. "0").</p>
            <p>For <strong>coding</strong>: include <code className="bg-gray-100 px-1 rounded">testCases</code> (array of {`{ input, output }`}) and optionally <code className="bg-gray-100 px-1 rounded">codeSnippet</code>.</p>
            <p>For <strong>subjective</strong>: include <code className="bg-gray-100 px-1 rounded">evaluationGuidelines</code>.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !jsonText.trim()}>
            {importing ? "Importing..." : "Import Questions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImportQuestions;
