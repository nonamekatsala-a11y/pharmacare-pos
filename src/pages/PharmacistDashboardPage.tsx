import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService, medicineService, Medicine } from '@services/medicineService'
import { useAuthStore } from '@store/authStore'
import { formatCurrency, isExpired } from '@utils/formatters'
import { CardSkeleton } from '@components/Loading'

export default function PharmacistDashboardPage() {
  const navigate = useNavigate()
  const { user, selectedPharmacy } = useAuthStore()
  const [summary, setSummary] = useState<any>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user?.pharmacyId, selectedPharmacy?.id])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [dashboardSummary, inventory] = await Promise.all([
        dashboardService.getSummary(),
        medicineService.getAll(),
      ])
      setSummary(dashboardSummary)
      setMedicines(inventory)
    } catch (error) {
      console.error('Failed to load pharmacist dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMedicines = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    if (!normalizedSearchTerm) return medicines

    return medicines.filter((medicine) => {
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
    setSearchTerm('')
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredMedicines.length > 0) {
      event.preventDefault()
      handleSelectMedicine(filteredMedicines[0])
    }
  }

  const greeting = new Date().getHours() >= 18
    ? 'Good Evening'
    : new Date().getHours() >= 12
      ? 'Good Afternoon'
      : 'Good Morning'

  const lowStockCount = summary?.lowStockCount || 0
  const expiredStockCount = medicines.filter((medicine) => (
    medicine.expiryDate ? isExpired(medicine.expiryDate) : false
  )).length
  const inventoryStatus = !summary
    ? 'Loading...'
    : summary.totalMedicines === 0
      ? 'No Stock'
      : lowStockCount === 0 && expiredStockCount === 0
        ? 'Good'
        : 'Needs Review'

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* Search Section Skeleton */}
        <div className="mb-6 md:mb-8 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Summary Cards Skeleton */}
        <div className="mb-6 md:mb-8 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton count={3} />
        </div>
        
        {/* Today's Summary Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 md:p-5">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 md:p-5">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6 md:mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pharmacist Dashboard</h1>
          <p className="mt-2 text-gray-600">A focused view of today’s sales and inventory.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            <span className="font-semibold text-primary-500">{greeting}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <button
            onClick={() => navigate('/pos')}
            className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            Sell Medicine
          </button>
          <button
            onClick={() => navigate('/sales')}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Sales History
          </button>
        </div>
      </div>

      <div className="mb-6 md:mb-8 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-gray-900">Search inventory</h2>
        <p className="mt-1 text-sm text-gray-600">Find medicine or category quickly.</p>

        <div className="mt-4 md:mt-5">
          <div className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by name, barcode, or generic name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedMedicine(null)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {searchTerm && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredMedicines.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-sm">
                  {medicines.length === 0 ? 'No stock is available for this pharmacy' : 'Medicine not found'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMedicines.slice(0, 10).map((medicine) => {
                    const isLowStock = medicine.quantity <= medicine.reorderLevel
                    return (
                      <button
                        key={medicine.id}
                        onClick={() => handleSelectMedicine(medicine)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-semibold text-gray-900 text-sm">{medicine.medicineName}</div>
                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                          {medicine.genericName && <span>{medicine.genericName}</span>}
                          <span>•</span>
                          <span className={isLowStock ? 'text-red-600' : 'text-green-600'}>
                            Stock: {medicine.quantity}
                          </span>
                          <span>•</span>
                          <span className="text-primary-600">{formatCurrency(medicine.sellingPrice)}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Medicine Details */}
        {selectedMedicine && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">{selectedMedicine.medicineName}</h3>
              <button
                onClick={() => {
                  setSelectedMedicine(null)
                  setSearchTerm('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedMedicine.genericName && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Generic Name</p>
                  <p className="text-sm text-gray-900">{selectedMedicine.genericName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600 font-semibold">Price</p>
                <p className="text-sm font-bold text-primary-600">{formatCurrency(selectedMedicine.sellingPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Stock</p>
                <p className={`text-sm font-bold ${selectedMedicine.quantity > selectedMedicine.reorderLevel ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedMedicine.quantity}
                </p>
              </div>
              {selectedMedicine.category && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Category</p>
                  <p className="text-sm text-gray-900">{selectedMedicine.category}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate('/pos')}
                className="flex-1 bg-primary-500 text-white font-semibold py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
              >
                Sell Medicine
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                View in Inventory
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 md:mb-8 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate('/inventory?filter=needs-review')}
          className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Inventory Status</p>
          <p className={`mt-4 text-2xl md:text-3xl font-bold ${
            inventoryStatus === 'Needs Review' ? 'text-red-600' : 'text-gray-900'
          }`}>
            {inventoryStatus}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {summary?.totalMedicines || 0} medicine types available
          </p>
        </button>

        <button
          onClick={() => navigate('/sales')}
          className="rounded-2xl border border-gray-200 bg-blue-50 p-4 md:p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Today Sales</p>
          <p className="mt-4 text-2xl md:text-3xl font-bold text-blue-700">{formatCurrency(summary?.revenueToday || 0)}</p>
          <p className="mt-2 text-sm text-gray-600">Revenue from {summary?.totalSalesToday || 0} completed sales</p>
        </button>

        <button
          onClick={() => navigate('/inventory?filter=low-stock')}
          className="rounded-2xl border border-gray-200 bg-red-50 p-4 md:p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Low Stock</p>
          <p className="mt-4 text-2xl md:text-3xl font-bold text-red-600">{lowStockCount}</p>
          <p className="mt-2 text-sm text-gray-600">Medicines needing reorder</p>
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Today&apos;s Summary</h2>

        <div className="mt-4 md:mt-6 grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 md:p-5">
            <p className="text-sm text-gray-600">Units Sold</p>
            <p className="mt-3 text-2xl md:text-3xl font-bold text-gray-900">{summary?.totalUnitsSold || 0}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 md:p-5">
            <p className="text-sm text-gray-600">Today&apos;s Revenue</p>
            <p className="mt-3 text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(summary?.revenueToday || 0)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Logged in as: <span className="font-semibold text-gray-700">{user?.userName || 'Pharmacist'}</span>
      </div>
    </div>
  )
}
