import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <div className="text-right">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-24 mt-2" />
        </div>
      </div>

      {/* Price Chart */}
      <Card className="p-6">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-12" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </Card>

      {/* Indicators Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>

      {/* Analysis Section */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
