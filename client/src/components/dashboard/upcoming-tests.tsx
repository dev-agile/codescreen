import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getRelativeTime } from "@/lib/utils";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Candidate = {
  id: number;
  name: string;
  testId: number;
  testTitle: string;
  status: string;
  invitedAt: string;
};

export function UpcomingTests() {
  // This is a mock implementation since we don't have a specific API endpoint for upcoming tests
  // In a real app, you would fetch from a specific endpoint
  const { data: tests, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/tests"],
    select: (data) => {
      // From the tests data, extract candidates that are pending
      const pendingCandidates: Candidate[] = [];
      
      data.forEach(test => {
        if (test.candidates) {
          test.candidates
            .filter((c: any) => c.status === "pending")
            .forEach((c: any) => {
              pendingCandidates.push({
                id: c.id,
                name: c.name,
                testId: test.id,
                testTitle: test.title,
                status: c.status,
                invitedAt: c.invitedAt
              });
            });
        }
      });
      
      // Sort by invited date (most recent first) and take top 3
      return pendingCandidates
        .sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime())
        .slice(0, 3);
    }
  });

  const mockUpcoming = [
    {
      name: "Jamie Larson",
      testTitle: "Frontend React Assessment",
      timeframe: "Tomorrow"
    },
    {
      name: "David Kim",
      testTitle: "Node.js Backend Assessment",
      timeframe: "In 2 days"
    },
    {
      name: "Mira Patel",
      testTitle: "Data Structures & Algorithms",
      timeframe: "In 3 days"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Upcoming Tests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 px-4 pb-4">
          {/* If loading or error, display mock data for demo purposes */}
          {(isLoading || error || !tests || tests.length === 0) ? (
            mockUpcoming.map((candidate, i) => (
              <div key={i} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                <Avatar className="h-10 w-10 bg-primary-100 text-primary-600 rounded-full">
                  <AvatarFallback className="bg-primary-100 text-primary-600">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                  <p className="text-xs text-gray-500">{candidate.testTitle}</p>
                </div>
                <div className="ml-auto text-xs text-gray-500">
                  {candidate.timeframe}
                </div>
              </div>
            ))
          ) : (
            tests.map((candidate) => (
              <div key={candidate.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                <Avatar className="h-10 w-10 bg-primary-100 text-primary-600 rounded-full">
                  <AvatarFallback className="bg-primary-100 text-primary-600">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                  <p className="text-xs text-gray-500">{candidate.testTitle}</p>
                </div>
                <div className="ml-auto text-xs text-gray-500">
                  {getRelativeTime(candidate.invitedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UpcomingTests;
