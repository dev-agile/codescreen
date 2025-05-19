import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/utils";
import { Clock, Plus, HelpCircle } from "lucide-react";

type Test = {
  id: number;
  title: string;
  duration: number;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  questions: {
    length: number;
  };
};

export function TestsList() {
  const { data: tests, isLoading, error } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Your Tests</CardTitle>
          <Skeleton className="h-9 w-28" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="sm:flex">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24 ml-6 hidden sm:block" />
                  </div>
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Your Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            Error loading tests: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Your Tests</CardTitle>
        <Button asChild>
          <Link href="/tests/create">
            <Plus className="mr-1.5 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {tests && tests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {tests.map((test) => (
              <li key={test.id}>
                <Link href={`/tests/${test.id}`}>
                  <a className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-primary-600 truncate">
                          {test.title}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <Badge variant="success">Active</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="sm:flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {formatDuration(test.duration)}
                          </div>
                          <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center text-sm text-gray-500">
                            <HelpCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {test.questions?.length || 0} questions
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>
                            {test.stats.total} sent / {test.stats.completed} completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              You haven't created any tests yet.
            </p>
            <Button asChild>
              <Link href="/tests/create">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Your First Test
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TestsList;
