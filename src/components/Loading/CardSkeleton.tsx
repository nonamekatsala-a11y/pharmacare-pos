interface CardSkeletonProps {
  count?: number
  className?: string
  showIcon?: boolean
}

export default function CardSkeleton({ 
  count = 4, 
  className = '',
  showIcon = true 
}: CardSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            {showIcon && (
              <div className="rounded-full bg-gray-100 p-3 ml-4">
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
