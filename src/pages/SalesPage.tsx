import { useState, useEffect } from 'react'
import { saleService, MedicineSale } from '@services/saleService'
import { setAdminPharmacyOverride } from '@services/medicineService'
import { useAuthStore } from '@store/authStore'
import { formatCurrency, formatLocalDateKey } from '@utils/formatters'
import { PHARMACIES } from '@config/pharmacyConfig'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import type { Pharmacy } from '@config/pharmacyConfig'

export default function SalesPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'today' | 'this-month' | 'custom'>('today')
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string } | null>(null)
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [medicineTab, setMedicineTab] = useState<'today' | 'month'>('today')
  const [searchTerm, setSearchTerm] = useState('')

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
  const [salesByPaymentMethod, setSalesByPaymentMethod] = useState<{ method: string; amount: number; percentage: number; icon: string }[]>([])
  const [salesByMedicine, setSalesByMedicine] = useState<MedicineSale[]>([])

  useEffect(() => {
    loadSalesData()
  }, [dateFilter, customDateRange, adminSelectedPharmacy, medicineTab])

  const loadSalesData = async () => {
    try {
      setIsLoading(true)
      
      let fromDate: string | undefined
      let toDate: string | undefined

      if (customDateRange?.from && customDateRange?.to) {
        fromDate = customDateRange.from
        toDate = customDateRange.to
      } else if (dateFilter === 'today') {
        const today = formatLocalDateKey()
        fromDate = today
        toDate = today
      } else if (dateFilter === 'this-month') {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        fromDate = formatLocalDateKey(startOfMonth)
        toDate = formatLocalDateKey(today)
      }

      // Load medicine sales data based on tab
      let medicineFromDate: string | undefined
      let medicineToDate: string | undefined

      if (medicineTab === 'today') {
        const today = formatLocalDateKey()
        medicineFromDate = today
        medicineToDate = today
      } else {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        medicineFromDate = formatLocalDateKey(startOfMonth)
        medicineToDate = formatLocalDateKey(today)
      }

      const [allSales, medicineData] = await Promise.all([
        saleService.getAll(),
        saleService.getSalesByMedicine(medicineFromDate, medicineToDate),
      ])

      // Filter sales based on date range
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

      // Calculate totals by payment method
      const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
      const paymentMethodTotals = filteredSales.reduce((acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total
        return acc
      }, {} as Record<string, number>)

      const paymentMethodIcons: Record<string, string> = {
        'Cash': '💵',
        'Card': '💳',
        'Credit': '📋',
        'Mpamba': '📱',
        'Airtel Money': '📱',
        'Bank Transfer': '🏦',
      }

      const paymentMethodData = Object.entries(paymentMethodTotals)
        .filter(([method]) => method !== 'Card' && method !== 'Credit')
        .map(([method, amount]) => ({
          method,
          amount,
          percentage: revenue > 0 ? (amount / revenue) * 100 : 0,
          icon: paymentMethodIcons[method] || '💰'
        }))

      setTotalRevenue(revenue)
      setSalesByPaymentMethod(paymentMethodData)
      setSalesByMedicine(medicineData)
    } catch (error) {
      console.error('Failed to load sales data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filter: 'today' | 'this-month' | 'custom') => {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setCustomDateRange(null)
    }
  }

  const handleCustomDateSubmit = () => {
    if (customDateRange?.from && customDateRange?.to) {
      loadSalesData()
    }
  }

  const handleExport = () => {
    // Export functionality placeholder
    console.log('Exporting data...')
  }

  const filteredMedicines = salesByMedicine.filter(medicine =>
    medicine.productName && medicine.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <p className="mt-2 text-gray-600">Review revenue trends, payment methods and medicines sold.</p>
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
            <span>{currentPharmacy.name}</span>
          </div>
        )}
      </div>

      {/* Date Range Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFilterChange('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'today' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleFilterChange('this-month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'this-month' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleFilterChange('custom')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'custom' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Custom Range
          </button>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
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
              <button
                onClick={handleCustomDateSubmit}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Sales */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">Total revenue</p>
          </div>
          
          {/* Payment Method Cards */}
          {salesByPaymentMethod.map((item) => (
            <div key={item.method} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm text-gray-600">{item.method}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(item.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Medicines Sold Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Medicines Sold</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setMedicineTab('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              medicineTab === 'today' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Today's Sales
          </button>
          <button
            onClick={() => setMedicineTab('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              medicineTab === 'month' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            This Month's Sales
          </button>
        </div>

        {/* Search and Export */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:border-primary-500 focus:outline-none w-64"
          />
          <button
            onClick={handleExport}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
        </div>

        {/* Medicine Sales Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Medicine Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Quantity Sold</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMedicines.map((medicine, index) => (
                <tr key={medicine.medicineId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{medicine.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{medicine.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(medicine.revenue / medicine.quantity)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(medicine.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {formatCurrency(filteredMedicines.reduce((sum, m) => sum + m.revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}