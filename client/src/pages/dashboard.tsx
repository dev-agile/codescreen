import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import StatsCard from "@/components/dashboard/stats-card";
import RecentActivity from "@/components/dashboard/recent-activity";
import TestsList from "@/components/dashboard/tests-list";
import PerformanceChart from "@/components/dashboard/performance-chart";
import UpcomingTests from "@/components/dashboard/upcoming-tests";
import { Bell, BarChart, FileQuestion, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Dashboard() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });
  
  // Mock performance data
  const performanceData = [
    { name: "Frontend React Assessment", score: 76 },
    { name: "Node.js Backend Assessment", score: 62 },
    { name: "Data Structures & Algorithms", score: 54 },
  ];
  
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
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4 mr-1.5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">3</Badge>
            </Button>
            <Button asChild>
              <Link href="/tests/create">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Test
              </Link>
            </Button>
          </div>
        </header>
        
        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatsCard
                title="Active Tests"
                value={stats?.activeTests || 0}
                change={{ value: 2, direction: "up" }}
                icon={<FileQuestion className="h-6 w-6" />}
                iconBgColor="bg-primary-100"
                iconTextColor="text-primary-600"
              />
              
              <StatsCard
                title="Pending Assessments"
                value={stats?.pendingAssessments || 0}
                change={{ value: 3, direction: "down" }}
                icon={<Users className="h-6 w-6" />}
                iconBgColor="bg-orange-100"
                iconTextColor="text-orange-600"
              />
              
              <StatsCard
                title="Completed Tests"
                value={stats?.completedTests || 0}
                change={{ value: 7, direction: "up" }}
                icon={<BarChart className="h-6 w-6" />}
                iconBgColor="bg-green-100"
                iconTextColor="text-green-600"
              />
            </div>
            
            {/* Recent activity */}
            <div className="mb-6">
              <RecentActivity />
            </div>
            
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tests */}
              <div className="lg:col-span-2">
                <TestsList />
              </div>
              
              {/* Performance & Upcoming */}
              <div className="space-y-6">
                <PerformanceChart scores={performanceData} />
                <UpcomingTests />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
