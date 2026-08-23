import { useState, useEffect } from 'react'
import { expenseService, Expense, EXPENSE_CATEGORIES, setAdminPharmacyOverride } from '@services/expenseService'
import { useAuthStore } from '@store/authStore'
import { PHARMACIES } from '@config/pharmacyConfig'
import AdminPharmacySelector from '@components/Admin/AdminPharmacySelector'
import Button from '@components/Common/Button'
import Modal from '@components/Common/Modal'
import { formatCurrency, formatDate } from '@utils/formatters'
import type { Pharmacy } from '@config/pharmacyConfig'

export default function ExpensesPage() {
  const { user, selectedPharmacy } = useAuthStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [adminSelectedPharmacy, setAdminSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this-month' | 'last30days'>('all')
  const [summary, setSummary] = useState<{
    totalExpenses: number
    pendingAmount: number
    paidAmount: number
    byCategory: Record<string, number>
    byStatus: Record<string, number>
  } | null>(null)

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending' as 'Pending' | 'Paid',
    receiptNumber: '',
    vendor: '',
    notes: '',
  })

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
    loadExpenses()
    loadSummary()
  }

  // Get current pharmacy info
  const currentPharmacy = adminSelectedPharmacy || selectedPharmacy || PHARMACIES.find(p => p.id === user?.pharmacyId)

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [statusFilter, categoryFilter, dateFilter, adminSelectedPharmacy?.id])

  const loadExpenses = async () => {
    try {
      setIsLoading(true)
      let data = await expenseService.getAll()

      // Apply filters
      if (statusFilter !== 'all') {
        data = data.filter(exp => exp.status === statusFilter)
      }
      if (categoryFilter !== 'all') {
        data = data.filter(exp => exp.category === categoryFilter)
      }
      if (dateFilter !== 'all') {
        const today = new Date()
        let fromDate: Date | null = null

        if (dateFilter === 'today') {
          fromDate = new Date(today.setHours(0, 0, 0, 0))
        } else if (dateFilter === 'this-month') {
          fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
        } else if (dateFilter === 'last30days') {
          fromDate = new Date(today.setDate(today.getDate() - 30))
        }

        if (fromDate) {
          data = data.filter(exp => new Date(exp.date) >= fromDate)
        }
      }

      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const summaryData = await expenseService.getSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage(null)
    try {
      const pharmacyId = currentPharmacy?.id || 'default'
      
      await expenseService.create({
        ...formData,
        pharmacyId,
        amount: parseFloat(formData.amount),
      } as Expense)

      setFormData({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        receiptNumber: '',
        vendor: '',
        notes: '',
      })
      setFormMessage({ type: 'success', text: 'Expense added successfully!' })
      loadExpenses()
      loadSummary()
      setTimeout(() => {
        setIsModalOpen(false)
        setFormMessage(null)
      }, 1500)
    } catch (error) {
      console.error('Failed to add expense:', error)
      setFormMessage({ type: 'error', text: 'Failed to add expense' })
    }
  }

  const handleStatusChange = async (expenseId: string, newStatus: 'Pending' | 'Paid') => {
    try {
      await expenseService.update(expenseId, { status: newStatus })
      loadExpenses()
      loadSummary()
    } catch (error) {
      console.error('Failed to update expense status:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(expenseId)
        loadExpenses()
        loadSummary()
      } catch (error) {
        console.error('Failed to delete expense:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading expenses...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="mt-2 text-gray-600">Track and manage pharmacy expenses</p>
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
            <span>Managing: <strong>{currentPharmacy.name}</strong></span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 grid gap-3 sm:gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 truncate">Total Expenses</p>
            <p className="mt-1 sm:mt-2 text-lg font-bold text-gray-900 truncate">{formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 truncate">Pending</p>
            <p className="mt-1 sm:mt-2 text-lg font-bold text-yellow-600 truncate">{formatCurrency(summary.pendingAmount)}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 truncate">Paid</p>
            <p className="mt-1 sm:mt-2 text-lg font-bold text-green-600 truncate">{formatCurrency(summary.paidAmount)}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 truncate">Total Records</p>
            <p className="mt-1 sm:mt-2 text-lg font-bold text-blue-600 truncate">{expenses.length}</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this-month">This Month</option>
            <option value="last30days">Last 30 Days</option>
          </select>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          + Add Expense
        </Button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{expense.description}</div>
                      {expense.vendor && <div className="text-xs text-gray-500">{expense.vendor}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <select
                          value={expense.status}
                          onChange={(e) => handleStatusChange(expense.id, e.target.value as Expense['status'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:border-primary-500 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} title={`Add Expense to ${currentPharmacy?.name || 'Pharmacy'}`} onClose={() => { setIsModalOpen(false); setFormMessage(null); }}>
          <form onSubmit={handleAddExpense} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
            {formMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                formMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {formMessage.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Receipt Number</label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" className="flex-1">
                Add Expense
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}