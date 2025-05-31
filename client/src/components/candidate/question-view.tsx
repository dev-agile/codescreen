import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

// Storage key generator
const getResponseStorageKey = (testLink: string, questionId: number) => 
  `test_${testLink}_question_${questionId}_response`;

type QuestionType = "multipleChoice" | "coding" | "subjective" | "patternRecognition";

interface QuestionViewProps {
  candidateId: number;
  question: {
    id: number;
    type: QuestionType;
    content: string;
    codeSnippet?: string;
    options?: string[];
    testCases?: Array<{input: string; output: string}>;
    evaluationGuidelines?: string;
    imageUrl?: string;
  };
  questionNumber: number;
  totalQuestions: number;
  testLink: string;
  onPrevious: () => void;
  onNext: () => void;
  onSaveResponse: () => void;
  onClearResponse: () => void;
  onSubmit?: () => void;
}

export function QuestionView({
  candidateId,
  question,
  questionNumber,
  totalQuestions,
  testLink,
  onPrevious,
  onNext,
  onSaveResponse,
  onClearResponse,
  onSubmit
}: QuestionViewProps) {
  const [response, setResponse] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Load saved response from localStorage
  useEffect(() => {
    const savedResponse = localStorage.getItem(getResponseStorageKey(testLink, question.id));
    if (savedResponse) {
      try {
        const parsedResponse = JSON.parse(savedResponse);
        // Only set response if it's a valid option for this question
        if (question.type === "multipleChoice" || question.type === "patternRecognition") {
          const optionIndex = parseInt(parsedResponse.response);
          if (!isNaN(optionIndex) && question.options && optionIndex < question.options.length) {
            setResponse(parsedResponse.response);
          } else {
            setResponse(""); // Reset if invalid option
          }
        } else {
          setResponse(parsedResponse.response || "");
        }
        setLastSaved(new Date(parsedResponse.timestamp));
      } catch (e) {
        console.error('Error parsing saved response:', e);
        setResponse(""); // Reset on error
      }
    } else {
      setResponse(""); // Reset if no saved response
    }
  }, [testLink, question.id, question.type, question.options]);

  // Save response to localStorage
  const saveToLocalStorage = (value: string) => {
    const dataToSave = {
      response: value,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(
      getResponseStorageKey(testLink, question.id),
      JSON.stringify(dataToSave)
    );
  };
  
  // Get existing response for this question
  const { data: existingResponse } = useQuery({
    queryKey: [`/api/candidate/${testLink}/responses/${question.id}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/candidate/${testLink}/responses/${question.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            return null; // No response yet
          }
          throw new Error('Failed to fetch response');
        }
        const data = await res.json();
        return data;
      } catch (error) {
        console.error('Error fetching response:', error);
        return null;
      }
    },
    enabled: !!testLink && !!question.id,
    retry: false,
  });
  
  // Initialize response from existing data
  useEffect(() => {
    if (existingResponse?.response) {
      setResponse(existingResponse.response);
    }
  }, [existingResponse]);
  
  // Save response mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/candidate/${testLink}/responses`, {
        questionId: question.id,
        response
      });
      if (!res.ok) {
        throw new Error('Failed to save response');
      }
      return res.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
      onSaveResponse();
    },
    onError: (error) => {
      console.error('Error saving response:', error);
      setIsSaving(false);
    }
  });
  
  // Autosave response when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (response && !isSaving) {
        setIsSaving(true);
        saveMutation.mutate();
        saveToLocalStorage(response);
      }
    }, 20000);
    
    return () => clearTimeout(timer);
  }, [response, isSaving]);
  
  // Handle response change
  const handleResponseChange = (value: string) => {
    setResponse(value);
    saveToLocalStorage(value);
    
    if (value.trim()) {
      setIsSaving(true);
      saveMutation.mutate();  // Save to backend immediately
      onSaveResponse();
    } else {
      setIsSaving(true);
      saveMutation.mutate();  // Save empty response to backend
      onClearResponse();
    }
  };
  
  // Clear response
  const clearResponse = () => {
    setResponse("");
    saveToLocalStorage("");
    setIsSaving(true);
    saveMutation.mutate();  // Save empty response to backend
    onClearResponse();
  };
  
  // Get badge variant based on question type
  const getBadgeVariant = (type: QuestionType) => {
    switch (type) {
      case "multipleChoice":
        return "default";
      case "coding":
        return "secondary";
      case "subjective":
        return "outline";
      case "patternRecognition":
        return "default";
      default:
        return "default";
    }
  };
  
  // Get type label
  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "multipleChoice":
        return "Multiple Choice";
      case "coding":
        return "Coding";
      case "subjective":
        return "Subjective";
      case "patternRecognition":
        return "Pattern Recognition";
      default:
        return type;
    }
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden sm:rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Question {questionNumber} of {totalQuestions}
          </h3>
          <Badge variant={getBadgeVariant(question.type)}>
            {getTypeLabel(question.type)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-5 sm:p-6">
        <h4 
          className="text-xl font-medium text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: question.content.replace(/\n/g, '<br/>') }}
        />
        
        {question.codeSnippet && (
          <div className="text-sm text-gray-700 mb-6">
            <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 overflow-x-auto">
              {question.codeSnippet}
            </div>
          </div>
        )}
        
        {question.type === "multipleChoice" && question.options && (
          <RadioGroup 
            value={response} 
            onValueChange={handleResponseChange}
            className="space-y-2"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-gray-700">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        
        {question.type === "coding" && (
          <>
            {question.testCases && (
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-900 mb-2">Test Cases:</h5>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 overflow-x-auto">
                  {question.testCases.map((testCase, index) => (
                    <div key={index} className="mb-1">
                      Input: <code>{testCase.input}</code> → Output: <code>{testCase.output}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                Your Solution:
              </Label>
              <Textarea
                id="answer"
                value={response}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Write your code here..."
                className="font-mono text-sm h-96"
              />
            </div>
          </>
        )}
        
        {question.type === "subjective" && (
          <>
            {question.evaluationGuidelines && (
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-900 mb-2">Evaluation Guidelines:</h5>
                <div className="bg-gray-100 p-3 rounded text-sm text-gray-800 whitespace-pre-line">
                  {question.evaluationGuidelines}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                Your Answer:
              </Label>
              <Textarea
                id="answer"
                value={response}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Write your answer here..."
                className="h-40"
              />
            </div>
          </>
        )}
        
        {question.type === "patternRecognition" && (
          <>
            {question.imageUrl && (
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-900 mb-2">Pattern Sequence:</h5>
                <div className="bg-white border rounded-md p-4 flex justify-center">
                  <img 
                    src={question.imageUrl} 
                    alt="Pattern sequence" 
                    className="max-w-full h-auto max-h-[300px] object-contain" 
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x200?text=Image+Not+Available";
                    }} 
                  />
                </div>
              </div>
            )}
            {question.options && (
              <div className="mt-6">
                <h5 className="text-md font-medium text-gray-900 mb-4">Select the next pattern in the sequence:</h5>
                <RadioGroup 
                  value={response} 
                  onValueChange={handleResponseChange}
                  className="space-y-2"
                >
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`pattern-option-${index}`} />
                      <Label htmlFor={`pattern-option-${index}`} className="text-gray-700">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between items-center border-t border-gray-200">
        <Button
          type="button"
          onClick={onPrevious}
          disabled={questionNumber === 1}
          variant="outline"
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Your work is automatically saved'}
          </span>
          <Badge variant={isSaving ? "outline" : "success"} className="text-xs">
            {isSaving ? (
              <>
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
                Saved
              </>
            )}
          </Badge>
        </div>
        
        {questionNumber === totalQuestions ? (
          <Button
            type="button"
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit Test
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
          >
            Next
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default QuestionView;
