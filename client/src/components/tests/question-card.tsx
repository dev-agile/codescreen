import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QuestionForm } from "./question-form";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";

type QuestionType = "multipleChoice" | "coding" | "subjective";

interface QuestionCardProps {
  id: number;
  testId: number;
  type: QuestionType;
  content: string;
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  testCases?: Array<{ input: string; output: string }>;
  evaluationGuidelines?: string;
  points: number;
  order: number;
}

export function QuestionCard(props: QuestionCardProps) {
  const { id, testId, type, content, codeSnippet, options, answer, testCases, evaluationGuidelines, points } = props;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const deleteQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Question deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting question",
        description: error.message || "An error occurred while deleting the question",
        variant: "destructive",
      });
    }
  });
  
  function getBadgeVariant(type: QuestionType) {
    switch (type) {
      case "multipleChoice":
        return "primary";
      case "coding":
        return "secondary";
      case "subjective":
        return "outline";
      default:
        return "default";
    }
  }
  
  function getTypeLabel(type: QuestionType) {
    switch (type) {
      case "multipleChoice":
        return "Multiple Choice";
      case "coding":
        return "Coding";
      case "subjective":
        return "Subjective";
      default:
        return type;
    }
  }

  return (
    <>
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Badge variant={getBadgeVariant(type)} className="mr-2">
                {getTypeLabel(type)}
              </Badge>
              <h4 className="text-base font-medium text-gray-900">{content}</h4>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 text-gray-500" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the question.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => deleteQuestionMutation.mutate()}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          {codeSnippet && (
            <div className="mt-2 bg-gray-100 p-3 rounded text-sm text-gray-800 font-mono">
              {codeSnippet}
            </div>
          )}
          
          {type === "multipleChoice" && options && (
            <div className="mt-3 space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input 
                    type="radio" 
                    id={`q${id}-option${index}`} 
                    name={`q${id}-options`} 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                    defaultChecked={answer === index.toString()}
                    disabled
                  />
                  <label 
                    htmlFor={`q${id}-option${index}`} 
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}
          
          {type === "coding" && testCases && (
            <div className="mt-3 bg-gray-100 p-3 rounded text-sm text-gray-800">
              <div className="flex items-center mb-2">
                <span className="font-medium">Test Cases:</span>
              </div>
              <div className="text-xs font-mono">
                {testCases.map((testCase, index) => (
                  <div key={index}>
                    Input: {testCase.input} → Output: {testCase.output}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {type === "subjective" && evaluationGuidelines && (
            <div className="mt-3 bg-gray-100 p-3 rounded text-sm text-gray-800">
              <div className="font-medium mb-1">Evaluation Guidelines:</div>
              <div className="whitespace-pre-line text-xs">{evaluationGuidelines}</div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 text-right">
            Points: {points}
          </div>
        </CardContent>
      </Card>
      
      {isEditing && (
        <QuestionForm
          testId={testId}
          questionId={id}
          defaultValues={{
            type,
            content,
            codeSnippet,
            options,
            answer,
            testCases,
            evaluationGuidelines,
            points,
            order: props.order,
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

export default QuestionCard;
