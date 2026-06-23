import { useCallback } from 'react';

export const useFormatDate = () => {
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  return formatDate;
};
