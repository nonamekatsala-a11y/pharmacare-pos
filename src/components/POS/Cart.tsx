import { useState } from 'react'
import { useCartStore } from '@store/cartStore'
import { formatCurrency } from '@utils/formatters'

interface CartProps {
  onCheckout: (amountReceived: number) => void
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, clearCart } =
    useCartStore()
  const [amountReceived, setAmountReceived] = useState<number>(0)

  const subtotal = getSubtotal()
  const total = getTotal()
  const change = total > 0 ? Math.max(0, amountReceived - total) : 0

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

  return (
    <div className="flex flex-col min-h-full">
      {/* Cart Header - Compact */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-primary-700">Cart</h2>
        <p className="text-xs text-primary-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Cart Items - Large Section */}
      <div className="flex-1 overflow-y-auto mb-3 border border-primary-100 rounded-lg bg-gray-50 min-h-0">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <p className="text-primary-600 text-sm">No items in cart</p>
              <p className="text-primary-400 text-xs mt-1">Add medicines to get started</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-primary-100">
            {items.map((item) => (
              <div key={item.medicineId} className="p-1.5 hover:bg-primary-50 transition-colors">
                {/* Item Name */}
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1">
                    <p className="font-semibold text-primary-700 text-[8px] truncate">
                      {item.medicineName}
                    </p>
                    <p className="text-[7px] text-primary-600 mt-0">
                      <span className="font-mono">{item.barcode}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.medicineId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 w-3.5 h-3.5 flex items-center justify-center rounded text-[8px] font-bold transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                {/* Item Details Grid - Compact */}
                <div className="grid grid-cols-3 gap-0.5 text-[7px]">
                  <div>
                    <p className="text-primary-500 font-semibold text-[7px]">Qty</p>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.medicineId, parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full mt-0 px-0.5 py-0 border border-primary-200 rounded bg-white text-primary-700 text-[7px] focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <p className="text-primary-500 font-semibold text-[7px]">Price</p>
                    <p className="mt-0 text-[7px] text-primary-700">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 font-semibold text-[7px]">Total</p>
                    <p className="mt-0 font-bold text-primary-700 text-[7px]">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Payment Section - Compact */}
      <div className="space-y-1 border-t border-primary-200 pt-2 mb-2 flex-shrink-0">
        <div>
          <label className="block text-[9px] font-semibold text-primary-700 mb-0.5">
            Amount Received
          </label>
          <input
            type="number"
            value={amountReceived || ''}
            onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
            placeholder="Enter amount"
            className="w-full px-2 py-1 border border-primary-200 rounded bg-primary-50 text-primary-900 text-right text-[10px] focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
          />
        </div>
        <div>
          <p className="text-[9px] text-primary-600 font-semibold mb-0">Change</p>
          <p className="text-sm font-bold text-primary-700">{formatCurrency(change)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 flex-shrink-0">
        <button
          onClick={() => onCheckout(amountReceived)}
          disabled={items.length === 0 || amountReceived < total}
          className="w-full bg-primary-500 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Complete Sale
        </button>
        <button
          onClick={() => clearCart()}
          disabled={items.length === 0}
          className="w-full border border-primary-300 text-primary-700 font-semibold py-2 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Clear Cart
        </button>
      </div>
    </div>
  )
}
