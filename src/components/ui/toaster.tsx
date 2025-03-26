"use client";

import { useToast } from "@/components/ui/use-toast";
import { Toast, ToastProvider } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, content, action, ...props }) => {
        return (
          <Toast key={id} id={id} title={title} content={content} {...props}>
            <div className="grid gap-1">
              {title && <div className="font-medium">{title}</div>}
              {content && <div className="text-sm opacity-90">{content}</div>}
            </div>
            {action}
          </Toast>
        );
      })}
    </ToastProvider>
  );
} 