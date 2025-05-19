import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { 
  Search, 
  Copy, 
  Mail,
  Eye, 
  ChevronRight,
  ClipboardList,
  Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CandidatesIndex() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all tests first
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ["/api/tests"],
    enabled: !!user,
  });
  
  // Process tests to get all candidates
  const candidates = tests?.flatMap((test: any) => {
    if (!test.candidates) return [];
    return test.candidates.map((candidate: any) => ({
      ...candidate,
      testTitle: test.title,
      testId: test.id
    }));
  }) || [];
  
  // Filter candidates based on search query
  const filteredCandidates = candidates.filter((candidate: any) => 
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const copyTestLink = (testLink: string) => {
    const url = `${window.location.origin}/take-test/${testLink}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Test link has been copied to clipboard",
    });
  };
  
  if (!user) {
    return null;
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Candidates</h1>
          </div>
          <Button asChild>
            <Link href="/tests">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              View Tests
            </Link>
          </Button>
        </header>
        
        {/* Candidates content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search candidates..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Candidates</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {testsLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading candidates...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredCandidates.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invited</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates.map((candidate: any) => (
                            <TableRow key={candidate.id}>
                              <TableCell className="font-medium">{candidate.name}</TableCell>
                              <TableCell>{candidate.email}</TableCell>
                              <TableCell>
                                <Link href={`/tests/${candidate.testId}`}>
                                  <a className="flex items-center text-primary-600 hover:underline">
                                    {candidate.testTitle}
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </a>
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    candidate.status === "completed"
                                      ? "success"
                                      : candidate.status === "in_progress"
                                      ? "warning"
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
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 mb-4">
                          {searchQuery ? (
                            <>No candidates found matching "<strong>{searchQuery}</strong>"</>
                          ) : (
                            "No candidates have been invited yet."
                          )}
                        </p>
                        {!searchQuery && (
                          <Button asChild>
                            <Link href="/tests">
                              <Users className="h-4 w-4 mr-1.5" />
                              Invite Candidates
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {testsLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading candidates...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredCandidates.filter((c: any) => c.status === "completed").length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates
                            .filter((c: any) => c.status === "completed")
                            .map((candidate: any) => (
                              <TableRow key={candidate.id}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                <TableCell>{candidate.email}</TableCell>
                                <TableCell>{candidate.testTitle}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      candidate.score >= 70
                                        ? "success"
                                        : "destructive"
                                    }
                                  >
                                    {candidate.score}%
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(candidate.completedAt)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/tests/${candidate.testId}`}>
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      View
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">
                          No candidates have completed tests yet.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="in-progress">
                {testsLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading candidates...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredCandidates.filter((c: any) => c.status === "in_progress").length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates
                            .filter((c: any) => c.status === "in_progress")
                            .map((candidate: any) => (
                              <TableRow key={candidate.id}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                <TableCell>{candidate.email}</TableCell>
                                <TableCell>{candidate.testTitle}</TableCell>
                                <TableCell>{formatDate(candidate.startedAt)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/tests/${candidate.testId}`}>
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      View
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">
                          No candidates are currently taking tests.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {testsLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading candidates...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredCandidates.filter((c: any) => c.status === "pending").length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead>Invited</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCandidates
                            .filter((c: any) => c.status === "pending")
                            .map((candidate: any) => (
                              <TableRow key={candidate.id}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                <TableCell>{candidate.email}</TableCell>
                                <TableCell>{candidate.testTitle}</TableCell>
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
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">
                          No pending invitations found.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
