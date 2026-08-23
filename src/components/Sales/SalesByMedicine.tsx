import { MedicineSale } from '@services/saleService'
import Button from '@components/Common/Button'

interface SalesByMedicineProps {
  salesByMedicine: MedicineSale[]
  onEdit?: (saleId: string) => void
}

export default function SalesByMedicine({ salesByMedicine, onEdit }: SalesByMedicineProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sales by Medicine</h3>
      <p className="text-xs sm:text-sm text-gray-600 mt-1">See revenue per product.</p>
      
      <div className="mt-4 overflow-x-auto">
        {salesByMedicine.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No medicine sales data available</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Invoice</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Medicine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {salesByMedicine.map((sale) => (
                <tr key={`${sale.saleId}-${sale.medicineId}`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{sale.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sale.dateLabel}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sale.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sale.quantity}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{sale.revenueLabel}</td>
                  <td className="px-4 py-3 text-sm">
                    {onEdit && (
                      <Button size="sm" variant="secondary" onClick={() => onEdit(sale.saleId)}>
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