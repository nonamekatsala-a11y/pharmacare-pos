import { useState, useMemo } from 'react'
import { Medicine } from '@services/medicineService'
import { useCartStore, CartItem } from '@store/cartStore'
import QuantityControl from './QuantityControl'
import { formatCurrency, isExpired } from '@utils/formatters'

interface MedicineSelectorProps {
  medicines: Medicine[]
  isLoading: boolean
}

export default function MedicineSelector({ medicines, isLoading }: MedicineSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [quantity, setQuantity] = useState(1)
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

  const handleSelectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setQuantity(1)
    setSearchTerm('')
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredMedicines.length > 0) {
      event.preventDefault()
      handleSelectMedicine(filteredMedicines[0])
    }
  }

  const handleAddToCart = () => {
    if (!selectedMedicine) return

    const cartItem: CartItem = {
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.medicineName,
      barcode: selectedMedicine.barcode,
      quantity,
      unitPrice: selectedMedicine.sellingPrice,
      taxRate: 0,
      total: quantity * selectedMedicine.sellingPrice,
      maxStock: selectedMedicine.quantity,
    }

    addItem(cartItem)
    setSelectedMedicine(null)
    setQuantity(1)
  }

  const canAddToCart = selectedMedicine && quantity > 0 && quantity <= selectedMedicine.quantity

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-base font-bold text-primary-700">Sell Medicine</h2>
        <p className="text-[10px] text-primary-600 mt-0">Add items to the cart and complete the sale.</p>
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
          <div className="mb-2">
            <label className="block text-[10px] font-semibold text-primary-700 mb-0.5">
              Search Medicine
            </label>
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by name, barcode, or generic name..."
                className="w-full px-2 py-1 border border-primary-200 rounded-lg bg-primary-50 text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors text-xs"
              />
            </div>

            {/* Dropdown Results */}
            {searchTerm && (
              <div className="mt-1 bg-white border border-primary-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredMedicines.length === 0 ? (
                  <div className="p-2 text-center text-primary-600 text-[10px]">
                    {medicines.length === 0 ? 'No stock is available for this pharmacy' : 'No non-expired medicine found'}
                  </div>
                ) : (
                  <div className="divide-y divide-primary-100">
                    {filteredMedicines.slice(0, 10).map((medicine) => (
                      <button
                        key={medicine.id}
                        onClick={() => handleSelectMedicine(medicine)}
                        className="w-full px-2 py-1.5 text-left hover:bg-primary-50 transition-colors"
                      >
                        <div className="font-semibold text-primary-700 text-[10px]">{medicine.medicineName}</div>
                        <div className="text-[9px] text-primary-600 mt-0">
                          {medicine.genericName && <span>{medicine.genericName} • </span>}
                          <span>Stock: {medicine.quantity}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Medicine Details */}
          {selectedMedicine ? (
            <div className="flex-1 flex flex-col space-y-1.5">
              {/* Medicine Info Card */}
              <div className="bg-primary-50 rounded-lg p-2 border border-primary-200">
                <h3 className="font-bold text-primary-700 text-xs mb-1">{selectedMedicine.medicineName}</h3>

                {/* Details Grid */}
                <div className="space-y-1.5">
                  {selectedMedicine.genericName && (
                    <div>
                      <p className="text-[9px] text-primary-600 font-semibold">Generic Name</p>
                      <p className="text-[10px] text-primary-700">{selectedMedicine.genericName}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <p className="text-[9px] text-primary-600 font-semibold">Price</p>
                      <p className="text-xs font-bold text-primary-700">
                        {formatCurrency(selectedMedicine.sellingPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-primary-600 font-semibold">Stock</p>
                      <p
                        className={`text-xs font-bold ${selectedMedicine.quantity > selectedMedicine.reorderLevel ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {selectedMedicine.quantity}
                      </p>
                    </div>
                  </div>

                  {selectedMedicine.category && (
                    <div>
                      <p className="text-[9px] text-primary-600 font-semibold">Category</p>
                      <p className="text-[10px] text-primary-700">{selectedMedicine.category}</p>
                    </div>
                  )}

                  {selectedMedicine.expiryDate && (
                    <div>
                      <p className="text-[9px] text-primary-600 font-semibold">Expiry Date</p>
                      <p className="text-[10px] text-primary-700">
                        {new Date(selectedMedicine.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-primary-200 pt-1.5">
                    <p className="text-[9px] text-primary-600 font-semibold">Barcode</p>
                    <p className="text-[9px] text-primary-700 font-mono">{selectedMedicine.barcode}</p>
                  </div>
                </div>
              </div>

              {/* Quantity Control */}
              <QuantityControl
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={selectedMedicine.quantity}
                label="Quantity"
              />

              {/* Action Buttons */}
              <div className="space-y-1 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className="w-full bg-primary-500 text-white font-semibold py-1.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => {
                    setSelectedMedicine(null)
                    setSearchTerm('')
                    setQuantity(1)
                  }}
                  className="w-full border border-primary-300 text-primary-700 font-semibold py-1 rounded-lg hover:bg-primary-50 transition-colors text-xs"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <p className="text-primary-600 text-sm">Search and select a medicine to continue</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}