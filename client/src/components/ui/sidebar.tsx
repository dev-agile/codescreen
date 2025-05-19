import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  CheckSquare,
  Code2,
  FileQuestion,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const mainNavItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: "Tests",
    href: "/tests",
    icon: <FileQuestion className="h-5 w-5" />
  },
  {
    title: "Candidates",
    href: "/candidates",
    icon: <Users className="h-5 w-5" />
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <BarChart className="h-5 w-5" />
  }
];

const accountNavItems: SidebarItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />
  },
  {
    title: "Help",
    href: "/help",
    icon: <HelpCircle className="h-5 w-5" />
  }
];

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
        <h1 className="text-xl font-bold text-primary-600 flex items-center">
          <Code2 className="mr-2 h-6 w-6" />
          CodeScreen
        </h1>
      </div>
      
      <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="px-4 mb-6">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</span>
          <div className="mt-2 space-y-1">
            {mainNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
              >
                <a 
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href 
                      ? "text-primary-600 bg-primary-50" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span 
                    className={cn(
                      "mr-3",
                      location === item.href ? "text-primary-500" : "text-gray-500"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.title}
                </a>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="px-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Account</span>
          <div className="mt-2 space-y-1">
            {accountNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
              >
                <a 
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href 
                      ? "text-primary-600 bg-primary-50" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span 
                    className={cn(
                      "mr-3",
                      location === item.href ? "text-primary-500" : "text-gray-500"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.title}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
            <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.company || user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full flex items-center justify-center"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
