// components/ui/use-toast.ts
import { useState } from "react";

export const useToast = () => {
  const [toast, setToast] = useState<{ title: string; description: string; duration?: number; variant?: string } | null>(null);

  return {
    toast: (message: { title: string; description: string; duration?: number; variant?: string }) => {
      setToast(message);
      setTimeout(() => setToast(null), message.duration || 3000);
    },
    activeToast: toast,
  };
};
