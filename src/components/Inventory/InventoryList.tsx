import { InventoryItem } from '@services/medicineService'
import { formatCurrency, daysUntilExpiry, isExpired } from '@utils/formatters'

interface InventoryListProps {
  inventory: InventoryItem[]
  onDelete?: (medicineId: string) => void
}

export default function InventoryList({ inventory, onDelete }: InventoryListProps) {
  return (
    <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Medicine</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Selling Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Profit</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
            {onDelete && (
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {inventory.length === 0 ? (
            <tr>
              <td colSpan={onDelete ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                No inventory items found
              </td>
            </tr>
          ) : (
            inventory.map((item) => {
              const daysLeft = item.expiryDate ? daysUntilExpiry(item.expiryDate) : null
              const expired = item.expiryDate ? isExpired(item.expiryDate) : false

              return (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.medicine?.medicineName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                          item.quantityOnHand <= 5
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.quantityOnHand}
                      </span>
                      {item.medicine?.pendingAllocation && (
                        <span className="inline-block rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                          +{item.medicine.pendingAllocation} pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatCurrency(item.unitCost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.medicine?.sellingPrice ? formatCurrency(item.medicine.sellingPrice) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.medicine?.sellingPrice
                      ? formatCurrency((item.medicine.sellingPrice - item.unitCost) * item.quantityOnHand)
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.expiryDate ? (
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                          expired
                            ? 'bg-red-100 text-red-800'
                            : daysLeft !== null && daysLeft < 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {expired
                          ? 'EXPIRED'
                          : daysLeft !== null
                            ? `${daysLeft} days`
                            : 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {onDelete && (
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => onDelete(item.medicineId)}
                        className="rounded bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
