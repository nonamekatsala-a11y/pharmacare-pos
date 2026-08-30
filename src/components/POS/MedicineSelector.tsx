import { useState, useMemo } from 'react'
import { Medicine } from '@services/medicineService'
import { useCartStore, CartItem } from '@store/cartStore'
import { isExpired } from '@utils/formatters'

interface MedicineSelectorProps {
  medicines: Medicine[]
  isLoading: boolean
}

export default function MedicineSelector({ medicines, isLoading }: MedicineSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { addItem } = useCartStore()

  const filteredMedicines = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    const sellableMedicines = medicines.filter((medicine) => (
      medicine.expiryDate ? !isExpired(medicine.expiryDate) : true
    ))
    if (!normalizedSearchTerm) return sellableMedicines

    return sellableMedicines.filter((medicine) => {
      const searchableFields = [
        medicine.medicineName,
        medicine.barcode,
        medicine.genericName,
        medicine.category,
      ]

      return searchableFields.some((field) => (
        field?.toLowerCase().includes(normalizedSearchTerm)
      ))
    })
  }, [medicines, searchTerm])



  const handleAddToCart = (medicine: Medicine, qty: number = 1) => {
    const cartItem: CartItem = {
      medicineId: medicine.id,
      medicineName: medicine.medicineName,
      barcode: medicine.barcode,
      quantity: qty,
      unitPrice: medicine.sellingPrice,
      taxRate: 0,
      total: qty * medicine.sellingPrice,
      maxStock: medicine.quantity,
    }

    addItem(cartItem)
  }

  const canAddToCart = (medicine: Medicine) => medicine.quantity > 0

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-base font-bold text-primary-700">Sell Medicine</h2>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-primary-600 text-sm">Loading medicines...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Medicine Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicine by name..."
                className="w-full px-3 py-2 border border-blue-500 rounded-lg bg-primary-50 text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm"
              />
            </div>
          </div>

          {/* Medicines List */}
          <div className="flex-1 overflow-y-auto">
            {searchTerm && filteredMedicines.length === 0 ? (
              <div className="text-center text-primary-600 text-sm py-4">
                {medicines.length === 0 ? 'No stock is available for this pharmacy' : 'No non-expired medicine found'}
              </div>
            ) : searchTerm && (
              <div className="space-y-2">
                {filteredMedicines.slice(0, 12).map((medicine) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between bg-white border border-primary-100 rounded-lg p-2 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary-700 text-xs">{medicine.medicineName}</p>
                      <p className="text-[10px] text-primary-600 mt-0.5">
                        Stock: {medicine.quantity} • Price: {medicine.sellingPrice}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(medicine)}
                      disabled={!canAddToCart(medicine)}
                      className="ml-2 bg-primary-500 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}