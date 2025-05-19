import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Clock, 
  Users, 
  CheckCircle, 
  ClipboardList, 
  Eye, 
  Pencil, 
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TestsIndex() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: tests, isLoading } = useQuery({
    queryKey: ["/api/tests"],
    enabled: !!user,
  });
  
  if (!user) {
    return null;
  }
  
  // Filter tests based on search query
  const filteredTests = tests?.filter((test: any) => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
            <h1 className="text-xl font-bold text-gray-900">Tests</h1>
          </div>
          <Button asChild>
            <Link href="/tests/create">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Test
            </Link>
          </Button>
        </header>
        
        {/* Tests content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search tests..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button asChild className="md:hidden">
                <Link href="/tests/create">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Test
                </Link>
              </Button>
            </div>
            
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Tests</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {isLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading tests...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredTests?.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test Name</TableHead>
                            <TableHead className="hidden md:table-cell">Duration</TableHead>
                            <TableHead className="hidden md:table-cell">Candidates</TableHead>
                            <TableHead className="hidden md:table-cell">Completion</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTests.map((test: any) => (
                            <TableRow key={test.id}>
                              <TableCell className="font-medium">{test.title}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                  {formatDuration(test.duration)}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                                  {test.stats.total} sent
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1.5 text-gray-500" />
                                  {test.stats.completed} / {test.stats.total}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <ClipboardList className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/tests/${test.id}`}>
                                        <a className="flex items-center cursor-pointer">
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </a>
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/tests/${test.id}/edit`}>
                                        <a className="flex items-center cursor-pointer">
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit Test
                                        </a>
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Invite Candidate
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                            <>No tests found matching "<strong>{searchQuery}</strong>"</>
                          ) : (
                            "You haven't created any tests yet."
                          )}
                        </p>
                        {!searchQuery && (
                          <Button asChild>
                            <Link href="/tests/create">
                              <Plus className="h-4 w-4 mr-1.5" />
                              Create Your First Test
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="active">
                {isLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-6">
                        <p>Loading tests...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredTests?.filter((test: any) => test.stats.inProgress > 0).length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test Name</TableHead>
                            <TableHead className="hidden md:table-cell">Duration</TableHead>
                            <TableHead className="hidden md:table-cell">Active Candidates</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTests
                            .filter((test: any) => test.stats.inProgress > 0)
                            .map((test: any) => (
                              <TableRow key={test.id}>
                                <TableCell className="font-medium">{test.title}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                    {formatDuration(test.duration)}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="warning">
                                    {test.stats.inProgress} in progress
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/tests/${test.id}`}>
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
                          No active tests found.
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
