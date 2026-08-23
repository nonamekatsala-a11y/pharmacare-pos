import { DailySale } from '@services/saleService'

interface DailySalesProps {
  dailySales: DailySale[]
}

export default function DailySales({ dailySales }: DailySalesProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Sales</h3>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">Compare daily revenue of the selected range.</p>

      <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-3 sm:p-4 min-h-[140px] sm:min-h-[180px]">
        {dailySales.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No daily sales data available</p>
        ) : (
          <div className="space-y-2">
            {dailySales.map((sale) => (
              <div key={sale.date} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-gray-900">{sale.dateLabel}</span>
                <span className="font-semibold text-primary-600">{sale.revenueLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}