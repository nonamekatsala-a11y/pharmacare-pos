import { useState } from 'react'
import { useCartStore } from '@store/cartStore'
import type { PaymentDetail, PaymentMethod } from '@services/saleService'
import { formatCurrency } from '@utils/formatters'

interface CartProps {
  onCheckout: (total: number, paymentDetails: PaymentDetail[]) => Promise<void>
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, clearCart } =
    useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentRows, setPaymentRows] = useState<{ method: PaymentMethod; amount: string }[]>([
    { method: 'Cash', amount: '' },
  ])

  const subtotal = getSubtotal()
  const total = getTotal()
  const totalCents = Math.round(total * 100)

  const paymentMethods = [
    { id: 'Cash', name: 'Cash', icon: '💵' },
    { id: 'Mpamba', name: 'Mpamba', icon: '📱' },
    { id: 'Airtel Money', name: 'Airtel Money', icon: '📱' },
    { id: 'Bank Transfer', name: 'Bank Transfer', icon: '🏦' },
  ] as const

  const manualAmounts = paymentRows.map((row) => {
    if (!row.amount.trim()) return null
    const amount = Number(row.amount)
    return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN
  })
  const manuallyEnteredCents = manualAmounts.reduce<number>(
    (sum, amount) => sum + (amount === null || Number.isNaN(amount) ? 0 : amount),
    0,
  )
  const firstUnspecifiedIndex = manualAmounts.findIndex((amount) => amount === null)
  const paymentAmountsCents = manualAmounts.map((amount, index) => (
    amount === null
      ? index === firstUnspecifiedIndex ? totalCents - manuallyEnteredCents : 0
      : amount
  ))
  const enteredAmountsAreValid = paymentRows.every((row, index) => {
    if (!row.amount.trim()) return true
    const amount = Number(row.amount)
    return Number.isFinite(amount)
      && amount > 0
      && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001
      && paymentAmountsCents[index] > 0
  })
  const paymentTotalCents = paymentAmountsCents.reduce((sum, amount) => sum + amount, 0)
  const paymentDetails: PaymentDetail[] = paymentRows.flatMap((row, index) => (
    Number.isFinite(paymentAmountsCents[index]) && paymentAmountsCents[index] > 0
      ? [{ method: row.method, amount: paymentAmountsCents[index] / 100 }]
      : []
  ))
  const paymentsAreValid = enteredAmountsAreValid
    && paymentAmountsCents.every((amount) => amount >= 0)
    && paymentTotalCents === totalCents
    && paymentDetails.length > 0

  const handleRemove = (medicineId: string) => {
    removeItem(medicineId)
  }

  const handleIncrement = (medicineId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity < maxStock) {
      updateQuantity(medicineId, currentQuantity + 1)
    }
  }

  const handleDecrement = (medicineId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(medicineId, currentQuantity - 1)
    } else {
      handleRemove(medicineId)
    }
  }

  const handleCheckout = async () => {
    if (!paymentsAreValid) return

    setIsProcessing(true)
    try {
      await onCheckout(total, paymentDetails)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Cart Header - Compact */}
      <div className="mb-2 flex-shrink-0 flex items-center justify-between">
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
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDecrement(item.medicineId, item.quantity)}
                        className="w-6 h-6 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-primary-700">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrement(item.medicineId, item.quantity, item.maxStock)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-6 h-6 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
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
        <h3 className="text-xs font-semibold text-primary-700 mb-2">Payment Methods and Amounts</h3>
        <div className="space-y-2">
          {paymentRows.map((row, index) => {
            const availableMethods = paymentMethods.filter((method) => (
              method.id === row.method || !paymentRows.some((payment) => payment.method === method.id)
            ))

            return (
              <div key={index} className="flex items-center gap-2">
                <select
                  aria-label={`Payment method ${index + 1}`}
                  value={row.method}
                  onChange={(event) => {
                    const method = event.target.value as PaymentMethod
                    setPaymentRows((rows) => rows.map((payment, rowIndex) => (
                      rowIndex === index ? { ...payment, method } : payment
                    )))
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-primary-200 bg-white px-2 py-2 text-xs text-primary-700"
                >
                  {availableMethods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-primary-600">
                  <span className="sr-only">Amount for {row.method}</span>
                  <span>K</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.amount || (
                      index === firstUnspecifiedIndex && Number.isFinite(paymentAmountsCents[index])
                        ? (paymentAmountsCents[index] / 100).toFixed(2)
                        : ''
                    )}
                    onChange={(event) => {
                      const amount = event.target.value
                      setPaymentRows((rows) => rows.map((payment, rowIndex) => (
                        rowIndex === index ? { ...payment, amount } : payment
                      )))
                    }}
                    className="w-24 rounded-lg border border-primary-200 px-2 py-2 text-right text-xs text-primary-700"
                  />
                </label>
                {paymentRows.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove ${row.method} payment`}
                    onClick={() => setPaymentRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
                    className="rounded px-2 py-1 text-sm font-bold text-red-500 hover:bg-red-50"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-primary-600">
            Payment total: {Number.isFinite(paymentTotalCents)
              ? `${formatCurrency(paymentTotalCents / 100)} / ${formatCurrency(total)}`
              : `Invalid amount / ${formatCurrency(total)}`}
          </span>
          {paymentRows.length < paymentMethods.length && (
            <button
              type="button"
              onClick={() => {
                const nextMethod = paymentMethods.find((method) => (
                  !paymentRows.some((payment) => payment.method === method.id)
                ))
                if (nextMethod) {
                  setPaymentRows((rows) => [...rows, { method: nextMethod.id, amount: '' }])
                }
              }}
              className="font-semibold text-primary-600 hover:text-primary-800"
            >
              + Add payment
            </button>
          )}
        </div>
        {items.length > 0 && !paymentsAreValid && (
          <p className="mt-1 text-xs text-red-600">
            Enter valid positive amounts that add up exactly to the sale total.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 flex-shrink-0">
        <button
          onClick={handleCheckout}
          disabled={items.length === 0 || isProcessing || !paymentsAreValid}
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
