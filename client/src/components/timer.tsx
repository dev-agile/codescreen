import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTimeRemaining } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimerProps {
  endTime: Date;
  onTimeUp?: () => void;
  className?: string;
}

export function Timer({ endTime, onTimeUp, className }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(endTime));
  const [isAlmostUp, setIsAlmostUp] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeLeft = endTime.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        setTimeRemaining("00:00");
        if (onTimeUp) {
          onTimeUp();
        }
      } else {
        setTimeRemaining(formatTimeRemaining(endTime));
        
        // Set warning style when less than 5 minutes remaining
        setIsAlmostUp(timeLeft < 300000);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime, onTimeUp]);
  
  return (
    <div 
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium",
        isAlmostUp 
          ? "bg-red-50 text-red-700 animate-pulse" 
          : "bg-primary-50 text-primary-700",
        className
      )}
    >
      <Clock className="mr-1.5 h-4 w-4" />
      Time Remaining: {timeRemaining}
    </div>
  );
}

export default Timer;
