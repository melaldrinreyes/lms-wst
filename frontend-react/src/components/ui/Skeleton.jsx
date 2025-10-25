export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={`animate-pulse bg-gray-300 dark:bg-gray-700 ${variants[variant]} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton variant="title" className="w-3/4" />
      <Skeleton className="w-full" />
      <Skeleton className="w-2/3" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="w-20 h-8" />
        <Skeleton className="w-20 h-8" />
      </div>
    </div>
  );
}
