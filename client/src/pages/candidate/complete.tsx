import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Code2 } from "lucide-react";

export default function CandidateComplete() {
  const [location] = useLocation();
  
  // Redirect to home if accessed directly without submitting
  useEffect(() => {
    // Add logic here if needed to check if this page was properly accessed
  }, []);
  
  // Get the current date in a formatted style
  const completedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
            Test Submitted Successfully!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your answers have been recorded and will be reviewed by the recruiter.
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Completed</dt>
              <dd className="text-sm font-medium text-gray-900">{completedDate}</dd>
            </div>
          </dl>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              The recruiting team will review your submission and get back to you soon.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Powered by <span className="font-medium text-primary-600 flex items-center justify-center mt-2">
            <Code2 className="mr-1 h-4 w-4" />
            CodeScreen
          </span>
        </p>
      </div>
    </div>
  );
}
