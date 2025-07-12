import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent",
        className
      )}
      {...props}
    />
  )
} 