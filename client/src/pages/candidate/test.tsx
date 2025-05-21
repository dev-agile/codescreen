import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Code2 } from "lucide-react";
import Timer from "@/components/timer";
import QuestionView from "@/components/candidate/question-view";
import QuestionNavigation from "@/components/candidate/question-navigation";
import TestProgress from "@/components/candidate/test-progress";
import TestInstructionsScreen from "@/components/candidate/test-instructions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type QuestionType = "multipleChoice" | "coding" | "subjective" | "patternRecognition";

// Define test data type
interface TestData {
  testTitle: string;
  testDescription?: string;
  startedAt: string;
  duration: number;
  questions: Array<{
    id: number;
    type: QuestionType;
    content: string;
    options?: string[];
    codeSnippet?: string;
    testCases?: { input: string; output: string; }[];
    evaluationGuidelines?: string;
    imageUrl?: string;
  }>;
  candidateId: number;
}

// Storage key generator
const getStorageKey = (testLink: string) => `test_${testLink}_answers`;
const getResponseStorageKey = (testLink: string, questionId: number) => `response_${testLink}_${questionId}`;

export default function CandidateTest() {
  const [isRoute, params] = useRoute("/take-test/:testLink");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [minimizeCount, setMinimizeCount] = useState(0);
  
  const testLink = isRoute ? params.testLink : "";
  
  // Fetch test data and validate session
  const { data: testData, isLoading, error, refetch } = useQuery<TestData, Error>({
    queryKey: [`/api/candidate/${testLink}`],
    enabled: !!testLink,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Track minimize attempts
  useEffect(() => {
    if (!testData?.startedAt) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setMinimizeCount((prev) => prev + 1);
        setShowWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testData?.startedAt]);

  // Auto-submit on 3rd minimize
  useEffect(() => {
    if (minimizeCount >= 5) {
      submitMutation.mutate(true);
    }
  }, [minimizeCount]);

  // Handle fullscreen state and enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && testData?.startedAt) {
        setFullscreenError("Fullscreen mode is required. Please return to fullscreen to continue the test.");
      } else {
        setFullscreenError(null);
      }
    };

    // Check initial fullscreen state
    handleFullscreenChange();

    // Request fullscreen if test is started but not in fullscreen
    if (testData?.startedAt && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        setFullscreenError("Fullscreen mode is required to take this test. Please allow fullscreen access.");
      });
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testData?.startedAt]);

  // Handle session errors
  useEffect(() => {
    if (error?.message?.includes('session')) {
      setSessionError('This test is already in progress in another session. Please close other sessions or contact support.');
    }
  }, [error]);
  
  // Track answered questions
  const handleSaveResponse = () => {
    setAnsweredQuestions(prev => {
      const newAnswered = new Set(prev);
      newAnswered.add(currentQuestionIndex);
      return Array.from(newAnswered).sort((a, b) => a - b);
    });
  };
  
  const handleClearResponse = () => {
    setAnsweredQuestions(prev => {
      const newAnswered = new Set(prev);
      newAnswered.delete(currentQuestionIndex);
      return Array.from(newAnswered).sort((a, b) => a - b);
    });
  };
  
  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: async (autoSubmitted: boolean = false) => {
      const res = await apiRequest("POST", `/api/candidate/${testLink}/submit`, { 
        autoSubmitted
      });
      return res.json();
    },
    onSuccess: () => {
      setLocation("/test-complete");
    }
  });
  
  // Handle auto-submit when timer expires
  const handleTimeUp = () => {
    submitMutation.mutate(true);
  };
  
  // Handle manual submission
  const handleSubmitTest = () => {
    submitMutation.mutate(false);
  };
  
  // Handle navigation between questions
  const goToNextQuestion = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const selectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleStartTest = async () => {
    try {
      // Call the start endpoint
      const res = await apiRequest("POST", `/api/candidate/${testLink}/start`);
      const data = await res.json();
      
      // Refetch test data to get updated startedAt
      refetch();
    } catch (error) {
      console.error("Failed to start test:", error);
      toast({
        title: "Error",
        description: "Failed to start the test. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (!isRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Test Link</h1>
          <p className="text-gray-600 mb-4">The test link you are trying to access is invalid or has expired.</p>
        </div>
      </div>
    );
  }
  
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Session Error</h1>
          <p className="text-gray-600 mb-4">{sessionError}</p>
          <p className="text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-primary-600 flex items-center justify-center mb-4">
            <Code2 className="mr-2 h-8 w-8" />
            CodeScreen
          </h1>
          <p className="text-gray-600">Loading your test...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    let errorTitle = "Error";
    let errorMessage = "Failed to load the test: " + (error as Error).message;
    if ((error as Error).message?.includes("This test has already been completed")) {
      errorTitle = "Test Already Taken";
      errorMessage = "This test has already been completed. You cannot retake it.";
    } else if ((error as Error).message?.includes("Invalid test link")) {
      errorTitle = "Invalid Test Link";
      errorMessage = "The test link you are trying to access is invalid or has expired.";
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">{errorTitle}</h1>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
        </div>
      </div>
    );
  }
console.log(testData,'testData');

  // Show instructions screen if test hasn't started
  if (!testData.startedAt) {
    return <TestInstructionsScreen testData={testData} onStart={handleStartTest} />;
  }
  
  // Show fullscreen warning if test is started but not in fullscreen
  if (testData.startedAt && !isFullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Fullscreen Required</h1>
          <p className="text-gray-600 mb-6">
            This test must be taken in fullscreen mode to ensure academic integrity.
            Please click the button below to return to fullscreen mode.
          </p>
          <Button 
            onClick={() => document.documentElement.requestFullscreen()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Return to Fullscreen Mode
          </Button>
        </div>
      </div>
    );
  }
  
  const currentQuestion = testData.questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Warning Dialog */}
      {showWarning && minimizeCount < 6 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-4">Warning!</h2>
            <p className="text-gray-700 mb-4">
              {minimizeCount === 1 &&
                "You have minimized the test window. This is your first warning. On the 3rd attempt, your test will be auto-submitted."}
              {minimizeCount === 2 &&
                "You have minimized the test window again. This is your second warning. On the 3rd attempt, your test will be auto-submitted."}
              {(minimizeCount === 3 || minimizeCount === 4 || minimizeCount === 5) &&
                "You have minimized the test window again. This is your last warning, your test will be auto-submitted after this attempt."}
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowWarning(false)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600 flex items-center">
                  <Code2 className="mr-2 h-6 w-6" />
                  CodeScreen
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              {testData.startedAt && (
                <Timer 
                  endTime={new Date(new Date(testData.startedAt).getTime() + testData.duration * 60000)} 
                  onTimeUp={handleTimeUp} 
                />
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{testData.testTitle}</h2>
                {testData.testDescription && (
                  <p className="mt-1 text-sm text-gray-500">
                    {testData.testDescription}
                  </p>
                )}
              </div>
              <div className="mt-3 sm:mt-0 flex items-center">
                <TestProgress 
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={testData.questions.length}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* <QuestionNavigation
            totalQuestions={testData.questions.length}
            currentQuestionIndex={currentQuestionIndex}
            answeredQuestions={answeredQuestions}
            onQuestionSelect={selectQuestion}
          /> */}
          
          {currentQuestion && (
            <QuestionView 
              candidateId={testData.candidateId}
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={testData.questions.length}
              testLink={testLink}
              onPrevious={goToPreviousQuestion}
              onNext={goToNextQuestion}
              onSaveResponse={handleSaveResponse}
              onClearResponse={handleClearResponse}
              onSubmit={() => setIsSubmitDialogOpen(true)}
            />
          )}

          {/* Submit confirmation dialog */}
          <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to submit your test?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have answered {answeredQuestions.length} out of {testData.questions.length} questions.
                  Once submitted, you won't be able to make any changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSubmitTest}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Test"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
