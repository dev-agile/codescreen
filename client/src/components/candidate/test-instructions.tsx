import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, FileText, AlertTriangle, Timer } from "lucide-react";

interface TestData {
  testTitle: string;
  testDescription?: string;
  startedAt: string;
  duration: number;
  questions: Array<{
    id: number;
    type: string;
    content: string;
    options?: string[];
  }>;
  candidateId: number;
}

interface TestInstructionsProps {
  testData: TestData;
  onStart: () => void;
}

export default function TestInstructionsScreen({ testData, onStart }: TestInstructionsProps) {
  const [countdown, setCountdown] = useState(10);
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCountdownComplete(true);
    }
  }, [countdown]);

  // Handle fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && localStorage.getItem("testStarted") === "true") {
        setFullscreenError("Fullscreen mode is required. Please return to fullscreen to continue the test.");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleStartTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      localStorage.setItem("testStarted", "true");
      onStart();
    } catch (err) {
      setFullscreenError("Fullscreen mode is required to take this test. Please allow fullscreen access.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Instructions</h1>
        
        {/* Countdown Timer */}
        {!isCountdownComplete && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-center text-blue-600">
              <Timer className="h-5 w-5 mr-2" />
              <span className="text-lg font-medium">
                Test will be available to start in {countdown}s
              </span>
            </div>
          </div>
        )}
        
        {/* Test Metadata */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2" />
            <span>Duration: {testData.duration} minutes</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FileText className="h-5 w-5 mr-2" />
            <span>Total Questions: {testData.questions.length}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FileText className="h-5 w-5 mr-2" />
            <span>Question Types: Multiple Choice + Short Answer</span>
          </div>
        </div>

        {/* Test Rules */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Important Rules</h2>
          <div className="space-y-3">
            <div className="flex items-start text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Tab switching more than 3 times will auto-submit the test</span>
            </div>
            <div className="flex items-start text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Your activity (navigation, fullscreen, copy-paste) is tracked</span>
            </div>
            <div className="flex items-start text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Do not copy-paste or open developer tools</span>
            </div>
            <div className="flex items-start text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Once TEST started, you cannot pause the test</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Error */}
        {fullscreenError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{fullscreenError}</span>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleStartTest}
            disabled={!isCountdownComplete}
            className={`px-8 py-2 ${
              isCountdownComplete 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isCountdownComplete ? "Start Test" : "Please Wait..."}
          </Button>
        </div>
      </div>
    </div>
  );
} 