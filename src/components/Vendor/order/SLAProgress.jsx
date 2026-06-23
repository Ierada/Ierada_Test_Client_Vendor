import React from "react";
import { Clock } from "lucide-react";

const SLAProgress = ({ createdAt, status }) => {
  const isOverdue = new Date() - new Date(createdAt) > 24 * 60 * 60 * 1000;
  const isCompleted = status === "delivered" || status === "completed";

  if (isCompleted) {
    return <div className="h-1.5 w-16 bg-green-500 rounded-full" />;
  }
  if (isOverdue) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-16 bg-gray-200 rounded-full relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-red-500 rounded-full animate-pulse" />
        </div>
        <Clock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      </div>
    );
  }
  return <div className="h-1.5 w-16 bg-green-500 rounded-full" />;
};

export default SLAProgress;
