import { useState, useEffect, useCallback } from 'react'
import { profitLossService, ProfitLossStatement, ProfitLossSummary } from '@services/profitLossService'
import { PHARMACIES } from '@config/pharmacyConfig'
import { useAuthStore } from '@store/authStore'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import { setAdminPharmacyOverride } from '@services/medicineService'
import { formatCurrency, formatDate } from '@utils/formatters'
import type { Pharmacy } from '@config/pharmacyConfig'

export default function ProfitLossPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [viewMode, setViewMode] = useState<'summary' | 'individual'>('summary')
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null)
  const [individualStatement, setIndividualStatement] = useState<ProfitLossStatement | null>(null)
  const [allStatements, setAllStatements] = useState<ProfitLossStatement[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([])

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
    loadSummaryData()
  }

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadSummaryData()
    setIsRefreshing(false)
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      interval = setInterval(() => {
        loadSummaryData()
      }, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [autoRefresh, dateRange, adminSelectedPharmacy, viewMode, selectedPharmacyId])

  useEffect(() => {
    loadSummaryData()
  }, [dateRange, adminSelectedPharmacy, viewMode, selectedPharmacyId])

  const loadSummaryData = async () => {
    try {
      setIsLoading(true)
      
      if (viewMode === 'summary') {
        const [summaryData, statementsData] = await Promise.all([
          profitLossService.getProfitLossSummary(dateRange.from, dateRange.to),
          profitLossService.getAllPharmaciesProfitLoss(dateRange.from, dateRange.to),
        ])
        setSummary(summaryData)
        setAllStatements(statementsData)
      } else if (selectedPharmacyId) {
        const [statementData, trendsData, categoryData] = await Promise.all([
          profitLossService.getProfitLossStatement(selectedPharmacyId, dateRange.from, dateRange.to),
          profitLossService.getMonthlyTrends(selectedPharmacyId, 6),
          profitLossService.getCategoryPerformance(selectedPharmacyId, dateRange.from, dateRange.to),
        ])
        setIndividualStatement(statementData)
        setMonthlyTrends(trendsData)
        setCategoryPerformance(categoryData)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load profit/loss data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange({ ...dateRange, [field]: value })
  }

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600'
    if (profit < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (isLoading) {
    return <div className="p-8">Loading profit/loss data...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statements</h1>
            <p className="mt-2 text-gray-600">Financial performance analysis per pharmacy</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'Admin' && (
              <AdminPharmacySelector
                selectedPharmacy={adminSelectedPharmacy}
                onPharmacySelect={handleAdminPharmacyChange}
              />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                title="Manual refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 15.356M15.356 15.356A8.001 8.001 0 004.582 15.356m0 0H15m-4.582-4.582v-5m0 0H4" />
                </svg>
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors ${
                  autoRefresh ? 'bg-green-50 border-green-300' : ''
                }`}
                title="Auto-refresh every 30s"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0 1 1 0 002 0zm-1 2a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
            </svg>
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            {autoRefresh && (
              <span className="text-green-600 font-medium">• Auto-refresh (30s)</span>
            )}
            {isRefreshing && (
              <span className="text-blue-600 font-medium">• Updating...</span>
            )}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'summary'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Pharmacies Summary
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'individual'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Individual Pharmacy
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange('from', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange('to', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex-1"></div>
          {viewMode === 'individual' && (
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Pharmacy</label>
              <select
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                <option value="">Select pharmacy</option>
                {PHARMACIES.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && summary && (
        <div>
          {/* Overall Summary Cards */}
          <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Revenue</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Expenses</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-red-600 truncate">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Net Profit</p>
              <p className={`mt-1 sm:mt-2 text-lg font-bold ${getProfitColor(summary.totalProfit)} truncate`}>
                {formatCurrency(summary.totalProfit)}
              </p>
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-green-800 font-medium truncate">Best Performing Pharmacy</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-green-900 truncate">{summary.bestPerformingPharmacy}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-red-800 font-medium truncate">Worst Performing Pharmacy</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-red-900 truncate">{summary.worstPerformingPharmacy}</p>
            </div>
          </div>

          {/* Individual Pharmacy Statements */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allStatements.map((statement) => (
                    <tr key={statement.pharmacyId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{statement.pharmacyName}</td>
                      <td className="px-6 py-4 text-gray-900">{formatCurrency(statement.revenue.totalRevenue)}</td>
                      <td className="px-6 py-4 text-red-600">{formatCurrency(statement.expenses.totalExpenses)}</td>
                      <td className={`px-6 py-4 font-medium ${getProfitColor(statement.profitLoss.netProfit)}`}>
                        {formatCurrency(statement.profitLoss.netProfit)}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{statement.revenue.totalOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Individual Pharmacy View */}
      {viewMode === 'individual' && individualStatement && (
        <div>
          {/* Pharmacy Header */}
          <div className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold">{individualStatement.pharmacyName}</h2>
            <p className="text-primary-100">
              Period: {formatDate(individualStatement.period.from)} - {formatDate(individualStatement.period.to)}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Revenue</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{formatCurrency(individualStatement.revenue.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{individualStatement.revenue.totalOrders} orders</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Total Expenses</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-red-600 truncate">{formatCurrency(individualStatement.expenses.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{Object.keys(individualStatement.expenses.byCategory).length} categories</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Net Profit</p>
              <p className={`mt-1 sm:mt-2 text-lg font-bold ${getProfitColor(individualStatement.profitLoss.netProfit)} truncate`}>
                {formatCurrency(individualStatement.profitLoss.netProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">{individualStatement.profitLoss.profitMargin.toFixed(1)}% margin</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Average Transaction</p>
              <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{formatCurrency(individualStatement.revenue.averageTransaction)}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">ROI: {individualStatement.profitLoss.roi.toFixed(1)}%</p>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Expense Breakdown</h3>
            <div className="space-y-4">
              {individualStatement.expenses.breakdown.map((breakdown) => (
                <div key={breakdown.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{breakdown.category}</span>
                      <span className="text-sm text-gray-600">{breakdown.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${breakdown.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(breakdown.amount)}</p>
                    <p className={`text-xs ${breakdown.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {breakdown.variance > 0 ? '+' : ''}{formatCurrency(breakdown.variance)} vs budget
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trends</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyTrends.map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{trend.month}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(trend.revenue)}</td>
                      <td className="px-4 py-2 text-right text-red-600">{formatCurrency(trend.expenses)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${getProfitColor(trend.profit)}`}>
                        {formatCurrency(trend.profit)}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getProfitColor(trend.margin)}`}>
                        {trend.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Items Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryPerformance.map((cat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{cat.category}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(cat.revenue)}</td>
                      <td className="px-4 py-2 text-right text-red-600">{formatCurrency(cat.expenses)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${getProfitColor(cat.profit)}`}>
                        {formatCurrency(cat.profit)}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${getProfitColor(cat.margin)}`}>
                        {cat.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">{cat.itemsSold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}