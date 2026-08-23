import { useEffect, useState } from 'react'
import { medicineService, Medicine, DashboardSummary } from '@services/medicineService'
import { saleService, Sale, TopSellingMedicine } from '@services/saleService'
import { useAuthStore } from '@store/authStore'
import { PHARMACIES } from '@config/pharmacyConfig'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import { setAdminPharmacyOverride } from '@services/medicineService'
import type { Pharmacy } from '@config/pharmacyConfig'
import { formatCurrency } from '@utils/formatters'
import { CardSkeleton, SkeletonScreen } from '@components/Loading'

// SVG Icon Components
const PillIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M8.5 13a.5.5 0 11-1 0 .5.5 0 011 0zM9 16a1 1 0 11-2 0 1 1 0 012 0z" />
    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zm9.334 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.41 6.386l1.648 2.568a1 1 0 01-.754 1.485l-1.678.336 1.372 4.378a1 1 0 01-.238.973l-2.5 2.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 01-.238-.973l1.372-4.378-1.678-.336a1 1 0 01-.754-1.485l1.648-2.568L2.252 3.759a1 1 0 011.827-1.035l1.699 3.181L9 4.323V3a1 1 0 011-1zm-1 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
  </svg>
)

export default function DashboardPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [todaySales, setTodaySales] = useState<Sale[]>([])
  const [topSellingByQuantity, setTopSellingByQuantity] = useState<TopSellingMedicine[]>([])
  const [topSellingByRevenue, setTopSellingByRevenue] = useState<TopSellingMedicine[]>([])
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)

  // Initialize admin pharmacy selection
  useEffect(() => {
    if (user?.role === 'Admin') {
      const pharmacy = selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)
      if (pharmacy && !adminSelectedPharmacy) {
        setAdminSelectedPharmacy(pharmacy)
        setAdminPharmacyOverride(pharmacy.id)
      }
    }
  }, [user, selectedPharmacy])

  // Handle admin pharmacy change
  const handleAdminPharmacyChange = (pharmacy: Pharmacy) => {
    setAdminSelectedPharmacy(pharmacy)
    setAdminPharmacyOverride(pharmacy.id)
    loadDashboardData()
  }

  // Get current pharmacy info
  const currentPharmacy = adminSelectedPharmacy || selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)

  useEffect(() => {
    loadDashboardData()
  }, [timePeriod])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      let salesForSummary: Sale[] = []
      // Load medicines to calculate inventory stats
      const medicineList = await medicineService.getAll()
      setMedicines(medicineList)

      // Load recent sales
      try {
        const sales = await saleService.getAll()
        salesForSummary = sales
        setRecentSales(sales.slice(0, 5)) // Get last 5 sales
      } catch {
        setRecentSales([]) // Fallback if endpoint not ready
      }

      // Load top selling medicines
      try {
        const [topByQty, topByRev] = await Promise.all([
          saleService.getTopSellingMedicinesReal({ period: timePeriod, limit: 5 }),
          saleService.getTopRevenueMedicinesReal({ period: timePeriod, limit: 5 })
        ])
        setTopSellingByQuantity(topByQty)
        setTopSellingByRevenue(topByRev)
      } catch {
        setTopSellingByQuantity([])
        setTopSellingByRevenue([])
      }

      // Calculate summary from medicines
      const lowStockCount = medicineList.filter((m) => m.quantity <= m.reorderLevel).length

      const today = new Date().toLocaleDateString()
      const todaysSales = salesForSummary.filter((sale) => new Date(sale.saleDate).toLocaleDateString() === today)
      setTodaySales(todaysSales)
      const totalRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)

      setSummary({
        totalMedicines: medicineList.length,
        lowStockCount,
        categoriesCount: new Set(medicineList.map((m) => m.category)).size,
        suppliersCount: new Set(medicineList.map((m) => m.supplier)).size,
        totalSalesToday: todaysSales.length,
        totalUnitsSold: todaysSales.reduce(
          (sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
          0,
        ),
        revenueToday: totalRevenue,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get low stock items
  const lowStockItems = medicines.filter((m) => m.quantity <= m.reorderLevel).slice(0, 5)

  // Get expired items
  const expiredItems = medicines
    .filter((m) => {
      if (!m.expiryDate) return false
      const expiryDate = new Date(m.expiryDate)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expiryDate <= thirtyDaysFromNow
    })
    .slice(0, 5)

  // Calculate today's revenue
  const todaysRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const inventoryValue = medicines.reduce((sum, medicine) => (
    sum + medicine.sellingPrice * medicine.quantity
  ), 0)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        
        {/* Summary Cards Skeleton */}
        <CardSkeleton count={4} className="mb-8" />
        
        {/* Recent Sales Section Skeleton */}
        <div className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-1/5 mb-4 animate-pulse"></div>
          <SkeletonScreen type="table" rows={5} columns={4} />
        </div>
        
        {/* Top Selling Section Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <SkeletonScreen type="list" rows={3} />
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <SkeletonScreen type="list" rows={3} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 mb-1">Dashboard</h1>
            <p className="text-xs text-primary-400">Welcome back. Here's your pharmacy overview.</p>
          </div>
          {user?.role === 'Admin' && (
            <AdminPharmacySelector
              selectedPharmacy={adminSelectedPharmacy}
              onPharmacySelect={handleAdminPharmacyChange}
            />
          )}
        </div>
        {user?.role === 'Admin' && currentPharmacy && (
          <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-100 px-3 py-1.5 rounded-lg inline-flex">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Viewing: <strong>{currentPharmacy.name}</strong></span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Total Medicines Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-primary-400 mb-1">Total Medicines</p>
              <p className="text-lg font-bold text-primary-500">{summary?.totalMedicines || 0}</p>
              <p className="text-[10px] text-primary-300">In inventory</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-500 flex-shrink-0 ml-2"><PillIcon /></div>
          </div>
        </div>

        {/* Today's Revenue Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-primary-400 mb-1">Today's Revenue</p>
              <p className="text-lg font-bold text-green-600">K{todaysRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-primary-300">From items sold today</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0 ml-2"><CurrencyIcon /></div>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-primary-400 mb-1">Expiring Soon</p>
              <p className="text-lg font-bold text-red-600">{expiredItems.length || 0}</p>
              <p className="text-[10px] text-primary-300">Items expiring within 30 days</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0 ml-2"><XCircleIcon /></div>
          </div>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-primary-400 mb-1">Inventory Value</p>
              <p className="text-lg font-bold text-primary-500">{formatCurrency(inventoryValue)}</p>
              <p className="text-[10px] text-primary-300">Total inventory</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0 ml-2"><TrendingUpIcon /></div>
          </div>
        </div>
      </div>

      {/* Inventory Status & Quick Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Inventory Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-4">
          <div className="flex items-center gap-2 mb-3"><ChartIcon /><h3 className="text-sm font-bold text-primary-900">Inventory Status</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary-400 font-medium">Total in Stock</span>
              <span className="text-lg font-bold text-primary-500">
                {medicines.reduce((sum, m) => sum + m.quantity, 0)}
              </span>
            </div>
            <div className="border-t border-primary-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400 font-medium">Available Items</span>
                <span className="text-sm font-bold text-green-600">{medicines.length}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400 font-medium">Low Stock Alert</span>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-full text-xs">
                  {summary?.lowStockCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-400 font-medium">Expiring Soon</span>
                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 font-semibold rounded-full text-xs">
                  {expiredItems.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Report Card */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-4">
          <div className="flex items-center gap-2 mb-3"><TrendingUpIcon /><h3 className="text-sm font-bold text-primary-900">Quick Report</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary-400 font-medium">Invoices Generated</span>
              <span className="text-lg font-bold text-primary-600">{todaySales.length}</span>
            </div>
            <div className="border-t border-primary-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400 font-medium">Medicines Sold</span>
                <span className="text-sm font-bold text-green-600">
                  {todaySales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400 font-medium">Total Units Sold</span>
                <span className="text-sm font-bold text-primary-600">
                  {todaySales.reduce((sum, sale) => sum + sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-400 font-medium">Total Revenue</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(todaysRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Medicines Section */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrophyIcon />
            <h3 className="text-sm font-bold text-primary-900">Top Selling Medicines</h3>
          </div>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as 'today' | 'week' | 'month' | 'all')}
            className="text-xs border border-primary-200 rounded-lg px-3 py-1.5 focus:border-primary-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top by Quantity */}
          <div>
            <h4 className="text-xs font-semibold text-primary-600 mb-3">By Quantity Sold</h4>
            <div className="space-y-2">
              {topSellingByQuantity.length > 0 ? (
                topSellingByQuantity.map((medicine, index) => (
                  <div key={medicine.medicineId} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-primary-900">{medicine.medicineName}</p>
                        <p className="text-[10px] text-primary-400">{medicine.genericName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary-600">{medicine.totalQuantity} sold</p>
                      <p className="text-[10px] text-primary-400">{medicine.transactions} sales</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-primary-400 text-xs py-4">No sales data for this period</div>
              )}
            </div>
          </div>

          {/* Top by Revenue */}
          <div>
            <h4 className="text-xs font-semibold text-primary-600 mb-3">By Revenue Generated</h4>
            <div className="space-y-2">
              {topSellingByRevenue.length > 0 ? (
                topSellingByRevenue.map((medicine, index) => (
                  <div key={medicine.medicineId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-primary-900">{medicine.medicineName}</p>
                        <p className="text-[10px] text-primary-400">{medicine.genericName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-green-600">{formatCurrency(medicine.totalRevenue)}</p>
                      <p className="text-[10px] text-primary-400">{medicine.transactions} sales</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-primary-400 text-xs py-4">No sales data for this period</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Alerts + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts Panel */}
        <div>
          <h2 className="text-sm font-bold text-primary-900 mb-3">Inventory Alerts</h2>
          <div className="space-y-3">
            {/* Low Stock Section */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-100 overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                <WarningIcon />
                <h3 className="font-semibold text-amber-900 text-xs">Low Stock Items</h3>
              </div>
              <div className="divide-y divide-primary-100">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="px-4 py-2 hover:bg-primary-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-primary-900 text-xs">{item.medicineName}</p>
                          <p className="text-[10px] text-primary-300">{item.genericName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-600 text-xs">{item.quantity} units</p>
                          <p className="text-[10px] text-primary-300">Min: {item.reorderLevel}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-primary-400 text-xs">All medicines are well stocked</div>
                )}
              </div>
            </div>

            {/* Expiring Soon Section */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-100 overflow-hidden">
              <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-2">
                <XCircleIcon />
                <h3 className="font-semibold text-red-900 text-xs">Expiring Soon</h3>
              </div>
              <div className="divide-y divide-primary-100">
                {expiredItems.length > 0 ? (
                  expiredItems.map((item) => (
                    <div key={item.id} className="px-4 py-2 hover:bg-primary-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-primary-900 text-xs">{item.medicineName}</p>
                          <p className="text-[10px] text-primary-300">{item.batchNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600 text-xs">{item.quantity} units</p>
                          <p className="text-[10px] text-primary-300">
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-primary-400 text-xs">No items expiring soon</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales Panel */}
        <div>
          <h2 className="text-sm font-bold text-primary-900 mb-3">Recent Sales</h2>
          <div className="bg-white rounded-lg shadow-sm border border-primary-100 overflow-hidden">
            <div className="divide-y divide-primary-100 max-h-80 overflow-y-auto">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="px-4 py-3 hover:bg-primary-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-primary-900 text-xs">{sale.invoiceNumber}</p>
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-medium rounded">
                        {sale.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-primary-400">
                      <p>{new Date(sale.saleDate).toLocaleDateString()}</p>
                      <p className="font-semibold text-primary-900">K{sale.total.toLocaleString()}</p>
                    </div>
                    <div className="text-[10px] text-primary-300 mt-0.5">
                      {sale.items?.length || 0} items • {sale.paymentMethod}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-primary-400">
                  <p className="text-xs">No sales yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
