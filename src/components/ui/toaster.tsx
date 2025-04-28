"use client";

import { useToast } from "@/components/ui/toast-store";
import { Toast, ToastProvider } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, ...props }) => {
        return (
          <Toast key={id} id={id} title={title} content={description} {...props}>
            <div className="grid gap-1">
              {title && <div className="font-medium">{title}</div>}
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
          </Toast>
        );
      })}
    </ToastProvider>
  );
} 