interface SkeletonScreenProps {
  type?: 'table' | 'list' | 'cards'
  rows?: number
  columns?: number
  className?: string
}

export default function SkeletonScreen({ 
  type = 'table', 
  rows = 5, 
  columns = 4,
  className = ''
}: SkeletonScreenProps) {
  const renderTableSkeleton = () => (
    <div className={`space-y-2 ${className}`}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b bg-gray-50">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
        ))}
      </div>
      {/* Row skeletons */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center p-4 border-b gap-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )

  const renderListSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse border rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderCardsSkeleton = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )

  switch (type) {
    case 'table':
      return renderTableSkeleton()
    case 'list':
      return renderListSkeleton()
    case 'cards':
      return renderCardsSkeleton()
    default:
      return renderTableSkeleton()
  }
}
