import { getAdminPharmacyOverride, setAdminPharmacyOverride } from './medicineService'
import { getSupabaseClient } from '@lib/supabaseClient'
import { useAuthStore } from '@store/authStore'

// Re-export for convenience
export { setAdminPharmacyOverride, getAdminPharmacyOverride }

export interface Expense {
  id: string
  pharmacyId: string
  category: string
  description: string
  amount: number
  date: string
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Check'
  status: 'Pending' | 'Paid'
  receiptNumber?: string
  vendor?: string
  notes?: string
  createdAt: string
  createdBy?: string
}

export interface ExpenseCategory {
  id: string
  name: string
  description: string
  budget: number
  color: string
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Medicine Purchases', description: 'Buying medicines from suppliers', budget: 50000, color: '#3B82F6' },
  { id: 'cat-2', name: 'Staff Salaries', description: 'Employee salaries and wages', budget: 30000, color: '#10B981' },
  { id: 'cat-3', name: 'Utilities', description: 'Electricity, water, internet', budget: 5000, color: '#F59E0B' },
  { id: 'cat-4', name: 'Rent', description: 'Pharmacy rent payments', budget: 15000, color: '#EF4444' },
  { id: 'cat-5', name: 'Equipment', description: 'Medical equipment and supplies', budget: 10000, color: '#8B5CF6' },
  { id: 'cat-6', name: 'Marketing', description: 'Advertising and promotions', budget: 3000, color: '#EC4899' },
  { id: 'cat-7', name: 'Insurance', description: 'Business insurance premiums', budget: 2000, color: '#6366F1' },
  { id: 'cat-8', name: 'Other', description: 'Miscellaneous expenses', budget: 5000, color: '#6B7280' },
]

// Database interface mapping
interface ExpenseRow {
  id: string
  pharmacy_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  payment_method: string | null
  status: string
  receipt_number: string | null
  vendor: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

const mapExpenseRow = (row: ExpenseRow): Expense => ({
  id: row.id,
  pharmacyId: row.pharmacy_id,
  category: row.category,
  description: row.description,
  amount: Number(row.amount),
  date: row.expense_date,
  paymentMethod: row.payment_method as Expense['paymentMethod'] || undefined,
  status: row.status as Expense['status'],
  receiptNumber: row.receipt_number || undefined,
  vendor: row.vendor || undefined,
  notes: row.notes || undefined,
  createdAt: row.created_at,
  createdBy: row.created_by || undefined,
})

const getCurrentPharmacyId = (): string => {
  const { user, selectedPharmacy } = useAuthStore.getState()
  const pharmacyId = user?.pharmacyId || selectedPharmacy?.id
  if (!pharmacyId) throw new Error('No pharmacy is selected for this account.')
  return pharmacyId
}

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const pharmacyId = getAdminPharmacyOverride() || getCurrentPharmacyId()
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('expense_date', { ascending: false })

    if (error) throw error
    return (data as ExpenseRow[]).map(mapExpenseRow)
  },

  getById: async (id: string): Promise<Expense> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapExpenseRow(data as ExpenseRow)
  },

  create: async (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>): Promise<Expense> => {
    const pharmacyId = getAdminPharmacyOverride() || getCurrentPharmacyId()
    const { user } = useAuthStore.getState()
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        pharmacy_id: pharmacyId,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.date,
        payment_method: expense.paymentMethod || 'Cash',
        status: expense.status,
        receipt_number: expense.receiptNumber || null,
        vendor: expense.vendor || null,
        notes: expense.notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) throw error
    return mapExpenseRow(data as ExpenseRow)
  },

  update: async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    const supabase = getSupabaseClient()

    const updateData: any = {}
    if (expense.category !== undefined) updateData.category = expense.category
    if (expense.description !== undefined) updateData.description = expense.description
    if (expense.amount !== undefined) updateData.amount = expense.amount
    if (expense.date !== undefined) updateData.expense_date = expense.date
    if (expense.paymentMethod !== undefined) updateData.payment_method = expense.paymentMethod
    if (expense.status !== undefined) updateData.status = expense.status
    if (expense.receiptNumber !== undefined) updateData.receipt_number = expense.receiptNumber
    if (expense.vendor !== undefined) updateData.vendor = expense.vendor
    if (expense.notes !== undefined) updateData.notes = expense.notes

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapExpenseRow(data as ExpenseRow)
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  },

  getByDateRange: async (from: string, to: string): Promise<Expense[]> => {
    const pharmacyId = getAdminPharmacyOverride() || getCurrentPharmacyId()
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .gte('expense_date', from)
      .lte('expense_date', to)
      .order('expense_date', { ascending: false })

    if (error) throw error
    return (data as ExpenseRow[]).map(mapExpenseRow)
  },

  getByCategory: async (category: string): Promise<Expense[]> => {
    const pharmacyId = getAdminPharmacyOverride() || getCurrentPharmacyId()
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('category', category)
      .order('expense_date', { ascending: false })

    if (error) throw error
    return (data as ExpenseRow[]).map(mapExpenseRow)
  },

  getSummary: async (from?: string, to?: string): Promise<{
    totalExpenses: number
    pendingAmount: number
    paidAmount: number
    byCategory: Record<string, number>
    byStatus: Record<string, number>
  }> => {
    const pharmacyId = getAdminPharmacyOverride() || getCurrentPharmacyId()
    const supabase = getSupabaseClient()

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('pharmacy_id', pharmacyId)

    if (from && to) {
      query = query.gte('expense_date', from).lte('expense_date', to)
    }

    const { data, error } = await query.order('expense_date', { ascending: false })

    if (error) throw error
    const expenses = (data as ExpenseRow[]).map(mapExpenseRow)

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const pendingAmount = expenses.filter(exp => exp.status === 'Pending').reduce((sum, exp) => sum + exp.amount, 0)
    const paidAmount = expenses.filter(exp => exp.status === 'Paid').reduce((sum, exp) => sum + exp.amount, 0)

    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {} as Record<string, number>)

    const byStatus = expenses.reduce((acc, exp) => {
      if (exp.status === 'Pending' || exp.status === 'Paid') {
        acc[exp.status] = (acc[exp.status] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalExpenses,
      pendingAmount,
      paidAmount,
      byCategory,
      byStatus,
    }
  },
}