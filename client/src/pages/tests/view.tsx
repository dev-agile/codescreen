import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Copy,
  Share2,
  Mail,
  Trash2
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BulkInvite from "@/components/candidate/bulk-invite";

// Schema for inviting a candidate
const inviteCandidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type InviteCandidateFormValues = z.infer<typeof inviteCandidateSchema>;

export default function ViewTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [, setLocation] = useLocation();
  const [isRoute, params] = useRoute("/tests/:id");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isBulkInviteDialogOpen, setIsBulkInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const testId = isRoute ? parseInt(params.id) : 0;
  
  const { data: test, isLoading, error } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!user && !!testId,
  });
  
  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/candidates`],
    enabled: !!user && !!testId,
  });
  
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteCandidateFormValues) => {
      const res = await apiRequest("POST", "/api/candidates", {
        ...data,
        testId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      setIsInviteDialogOpen(false);
      toast({
        title: "Candidate invited successfully",
        description: "An invitation link has been generated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to invite candidate",
        variant: "destructive",
      });
    }
  });
  
  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("DELETE", `/api/candidates/${candidateId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      toast({
        title: "Candidate deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete candidate",
        variant: "destructive",
      });
    }
  });
  
  const inviteForm = useForm<InviteCandidateFormValues>({
    resolver: zodResolver(inviteCandidateSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });
  
  const onInviteSubmit = (data: InviteCandidateFormValues) => {
    inviteMutation.mutate(data);
  };
  
  const copyTestLink = (testLink: string) => {
    const url = `${window.location.origin}/take-test/${testLink}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Test link has been copied to clipboard",
    });
  };
  
  const handleDeleteCandidate = (candidateId: number) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      deleteCandidateMutation.mutate(candidateId);
    }
  };
  
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
    
  const typedTest = test as any;
  const typedCandidates = candidates as any[];
  
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
              {isLoading ? "Loading..." : typedTest?.title}
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Invite Candidate
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsBulkInviteDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Bulk Invite
            </Button>
            <Button asChild>
              <Link href={`/tests/${testId}/edit`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit Test
              </Link>
            </Button>
          </div>
        </header>
        
        {/* View test content */}
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
                    <h1 className="text-xl font-bold text-gray-900">{typedTest?.title}</h1>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Test Information</CardTitle>
                      {typedTest.description && (
                        <CardDescription>
                          {typedTest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <dl className="divide-y divide-gray-200">
                        <div className="py-3 grid grid-cols-3 gap-2">
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                            Duration
                          </dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {formatDuration(typedTest.duration)}
                          </dd>
                        </div>
                        <div className="py-3 grid grid-cols-3 gap-2">
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1.5 text-gray-400" />
                            Passing Score
                          </dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {typedTest.passingScore}%
                          </dd>
                        </div>
                        <div className="py-3 grid grid-cols-3 gap-2">
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                            Created On
                          </dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {formatDate(typedTest.createdAt)}
                          </dd>
                        </div>
                        <div className="py-3 grid grid-cols-3 gap-2">
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                            Questions
                          </dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {typedTest.questions?.length || 0} questions
                          </dd>
                        </div>
                      </dl>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => setIsInviteDialogOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-1.5" />
                          Invite Candidate
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => setIsBulkInviteDialogOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-1.5" />
                          Bulk Invite
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full" 
                          asChild
                        >
                          <Link href={`/tests/${testId}/edit`}>
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit Test
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Total Candidates</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.total || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Completed</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.completed || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">In Progress</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.inProgress || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Average Score</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.avgScore || 0}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Candidates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all">
                        {candidatesLoading ? (
                          <div className="text-center py-6">
                            <p>Loading candidates...</p>
                          </div>
                        ) : typedCandidates && typedCandidates.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Invited</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        candidate.status === "completed"
                                          ? "success"
                                          : candidate.status === "in_progress"
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {candidate.status === "pending"
                                        ? "Pending"
                                        : candidate.status === "in_progress"
                                        ? "In Progress"
                                        : "Completed"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{candidate.invitedAt ? formatDate(candidate.invitedAt) : "-"}</TableCell>
                                  <TableCell>{candidate.score !== undefined ? `${candidate.score}%` : "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete candidate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-6">
                            <p>No candidates found.</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="completed">
                        {candidatesLoading ? (
                          <div className="text-center py-6">
                            <p>Loading candidates...</p>
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "completed").length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Completed At</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Time Taken</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "completed").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell>{formatDate(candidate.completedAt)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        candidate.score >= (typedTest.passingScore || 70)
                                          ? "success"
                                          : "destructive"
                                      }
                                    >
                                      {candidate.score}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {candidate.startedAt && candidate.completedAt
                                      ? formatDuration(
                                          Math.round(
                                            (new Date(candidate.completedAt).getTime() -
                                              new Date(candidate.startedAt).getTime()) /
                                              60000
                                          )
                                        )
                                      : "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-500">
                              No candidates have completed the test yet.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="in-progress">
                        {candidatesLoading ? (
                          <div className="text-center py-6">
                            <p>Loading candidates...</p>
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "in_progress").length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Started At</TableHead>
                                <TableHead>Time Elapsed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "in_progress").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell>{formatDate(candidate.startedAt)}</TableCell>
                                  <TableCell>
                                    {candidate.startedAt
                                      ? formatDuration(
                                          Math.round(
                                            (new Date().getTime() -
                                              new Date(candidate.startedAt).getTime()) /
                                              60000
                                          )
                                        )
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete candidate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-500">
                              No candidates are currently taking the test.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="pending">
                        {candidatesLoading ? (
                          <div className="text-center py-6">
                            <p>Loading candidates...</p>
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "pending").length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Invited At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "pending").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell>{formatDate(candidate.invitedAt)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          // In a real app, this would open email
                                          window.open(`mailto:${candidate.email}?subject=Invitation to take a coding test&body=Please take the test at ${window.location.origin}/take-test/${candidate.testLink}`, "_blank");
                                        }}
                                      >
                                        <Mail className="h-4 w-4" />
                                        <span className="sr-only">Send email</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-500">
                              No pending invitations.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Invite Candidate Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Candidate</DialogTitle>
            <DialogDescription>
              Send a test invitation to a candidate for "{typedTest?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
              <FormField
                control={inviteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Inviting..." : "Invite Candidate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Invite Dialog */}
      <Dialog open={isBulkInviteDialogOpen} onOpenChange={setIsBulkInviteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Invite Candidates</DialogTitle>
            <DialogDescription>
              Upload an Excel file with candidate details. The file should have columns for "Candidate Name", "Phone Number", and "Email ID".
            </DialogDescription>
          </DialogHeader>
          <BulkInvite 
            onSuccess={() => {
              setIsBulkInviteDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
            }} 
            testId={testId}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkInviteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
