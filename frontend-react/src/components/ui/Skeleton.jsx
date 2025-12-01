export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 rounded-lg',
    card: 'h-48 rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-gray-700/50 ${variants[variant]} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
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
        <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
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
        <div key={i} className="bg-gray-900/50 rounded-lg p-4">
          <Skeleton className="w-full" />
        </div>
      ))}
    </div>
  );
}
