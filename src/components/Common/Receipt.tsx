import { Sale } from '@services/saleService'
import { formatCurrency, formatDateTime } from '@utils/formatters'

interface ReceiptProps {
  sale: Sale
  storeName?: string
  storeAddress?: string
  storePhone?: string
  onPrint?: () => void
  onClose?: () => void
}

export default function Receipt({
  sale,
  storeName = 'MyNeen Medicine Store',
  storeAddress = '123 Pharmacy Street',
  storePhone = '+1 234 567 890',
  onPrint,
  onClose,
}: ReceiptProps) {
  const handlePrint = () => {
    window.print()
    onPrint?.()
  }

  return (
    <div className="bg-white p-6 max-w-md mx-auto shadow-lg">
      {/* Receipt Header */}
      <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
        <h2 className="text-xl font-bold text-gray-900">{storeName}</h2>
        <p className="text-sm text-gray-600 mt-1">{storeAddress}</p>
        <p className="text-sm text-gray-600">{storePhone}</p>
        <p className="text-xs text-gray-500 mt-2">{formatDateTime(sale.saleDate)}</p>
      </div>

      {/* Cashier Information */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500">Cashier: {sale.userId}</p>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="text-gray-700">
                <td className="py-1 text-xs truncate max-w-[100px]">{item.medicineId}</td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-1 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-dashed border-gray-300 pt-2 mt-2">
          <span>Total</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment Method</span>
          <span>{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
        <p className="text-xs text-gray-500">Thank you for your purchase!</p>
        <p className="text-xs text-gray-500 mt-1">Please come again</p>
        {sale.status === 'Refunded' && (
          <p className="text-xs text-red-600 font-semibold mt-2">*** REFUNDED ***</p>
        )}
      </div>

      {/* Print/Close Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePrint}
          className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Print
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}