import { cn } from "../../utils/format/cn";

type SkeletonLoaderProps = {
  className?: string;
  lines?: number;
};

export function SkeletonLoader({ className, lines = 3 }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function QuestCardSkeleton() {
  return (
    <div className="quest-card animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded mb-1" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  );
}