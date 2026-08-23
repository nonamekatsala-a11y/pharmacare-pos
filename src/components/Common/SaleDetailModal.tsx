import { useState } from 'react'
import { Sale, SaleItem } from '@services/saleService'
import { formatCurrency, formatDateTime } from '@utils/formatters'
import Modal from './Modal'
import Button from './Button'

interface SaleDetailModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onPrintReceipt?: (sale: Sale) => void
  onRefund?: (sale: Sale) => void
  onSave?: (updatedSale: Sale) => void | Promise<void>
  isAdmin?: boolean
}

export default function SaleDetailModal({
  sale,
  isOpen,
  onClose,
  onPrintReceipt,
  onRefund,
  onSave,
  isAdmin = false,
}: SaleDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedItems, setEditedItems] = useState<SaleItem[]>([])
  const [editedPaymentMethod, setEditedPaymentMethod] = useState<Sale['paymentMethod']>('Cash')
  const [editedStatus, setEditedStatus] = useState<Sale['status']>('Completed')

  // Initialize edited values when sale changes or edit mode is entered
  if (sale && !isEditMode) {
    if (editedItems.length === 0 || editedItems[0]?.saleId !== sale.id) {
      setEditedItems(sale.items)
      setEditedPaymentMethod(sale.paymentMethod)
      setEditedStatus(sale.status)
    }
  }

  const handleEnterEditMode = () => {
    if (!sale) return

    setIsEditMode(true)
    setEditedItems(sale.items)
    setEditedPaymentMethod(sale.paymentMethod)
    setEditedStatus(sale.status)
  }

  const handleCancelEdit = () => {
    if (!sale) return

    setIsEditMode(false)
    setEditedItems(sale.items)
    setEditedPaymentMethod(sale.paymentMethod)
    setEditedStatus(sale.status)
  }

  const handleItemChange = (itemId: string, field: keyof SaleItem, value: number) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSave = async () => {
    if (!sale) return

    // Recalculate totals
    const subtotal = editedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const updatedSale: Sale = {
      ...sale,
      items: editedItems,
      paymentMethod: editedPaymentMethod,
      status: editedStatus,
      subtotal,
      total: subtotal + sale.tax - sale.discount,
    }

    if (onSave) {
      await onSave(updatedSale)
    }
    setIsEditMode(false)
  }

  if (!sale) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Sale Details - ${sale.invoiceNumber}`}>
      <div className="space-y-6">
        {/* Sale Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Invoice Number</p>
            <p className="font-semibold text-gray-900">{sale.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sale Date</p>
            <p className="font-semibold text-gray-900">{formatDateTime(sale.saleDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            {isEditMode ? (
              <select
                value={editedPaymentMethod}
                onChange={(e) => setEditedPaymentMethod(e.target.value as Sale['paymentMethod'])}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Credit">Credit</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-900">{sale.paymentMethod}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            {isEditMode ? (
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value as Sale['status'])}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
              </select>
            ) : (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  sale.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {sale.status}
              </span>
            )}
          </div>
        </div>

        {/* Customer Information */}
        {sale.customerId && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Customer Information</p>
            <p className="text-sm text-gray-600">Customer ID: {sale.customerId}</p>
          </div>
        )}

        {/* Line Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Items</h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Item</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Qty</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {(isEditMode ? editedItems : sale.items).map((item) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.medicineId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {isEditMode ? (
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {isEditMode ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(isEditMode ? editedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) : sale.subtotal)}
            </span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discount</span>
              <span className="text-sm font-semibold text-green-600">
                -{formatCurrency(sale.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(sale.tax)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-bold text-primary-600">
              {formatCurrency(isEditMode ? editedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) + sale.tax - sale.discount : sale.total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {isAdmin && !isEditMode && (
            <Button variant="primary" onClick={handleEnterEditMode}>
              Edit Transaction
            </Button>
          )}
          {isEditMode && (
            <>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </>
          )}
          {!isEditMode && onPrintReceipt && (
            <Button variant="secondary" onClick={() => onPrintReceipt(sale)}>
              Print Receipt
            </Button>
          )}
          {!isEditMode && onRefund && sale.status === 'Completed' && (
            <Button variant="danger" onClick={() => onRefund(sale)}>
              Process Refund
            </Button>
          )}
          {!isEditMode && (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}