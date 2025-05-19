import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number;
  change?: {
    value: number;
    direction: "up" | "down";
  };
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
};

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconTextColor,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <div 
          className={cn(
            "flex-shrink-0 h-12 w-12 rounded-md flex items-center justify-center",
            iconBgColor,
            iconTextColor
          )}
        >
          {icon}
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {change && (
        <div className="mt-3 text-sm">
          <span 
            className={cn(
              "font-medium",
              change.direction === "up" ? "text-green-500" : "text-red-500"
            )}
          >
            {change.direction === "up" ? "+" : "-"}{Math.abs(change.value)}
          </span>
          <span className="text-gray-500"> from last week</span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;
