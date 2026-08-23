import { Sale } from '@services/saleService'
import { formatCurrency, formatDateTime } from '@utils/formatters'
import Button from '@components/Common/Button'

interface RecentSalesProps {
  recentSales: Sale[]
  onEdit?: (saleId: string) => void
}

export default function RecentSales({ recentSales, onEdit }: RecentSalesProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Sales</h3>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">Edit completed sales records for correction.</p>
      
      <div className="mt-4 overflow-x-auto">
        {recentSales.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No recent sales data available</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Invoice</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{sale.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(sale.saleDate)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sale.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        sale.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {onEdit && (
                      <Button size="sm" variant="secondary" onClick={() => onEdit(sale.id)}>
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}