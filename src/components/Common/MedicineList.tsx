import { Medicine } from '@services/medicineService'
import { formatCurrency } from '@utils/formatters'
import Button from './Button'

interface MedicineListProps {
  medicines: Medicine[]
}

export default function MedicineList({ medicines }: MedicineListProps) {
  return (
    <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Barcode</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {medicines.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                No medicines found
              </td>
            </tr>
          ) : (
            medicines.map((medicine) => (
              <tr key={medicine.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{medicine.barcode}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{medicine.medicineName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{medicine.category || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                      medicine.quantity <= medicine.reorderLevel
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {medicine.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {formatCurrency(medicine.sellingPrice)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      medicine.status === 'Available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {medicine.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                  <Button size="sm" variant="danger">
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
