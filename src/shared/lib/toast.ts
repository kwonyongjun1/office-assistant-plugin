import { toast } from "sonner";

export const appToast = {
  success(message: string) {
    toast.success(message, { duration: 2200 });
  },
  error(message: string, description?: string) {
    toast.error(message, { description, duration: 3200 });
  },
};
