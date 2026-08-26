import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { medicineService, inventoryService, Medicine, setAdminPharmacyOverride } from '@services/medicineService'
import { useAuthStore } from '@store/authStore'
import InventoryList from '@components/Inventory/InventoryList'
import { InventoryItem } from '@services/medicineService'
import { formatCurrency, isExpired } from '@utils/formatters'
import { PHARMACIES } from '@config/pharmacyConfig'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import type { Pharmacy } from '@config/pharmacyConfig'
import { CardSkeleton, SkeletonScreen } from '@components/Loading'
import Modal from '@components/Common/Modal'
import Button from '@components/Common/Button'

export default function InventoryPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [updateMedicineId, setUpdateMedicineId] = useState<string | null>(null)
  const [damagedQuantity, setDamagedQuantity] = useState('')
  const [deleteMedicineId, setDeleteMedicineId] = useState<string | null>(null)

  // Initialize pharmacy selection for both admins and pharmacists
  useEffect(() => {
    const pharmacy = selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)
    if (pharmacy) {
      if (user?.role === 'Admin') {
        if (!adminSelectedPharmacy) {
          setAdminSelectedPharmacy(pharmacy)
          setAdminPharmacyOverride(pharmacy.id)
        }
      } else {
        // For pharmacists, set the pharmacy override directly
        setAdminPharmacyOverride(pharmacy.id)
      }
    }
  }, [user, selectedPharmacy])

  // Handle admin pharmacy change
  const handleAdminPharmacyChange = (pharmacy: Pharmacy) => {
    setAdminSelectedPharmacy(pharmacy)
    setAdminPharmacyOverride(pharmacy.id)
    loadInventoryData()
  }

  // Get current pharmacy info
  const currentPharmacy = adminSelectedPharmacy || selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)
  const needsReviewFilter = searchParams.get('filter') === 'needs-review'
  const lowStockFilter = searchParams.get('filter') === 'low-stock'

  useEffect(() => {
    loadInventoryData()
  }, [user?.pharmacyId, selectedPharmacy?.id])

  const loadInventoryData = async () => {
    try {
      setIsLoading(true)
      const medicinesData = await medicineService.getAll()
      const inventoryData: InventoryItem[] = medicinesData.map((medicine) => ({
        id: `inv-${medicine.id}`,
        medicineId: medicine.id,
        quantityOnHand: medicine.quantity,
        reservedQuantity: 0,
        expiryDate: medicine.expiryDate,
        batchNumber: medicine.batchNumber || 'Unassigned',
        unitCost: medicine.purchasePrice,
        location: 'Main',
        medicine,
      }))
      setInventory(inventoryData)
      setMedicines(medicinesData)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const medicineToDelete = medicines.find((medicine) => medicine.id === deleteMedicineId)
  const medicineToUpdate = medicines.find((medicine) => medicine.id === updateMedicineId)
  const damagedMedicines = medicines.filter((medicine) => (medicine.damagedQuantity || 0) > 0)

  const handleUpdateMedicine = async () => {
    if (!updateMedicineId) return

    try {
      await inventoryService.recordDamage(updateMedicineId, Number(damagedQuantity))
      setUpdateMedicineId(null)
      setDamagedQuantity('')
      await loadInventoryData()
    } catch (error) {
      console.error('Failed to update medicine inventory:', error)
    }
  }

  const handleDeleteMedicine = async () => {
    if (!deleteMedicineId) return

    try {
      await medicineService.delete(deleteMedicineId)
      setDeleteMedicineId(null)
      await loadInventoryData()
    } catch (error) {
      console.error('Failed to delete medicine from inventory:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        
        {/* Summary Cards Skeleton */}
        <CardSkeleton count={4} className="mb-8" />
        
        {/* Search Skeleton */}
        <div className="mb-6 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Table Skeleton */}
        <SkeletonScreen type="table" rows={8} columns={6} />
      </div>
    )
  }

  // Calculate statistics (considering pending allocations for low stock)
  const lowStockItems = medicines.filter((m) => {
    const effectiveQuantity = m.quantity + (m.pendingAllocation || 0)
    return effectiveQuantity <= m.reorderLevel
  }).length
  
  // Count allocated medicines
  const allocatedMedicines = medicines.filter((m) => 
    m.allocationStatus && m.allocationStatus !== undefined
  ).length
  const totalMedicines = medicines.length
  const totalInventoryValue = medicines.reduce((sum, m) => sum + m.sellingPrice * m.quantity, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-gray-600">Track medicine stock and quantities</p>
          </div>
          {user?.role === 'Admin' && (
            <AdminPharmacySelector
              selectedPharmacy={adminSelectedPharmacy}
              onPharmacySelect={handleAdminPharmacyChange}
            />
          )}
        </div>
        {currentPharmacy && (
          <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg inline-flex">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Viewing: <strong>{currentPharmacy.name}</strong></span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Medicines Card */}
        <button
          onClick={() => navigate('/inventory')}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-left w-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Medicines</p>
              <p className="mt-3 text-lg font-bold text-gray-900">{totalMedicines}</p>
              <p className="mt-2 text-xs text-gray-500">Active products in stock</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </button>

        {/* Low Stock Card */}
        <button
          onClick={() => navigate('/inventory?filter=low-stock')}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-left w-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-3 text-lg font-bold text-orange-600">{lowStockItems}</p>
              <p className="mt-2 text-xs text-gray-500">Need to reorder soon</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.343 3.665c.886-.887 2.318-.887 3.203 0l7.778 7.778c.887.886.887 2.318 0 3.203l-7.778 7.778c-.886.887-2.318.887-3.203 0L3.14 14.21c-.887-.886-.887-2.318 0-3.203l7.202-7.202z" />
              </svg>
            </div>
          </div>
        </button>

        {/* Allocated Medicines Card */}
        {allocatedMedicines > 0 && (
          <button
            onClick={() => navigate('/inventory')}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allocated Medicines</p>
                <p className="mt-3 text-lg font-bold text-purple-600">{allocatedMedicines}</p>
                <p className="mt-2 text-xs text-gray-500">From warehouse allocations</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Inventory Value Card - Admin Only */}
        {user?.role === 'Admin' && (
          <button
            onClick={() => navigate('/inventory')}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="mt-3 text-lg font-bold text-primary-600">{formatCurrency(totalInventoryValue)}</p>
                <p className="mt-2 text-xs text-gray-500">Purchase value of stock</p>
              </div>
              <div className="rounded-full bg-primary-100 p-3">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Search Section */}
      <div className="mb-6">
        {(needsReviewFilter || lowStockFilter) && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-amber-800">
                {needsReviewFilter ? 'Showing items that need review (low stock or expired)' : 'Showing low stock items only'}
              </span>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-amber-700 hover:text-amber-900 font-medium"
            >
              Clear Filter
            </button>
          </div>
        )}
        <div className="relative">
          <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by medicine name, generic name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
          />
        </div>
      </div>

      {/* Inventory List */}
      <InventoryList
        onUpdate={user?.role === 'Admin' ? (medicineId) => {
          setUpdateMedicineId(medicineId)
          setDamagedQuantity('')
        } : undefined}
        onDelete={user?.role === 'Admin' ? setDeleteMedicineId : undefined}
        userRole={user?.role}
        inventory={inventory.filter(item => {
        const medicine = item.medicine
        if (!medicine) return false;
        if (needsReviewFilter && !(
          medicine.quantity <= medicine.reorderLevel ||
          (medicine.expiryDate ? isExpired(medicine.expiryDate) : false)
        )) return false
        if (lowStockFilter && !(
          medicine.quantity <= medicine.reorderLevel
        )) return false
        const search = searchTerm.toLowerCase();
        return (
          medicine.medicineName.toLowerCase().includes(search) ||
          (medicine.genericName?.toLowerCase() || '').includes(search) ||
          (medicine.batchNumber?.toLowerCase() || '').includes(search)
        );
        })}
      />

      {damagedMedicines.length > 0 && (
        <section className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-red-800">Damaged Medicines</h2>
          <p className="mt-1 text-sm text-red-700">These units are excluded from usable inventory and cannot be sold.</p>
          <div className="mt-4 overflow-x-auto rounded-lg bg-white">
            <table className="w-full">
              <thead className="border-b border-red-100 bg-red-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Medicine</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Damaged Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Good Quantity Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {damagedMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{medicine.medicineName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-700">{medicine.damagedQuantity || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{medicine.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {updateMedicineId && (
        <Modal
          isOpen={true}
          title="Record Damaged Medicine"
          onClose={() => setUpdateMedicineId(null)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Record damaged units for <strong>{medicineToUpdate?.medicineName || 'this medicine'}</strong>. Good stock will remain available.
            </p>
            <input
              type="number"
              min="1"
              step="1"
              value={damagedQuantity}
              onChange={(event) => setDamagedQuantity(event.target.value)}
              placeholder="Damaged quantity"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setUpdateMedicineId(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleUpdateMedicine}>
                Record Damage
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteMedicineId && (
        <Modal
          isOpen={true}
          title="Delete Medicine From Inventory"
          onClose={() => setDeleteMedicineId(null)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Delete <strong>{medicineToDelete?.medicineName || 'this medicine'}</strong> from this pharmacy&apos;s inventory?
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleteMedicineId(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleDeleteMedicine}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
