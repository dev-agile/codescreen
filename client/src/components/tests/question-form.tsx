import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertQuestionSchema } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

// Extend the schema with client-side validation
const questionFormSchema = insertQuestionSchema.extend({
  type: z.enum(["multipleChoice", "coding", "subjective", "patternRecognition"], {
    required_error: "Please select a question type",
  }),
  content: z.string().min(3, "Question content must be at least 3 characters"),
  codeSnippet: z.string().optional(),
  options: z.array(z.string().min(1, "Option cannot be empty")).optional(),
  answer: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).optional(),
  evaluationGuidelines: z.string().optional(),
  imageUrl: z.string().optional(),
  points: z.number().min(1, "Points must be at least 1"),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  testId: number;
  questionId?: number;
  defaultValues?: Partial<QuestionFormValues>;
  onClose: () => void;
}

export function QuestionForm({ testId, questionId, defaultValues, onClose }: QuestionFormProps) {
  const queryClient = useQueryClient();
  const [questionType, setQuestionType] = useState<string>(defaultValues?.type || "multipleChoice");
  const [options, setOptions] = useState<string[]>(defaultValues?.options as string[] || ["", "", "", ""]);
  const [testCases, setTestCases] = useState<{ input: string, output: string }[]>(
    defaultValues?.testCases as any[] || [{ input: "", output: "" }]
  );
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.imageUrl || "");
  
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      testId,
      type: defaultValues?.type || "multipleChoice",
      content: defaultValues?.content || "",
      codeSnippet: defaultValues?.codeSnippet || "",
      options: defaultValues?.options || ["", "", "", ""],
      answer: defaultValues?.answer || "0",
      testCases: defaultValues?.testCases || [{ input: "", output: "" }],
      evaluationGuidelines: defaultValues?.evaluationGuidelines || "",
      imageUrl: defaultValues?.imageUrl || "",
      points: defaultValues?.points || 1,
      order: defaultValues?.order || 0,
    }
  });
  
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Question added successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding question",
        description: error.message || "An error occurred while adding the question",
        variant: "destructive",
      });
    }
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("PUT", `/api/questions/${questionId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Question updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating question",
        description: error.message || "An error occurred while updating the question",
        variant: "destructive",
      });
    }
  });
  
  function handleQuestionTypeChange(value: string) {
    setQuestionType(value);
    form.setValue("type", value as any);
  }
  
  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("options", newOptions);
  }
  
  function addOption() {
    setOptions([...options, ""]);
  }
  
  function removeOption(index: number) {
    if (options.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "Multiple choice questions must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    form.setValue("options", newOptions);
    
    // If the correct answer index is now out of bounds, reset it to 0
    const currentAnswer = form.getValues("answer");
    if (currentAnswer && parseInt(currentAnswer as string) >= newOptions.length) {
      form.setValue("answer", "0");
    }
  }
  
  function handleTestCaseChange(index: number, field: 'input' | 'output', value: string) {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
    form.setValue("testCases", newTestCases);
  }
  
  function addTestCase() {
    setTestCases([...testCases, { input: "", output: "" }]);
  }
  
  function removeTestCase(index: number) {
    if (testCases.length <= 1) {
      toast({
        title: "Cannot remove test case",
        description: "Coding questions must have at least 1 test case",
        variant: "destructive",
      });
      return;
    }
    
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
    form.setValue("testCases", newTestCases);
  }
  
  function onSubmit(data: QuestionFormValues) {
    // Prepare the data based on question type
    const questionData = {
      ...data,
      testId,
    };
    
    if (questionData.type !== "multipleChoice" && questionData.type !== "patternRecognition") {
      delete questionData.options;
      delete questionData.answer;
    }
    
    if (questionData.type !== "coding") {
      delete questionData.testCases;
    }
    
    if (questionData.type !== "subjective") {
      delete questionData.evaluationGuidelines;
    }
    
    if (questionData.type !== "patternRecognition") {
      delete questionData.imageUrl;
    }
    
    if (questionId) {
      updateQuestionMutation.mutate(questionData);
    } else {
      createQuestionMutation.mutate(questionData);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{questionId ? "Edit Question" : "Add Question"}</DialogTitle>
        </DialogHeader>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleQuestionTypeChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="subjective">Subjective</SelectItem>
                        <SelectItem value="patternRecognition">Pattern Recognition</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the question text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      The number of points awarded for correctly answering this question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {questionType === "multipleChoice" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </RadioGroup>
                          <FormDescription>
                            Select the correct answer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              
              {questionType === "coding" && (
                <>
                  <FormField
                    control={form.control}
                    name="codeSnippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Snippet (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="function example() {\n  // Your code here\n}"
                            className="font-mono"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Initial code snippet for the candidate to work with
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Test Cases</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTestCase}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                    
                    {testCases.map((testCase, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="space-y-2 flex-1">
                          <Input
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                            placeholder="Input"
                          />
                          <Input
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                            placeholder="Expected Output"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {questionType === "subjective" && (
                <FormField
                  control={form.control}
                  name="evaluationGuidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluation Guidelines</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Understanding of concepts (3 points)\nClarity of explanation (3 points)\nRelevant examples (4 points)"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Guidelines for evaluating the subjective response
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {questionType === "patternRecognition" && (
                <>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pattern Image</FormLabel>
                        <FormControl>
                          <FileUpload 
                            onUploadComplete={(url) => {
                              field.onChange(url);
                              setImageUrl(url);
                            }}
                            currentImageUrl={field.value}
                            label="Upload Pattern Sequence Image"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload an image showing the pattern sequence
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {imageUrl && (
                    <div className="mt-2 p-4 border rounded-md">
                      <p className="text-sm font-medium mb-2">Image Preview:</p>
                      <img 
                        src={imageUrl} 
                        alt="Pattern sequence" 
                        className="max-w-full h-auto max-h-[200px] object-contain border rounded-md" 
                        onError={(e) => { 
                          (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                        }} 
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Pattern Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={index.toString()} id={`pattern-option-${index}`} />
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </RadioGroup>
                          <FormDescription>
                            Enter the possible next patterns as text and select the correct one
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                >
                  {createQuestionMutation.isPending || updateQuestionMutation.isPending ? 
                    "Saving..." : 
                    (questionId ? "Update Question" : "Add Question")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuestionForm;
