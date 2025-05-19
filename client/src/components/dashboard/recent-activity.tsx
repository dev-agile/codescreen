import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Activity = {
  candidateId: number;
  candidateName: string;
  testId: number;
  testTitle: string;
  action: "completed" | "started";
  timestamp: string;
  score?: number;
  autoSubmitted?: boolean;
};

export function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40 mt-1" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20 mt-1" />
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
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            Error loading recent activity: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {activities && activities.length > 0 ? (
            activities.map((activity, index) => (
              <li key={`${activity.candidateId}-${index}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 rounded-full bg-gray-200">
                        <AvatarFallback>
                          <User className="h-6 w-6 text-gray-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary-600">
                          {activity.candidateName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.action === "completed" ? "Completed" : "Started"} "{activity.testTitle}"
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                      {activity.action === "completed" && (
                        <Badge
                          variant={activity.autoSubmitted ? "destructive" : "success"}
                          className="mt-1"
                        >
                          {activity.autoSubmitted ? "Auto-submitted" : `Score: ${activity.score}%`}
                        </Badge>
                      )}
                      {activity.action === "started" && (
                        <Badge variant="warning" className="mt-1">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
              No recent activity found
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
