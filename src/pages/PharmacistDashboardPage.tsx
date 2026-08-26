import { useEffect, useState } from 'react'
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
        </div>
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
