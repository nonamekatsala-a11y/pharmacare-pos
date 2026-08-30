import { useState } from 'react'
import { useCartStore } from '@store/cartStore'
import { formatCurrency } from '@utils/formatters'

interface CartProps {
  onCheckout: (total: number, paymentMethod: string) => Promise<void>
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, clearCart } =
    useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Cash')

  const subtotal = getSubtotal()
  const total = getTotal()

  const paymentMethods = [
    { id: 'Cash', name: 'Cash', icon: '💵' },
    { id: 'Card', name: 'Card', icon: '�' },
    { id: 'Credit', name: 'Credit', icon: '📋' },
  ]

  const handleRemove = (medicineId: string) => {
    removeItem(medicineId)
  }

  const handleQuantityChange = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemove(medicineId)
    } else {
      updateQuantity(medicineId, quantity)
    }
  }

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      await onCheckout(total, selectedPaymentMethod)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Cart Header - Compact */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-700">Cart</h2>
        <p className="text-xs text-primary-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Cart Items - Table Form */}
      <div className="flex-1 overflow-y-auto mb-4 border border-primary-100 rounded-lg bg-white min-h-0">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-primary-600 text-sm">No items in cart</p>
              <p className="text-primary-400 text-xs mt-1">Add medicines to get started</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-primary-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700">Medicine</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-primary-700">Price</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-primary-700">Total</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {items.map((item) => (
                <tr key={item.medicineId} className="hover:bg-primary-50 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-primary-700 text-xs truncate">{item.medicineName}</p>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.medicineId, parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-16 px-2 py-1 border border-primary-200 rounded bg-white text-primary-700 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-primary-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-primary-700">{formatCurrency(item.total)}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleRemove(item.medicineId)}
                      aria-label={`Delete ${item.medicineName} from cart`}
                      className="rounded px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals Section - Compact */}
      <div className="space-y-1 border-t border-primary-200 pt-2 mb-2 flex-shrink-0">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-primary-600">Subtotal:</span>
          <span className="text-primary-700">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-primary-200 pt-1 text-[10px]">
          <span className="font-bold text-primary-700">Total:</span>
          <span className="text-sm font-bold text-primary-700">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-3 flex-shrink-0">
        <h3 className="text-xs font-semibold text-primary-700 mb-2">Select Payment Method</h3>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPaymentMethod(method.id)}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-colors ${
                selectedPaymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-primary-200 bg-white text-primary-600 hover:bg-primary-50'
              }`}
            >
              <span className="text-lg">{method.icon}</span>
              <span className="text-xs font-semibold">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 flex-shrink-0">
        <button
          onClick={handleCheckout}
          disabled={items.length === 0 || isProcessing}
          className="w-full bg-primary-500 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isProcessing ? 'COMPLETING SALE...' : 'COMPLETE SALE'}
        </button>
        <button
          onClick={() => clearCart()}
          disabled={items.length === 0 || isProcessing}
          className="w-full border border-primary-300 text-primary-700 font-semibold py-2 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Clear Cart
        </button>
      </div>
    </div>
  )
}
