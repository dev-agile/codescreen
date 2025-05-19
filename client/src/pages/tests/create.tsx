import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import TestForm from "@/components/tests/test-form";
import QuestionForm from "@/components/tests/question-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function CreateTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [step, setStep] = useState<"details" | "questions">("details");
  const [testId, setTestId] = useState<number | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  // Only fetch test questions if we have a testId
  const { data: test, isLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });
  
  if (!user) {
    return null;
  }
  
  const handleQuestionPhase = () => {
    setStep("questions");
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-0 lg:pt-0">
        {/* Top bar */}
        <header className="hidden lg:flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create New Test</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/tests">
              Cancel
            </Link>
          </Button>
        </header>
        
        {/* Create test content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 lg:hidden">Create New Test</h1>
              <Button variant="outline" className="lg:hidden" asChild>
                <Link href="/tests">
                  Cancel
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                    1
                  </div>
                  <CardTitle>Test Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className={step === "details" ? "py-6" : "hidden"}>
                <TestForm 
                  onQuestionPhase={handleQuestionPhase} 
                />
              </CardContent>
            </Card>
            
            {step === "questions" && (
              <Card className="mt-6">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center">
                        2
                      </div>
                      <CardTitle>Questions</CardTitle>
                    </div>
                    <Button 
                      onClick={() => setIsAddingQuestion(true)}
                      disabled={isAddingQuestion}
                    >
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-6">
                  {isLoading ? (
                    <div className="text-center py-6">
                      <p>Loading questions...</p>
                    </div>
                  ) : test?.questions?.length > 0 ? (
                    <div className="space-y-4">
                      {test.questions.map((question: any) => (
                        <div key={question.id}>
                          {/* Display questions here - will be implemented in the actual view */}
                          <div className="p-4 border rounded-md">
                            <h3 className="font-medium">{question.content}</h3>
                            <p className="text-sm text-gray-500">
                              Type: {question.type === "multipleChoice" 
                                ? "Multiple Choice" 
                                : question.type === "coding" 
                                  ? "Coding" 
                                  : "Subjective"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 mb-4">
                        You haven't added any questions yet.
                      </p>
                      <Button 
                        onClick={() => setIsAddingQuestion(true)}
                        disabled={isAddingQuestion}
                      >
                        Add Your First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {isAddingQuestion && test && (
              <QuestionForm
                testId={test.id}
                onClose={() => setIsAddingQuestion(false)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
