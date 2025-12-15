import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DataManagementLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 flex-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      </Card>

      {/* Sync Status Table */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Table Header */}
          <div className="flex gap-4 border-b pb-4">
            {Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {/* Table Rows */}
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              {Array(7).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-6 w-24" />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Audit Trail */}
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
