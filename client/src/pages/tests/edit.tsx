import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import TestForm from "@/components/tests/test-form";
import QuestionForm from "@/components/tests/question-form";
import QuestionCard from "@/components/tests/question-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft } from "lucide-react";

export default function EditTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [, setLocation] = useLocation();
  const [isRoute, params] = useRoute("/tests/:id/edit");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  const testId = isRoute ? parseInt(params.id) : 0;
  
  const { data: test, isLoading, error } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!user && !!testId,
  });
  
  if (!user) {
    return null;
  }
  
  if (!isRoute) {
    setLocation("/tests");
    return null;
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">Failed to load test: {(error as Error).message}</p>
          <Button asChild>
            <Link href="/tests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
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
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/tests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              {isLoading ? "Loading..." : `Edit: ${test?.title}`}
            </h1>
          </div>
          <Button asChild>
            <Link href={`/tests/${testId}`}>
              View Test
            </Link>
          </Button>
        </header>
        
        {/* Edit test content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-10">
                <p>Loading test details...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/tests">
                        <ArrowLeft className="h-5 w-5" />
                      </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">Edit: {test?.title}</h1>
                  </div>
                </div>
                
                <Tabs defaultValue="details">
                  <TabsList className="mb-6">
                    <TabsTrigger value="details">Test Details</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <Card>
                      <CardContent className="pt-6">
                        <TestForm 
                          defaultValues={{
                            title: test?.title,
                            description: test?.description,
                            duration: test?.duration,
                            passingScore: test?.passingScore,
                            shuffleQuestions: test?.shuffleQuestions,
                          }} 
                          testId={testId} 
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="questions">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium">Questions</CardTitle>
                        <Button 
                          onClick={() => setIsAddingQuestion(true)}
                          disabled={isAddingQuestion}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add Question
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {test?.questions?.length > 0 ? (
                          <div className="space-y-4">
                            {test.questions.map((question: any) => (
                              <QuestionCard
                                key={question.id}
                                id={question.id}
                                testId={testId}
                                type={question.type}
                                content={question.content}
                                codeSnippet={question.codeSnippet}
                                options={question.options}
                                answer={question.answer}
                                testCases={question.testCases}
                                evaluationGuidelines={question.evaluationGuidelines}
                                points={question.points}
                                order={question.order}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-sm text-gray-500 mb-4">
                              No questions have been added to this test yet.
                            </p>
                            <Button 
                              onClick={() => setIsAddingQuestion(true)}
                              disabled={isAddingQuestion}
                            >
                              <Plus className="h-4 w-4 mr-1.5" />
                              Add First Question
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                {isAddingQuestion && test && (
                  <QuestionForm
                    testId={testId}
                    onClose={() => setIsAddingQuestion(false)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
