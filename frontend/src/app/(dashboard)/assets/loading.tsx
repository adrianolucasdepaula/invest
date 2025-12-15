import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4 border-b pb-4">
            {Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              {Array(7).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-6 w-24" />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10" />
        ))}
      </div>
    </div>
  );
}
