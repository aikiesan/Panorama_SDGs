interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`} 
      aria-hidden="true"
    />
  );
}

export function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-3/4" /></td>
          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-2/3" /></td>
          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-1/2" /></td>
          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-1/4" /></td>
        </tr>
      ))}
    </>
  );
}
