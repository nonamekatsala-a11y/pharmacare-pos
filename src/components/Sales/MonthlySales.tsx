import { MonthlySale } from '@services/saleService'

interface MonthlySalesProps {
  monthlySales: MonthlySale[]
}

export default function MonthlySales({ monthlySales }: MonthlySalesProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Monthly Sales</h3>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">Aggregate revenue by month for the selected range.</p>

      <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-3 sm:p-4 min-h-[140px] sm:min-h-[180px]">
        {monthlySales.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No monthly sales data available</p>
        ) : (
          <div className="space-y-2">
            {monthlySales.map((sale) => (
              <div key={sale.month} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-gray-900">{sale.monthLabel}</span>
                <span className="font-semibold text-primary-600">{sale.revenueLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}