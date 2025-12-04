export default function Skeleton({ className = '', variant = 'text', animated = true }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 rounded-xl',
    card: 'h-48 rounded-xl',
  };

  // Use neutral background that shows in both light and dark modes
  const baseBg = 'bg-gray-200 dark:bg-gray-700';
  const pulse = animated ? 'animate-pulse' : '';

  return (
    <div
      role="status"
      aria-busy={animated}
      className={`${pulse} ${baseBg} ${variants[variant] || ''} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-800 p-6 space-y-4">
      <Skeleton variant="card" className="w-full" />
      <Skeleton variant="title" className="w-3/4" />
      <Skeleton className="w-full" />
      <Skeleton className="w-2/3" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="button" className="w-20" />
        <Skeleton variant="button" className="w-20" />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-800 p-4 flex items-center gap-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" className="w-1/2" />
            <Skeleton className="w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl p-4">
          <Skeleton className="w-full" />
        </div>
      ))}
    </div>
  );
}
