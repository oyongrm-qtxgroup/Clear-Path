import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-5 border-2",
  md: "size-8 border-[3px]",
  lg: "size-12 border-4",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-primary/30 border-t-primary animate-spin rounded-full",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Full-page centered spinner (e.g. route-level loading states). */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
