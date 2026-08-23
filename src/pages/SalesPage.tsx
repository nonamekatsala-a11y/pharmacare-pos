import { useState, useEffect } from 'react'
import { saleService, Sale, DailySale, MonthlySale, MedicineSale } from '@services/saleService'
import { setAdminPharmacyOverride } from '@services/medicineService'
import { useAuthStore } from '@store/authStore'
import DailySales from '@components/Sales/DailySales'
import MonthlySales from '@components/Sales/MonthlySales'
import SalesByMedicine from '@components/Sales/SalesByMedicine'
import RecentSales from '@components/Sales/RecentSales'
import { formatCurrency, formatDate } from '@utils/formatters'
import Button from '@components/Common/Button'
import { PHARMACIES } from '@config/pharmacyConfig'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import SaleDetailModal from '@components/Common/SaleDetailModal'
import type { Pharmacy } from '@config/pharmacyConfig'

export default function SalesPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this-month' | 'last30days'>('all')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string } | null>(null)
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false)

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
    loadSalesData()
  }

  // Get current pharmacy info
  const currentPharmacy = adminSelectedPharmacy || selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)
  
  // Analytics data
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([])
  const [salesByMedicine, setSalesByMedicine] = useState<MedicineSale[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])

  useEffect(() => {
    loadSalesData()
  }, [dateFilter, customDateRange, adminSelectedPharmacy])

  const loadSalesData = async () => {
    try {
      setIsLoading(true)
      
      let fromDate: string | undefined
      let toDate: string | undefined

      if (customDateRange?.from && customDateRange?.to) {
        fromDate = customDateRange.from
        toDate = customDateRange.to
      } else if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        fromDate = today
        toDate = today
      } else if (dateFilter === 'this-month') {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        fromDate = formatDate(startOfMonth)
        toDate = formatDate(today)
      } else if (dateFilter === 'last30days') {
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        fromDate = formatDate(thirtyDaysAgo)
        toDate = formatDate(today)
      }

      // Load all analytics data in parallel
      const [dailyData, monthlyData, medicineData, allSales] = await Promise.all([
        saleService.getDailySales(fromDate, toDate),
        saleService.getMonthlySales(fromDate, toDate),
        saleService.getSalesByMedicine(fromDate, toDate),
        saleService.getAll(),
      ])

      // Filter recent sales based on date range
      let filteredSales = allSales
      if (fromDate && toDate) {
        const from = new Date(fromDate)
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        filteredSales = allSales.filter((sale) => {
          const saleDate = new Date(sale.saleDate)
          return saleDate >= from && saleDate <= to
        })
      }

      // Calculate totals
      const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
      const orders = filteredSales.length

      setDailySales(dailyData)
      setMonthlySales(monthlyData)
      setSalesByMedicine(medicineData)
      setRecentSales(filteredSales.slice(0, 10)) // Last 10 sales
      setTotalRevenue(revenue)
      setTotalOrders(orders)
    } catch (error) {
      console.error('Failed to load sales data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filter: 'all' | 'today' | 'this-month' | 'last30days') => {
    setDateFilter(filter)
    setCustomDateRange(null)
  }

  const handleCustomDateSubmit = () => {
    if (customDateRange?.from && customDateRange?.to) {
      setDateFilter('all')
      loadSalesData()
    }
  }

  const handleResetSales = () => {
    setDateFilter('all')
    setCustomDateRange(null)
    loadSalesData()
  }

  const handleEditSale = async (saleId: string) => {
    try {
      const sale = await saleService.getById(saleId)
      setSelectedSale(sale)
      setIsSaleDetailModalOpen(true)
    } catch (error) {
      console.error('Failed to load sale details:', error)
    }
  }

  const handleSaveSale = async (updatedSale: Sale) => {
    try {
      const savedSale = await saleService.update(updatedSale.id, updatedSale)
      await loadSalesData()
      setSelectedSale(savedSale)
    } catch (error) {
      console.error('Failed to update sale:', error)
      alert('Failed to update sale. Please try again.')
    }
  }

  // Only allow admins to edit sales
  const canEditSales = user?.role === 'Admin'

  if (isLoading) {
    return <div className="p-8">Loading sales data...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
            <p className="mt-2 text-gray-600">Review revenue trends, order volume and top selling medicines.</p>
          </div>
          {user?.role === 'Admin' && (
            <AdminPharmacySelector
              selectedPharmacy={adminSelectedPharmacy}
              onPharmacySelect={handleAdminPharmacyChange}
            />
          )}
        </div>
        {user?.role === 'Admin' && currentPharmacy && (
          <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg inline-flex">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Viewing: <strong>{currentPharmacy.name}</strong></span>
          </div>
        )}
      </div>

      {/* Filters and Summary Cards */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          {/* Summary Cards */}
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm min-w-[120px] sm:min-w-[150px] md:min-w-[180px]">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Revenue</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm min-w-[120px] sm:min-w-[150px] md:min-w-[180px]">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Orders</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{totalOrders.toLocaleString()}</p>
            </div>
          </div>

          {/* Date Filters */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => handleFilterChange('today')}
                className={dateFilter === 'today' ? 'bg-primary-600' : ''}
              >
                Today
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFilterChange('this-month')}
                className={dateFilter === 'this-month' ? 'bg-primary-600' : ''}
              >
                This Month
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFilterChange('last30days')}
                className={dateFilter === 'last30days' ? 'bg-primary-600' : ''}
              >
                Last 30 Days
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customDateRange?.from || ''}
                onChange={(e) => setCustomDateRange({ from: e.target.value, to: customDateRange?.to || '' })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-primary-500 focus:outline-none"
              />
              <input
                type="date"
                value={customDateRange?.to || ''}
                onChange={(e) => setCustomDateRange({ from: customDateRange?.from || '', to: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-primary-500 focus:outline-none"
              />
              <Button variant="primary" onClick={handleCustomDateSubmit}>
                Apply
              </Button>
              <Button variant="danger" onClick={handleResetSales}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Daily and Monthly Sales */}
        <div className="lg:col-span-2 space-y-6">
          <DailySales dailySales={dailySales} />
          <MonthlySales monthlySales={monthlySales} />
        </div>

        {/* Right Column - Sales by Medicine and Recent Sales */}
        <div className="lg:col-span-3 space-y-6">
          <SalesByMedicine salesByMedicine={salesByMedicine} onEdit={canEditSales ? handleEditSale : undefined} />
          <RecentSales recentSales={recentSales} onEdit={canEditSales ? handleEditSale : undefined} />
        </div>
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={isSaleDetailModalOpen}
        onClose={() => {
          setIsSaleDetailModalOpen(false)
          setSelectedSale(null)
        }}
        onSave={handleSaveSale}
        isAdmin={canEditSales}
      />
    </div>
  )
}