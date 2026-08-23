import { PHARMACIES } from '@config/pharmacyConfig'
import { getSupabaseClient } from '@lib/supabaseClient'

export interface ProfitLossStatement {
  pharmacyId: string
  pharmacyName: string
  period: { from: string; to: string }
  revenue: { totalSales: number; totalRevenue: number; averageTransaction: number; totalOrders: number }
  expenses: { totalExpenses: number; byCategory: Record<string, number>; breakdown: ExpenseBreakdown[] }
  profitLoss: { grossProfit: number; netProfit: number; profitMargin: number; roi: number }
  performance: { comparedToPrevious: number; trend: 'up' | 'down' | 'stable' }
}

export interface ExpenseBreakdown {
  category: string
  amount: number
  percentage: number
  budget: number
  variance: number
}

export interface ProfitLossSummary {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  overallMargin: number
  bestPerformingPharmacy: string
  worstPerformingPharmacy: string
  pharmacyCount: number
}

interface SaleRow {
  total: number
  sale_date: string
  status: string
  sale_items: Array<{ medicine_id: string; quantity: number; unit_price: number; line_total: number }>
}
interface ExpenseRow { category: string; amount: number; expense_date: string; status: string }
interface InventoryRow { medicine_id: string; category: string | null; purchase_price: number }

const getRows = async (pharmacyId: string, from: string, to: string) => {
  const supabase = getSupabaseClient()
  const end = new Date(`${to}T23:59:59.999Z`).toISOString()
  const [{ data: sales, error: salesError }, { data: expenses, error: expensesError }, { data: inventory, error: inventoryError }] = await Promise.all([
    supabase.from('sales').select('total, sale_date, status, sale_items(medicine_id, quantity, unit_price, line_total)').eq('pharmacy_id', pharmacyId).eq('status', 'Completed').gte('sale_date', `${from}T00:00:00.000Z`).lte('sale_date', end),
    supabase.from('expenses').select('category, amount, expense_date, status').eq('pharmacy_id', pharmacyId).eq('status', 'Paid').gte('expense_date', from).lte('expense_date', to),
    supabase.from('pharmacy_inventory').select('medicine_id, category, purchase_price').eq('pharmacy_id', pharmacyId),
  ])
  if (salesError) throw salesError
  if (expensesError) throw expensesError
  if (inventoryError) throw inventoryError
  return {
    sales: (sales || []) as SaleRow[],
    expenses: (expenses || []) as ExpenseRow[],
    inventory: (inventory || []) as InventoryRow[],
  }
}

const buildStatement = async (pharmacyId: string, from: string, to: string): Promise<ProfitLossStatement> => {
  const pharmacy = PHARMACIES.find((item) => item.id === pharmacyId)
  if (!pharmacy) throw new Error('Pharmacy not found')
  const { sales, expenses, inventory } = await getRows(pharmacyId, from, to)
  const inventoryByMedicine = new Map(inventory.map((item) => [item.medicine_id, item]))
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const costOfGoods = sales.reduce((sum, sale) => sum + sale.sale_items.reduce((itemSum, item) => {
    const purchasePrice = Number(inventoryByMedicine.get(item.medicine_id)?.purchase_price || 0)
    return itemSum + purchasePrice * Number(item.quantity || 0)
  }, 0), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const byCategory = expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0)
    return result
  }, {} as Record<string, number>)
  const breakdown = Object.entries(byCategory).map(([category, amount]) => ({
    category, amount, percentage: totalExpenses ? amount / totalExpenses * 100 : 0, budget: 0, variance: -amount,
  }))
  const grossProfit = totalRevenue - costOfGoods
  const netProfit = grossProfit - totalExpenses
  return {
    pharmacyId,
    pharmacyName: pharmacy.name,
    period: { from, to },
    revenue: { totalSales: sales.length, totalRevenue, averageTransaction: sales.length ? totalRevenue / sales.length : 0, totalOrders: sales.length },
    expenses: { totalExpenses, byCategory, breakdown },
    profitLoss: { grossProfit, netProfit, profitMargin: totalRevenue ? netProfit / totalRevenue * 100 : 0, roi: totalExpenses ? netProfit / totalExpenses * 100 : 0 },
    performance: { comparedToPrevious: 0, trend: 'stable' },
  }
}

export const profitLossService = {
  getProfitLossStatement: buildStatement,

  getAllPharmaciesProfitLoss: async (from: string, to: string) => {
    const statements = await Promise.all(PHARMACIES.map(async (pharmacy) => {
      try { return await buildStatement(pharmacy.id, from, to) } catch (error) { console.error(`Failed to load P&L for ${pharmacy.name}:`, error); return null }
    }))
    return statements.filter((statement): statement is ProfitLossStatement => statement !== null)
  },

  getProfitLossSummary: async (from: string, to: string): Promise<ProfitLossSummary> => {
    const statements = await profitLossService.getAllPharmaciesProfitLoss(from, to)
    const totalRevenue = statements.reduce((sum, statement) => sum + statement.revenue.totalRevenue, 0)
    const totalExpenses = statements.reduce((sum, statement) => sum + statement.expenses.totalExpenses, 0)
    const sorted = [...statements].sort((a, b) => b.revenue.totalRevenue - a.revenue.totalRevenue)
    const hasRevenue = sorted.some((statement) => statement.revenue.totalRevenue > 0)
    return {
      totalRevenue, totalExpenses, totalProfit: totalRevenue - totalExpenses,
      overallMargin: totalRevenue ? (totalRevenue - totalExpenses) / totalRevenue * 100 : 0,
      bestPerformingPharmacy: hasRevenue ? sorted[0]?.pharmacyName || 'N/A' : 'N/A',
      worstPerformingPharmacy: hasRevenue ? sorted[sorted.length - 1]?.pharmacyName || 'N/A' : 'N/A',
      pharmacyCount: statements.length,
    }
  },

  getMonthlyTrends: async (pharmacyId: string, months = 6) => {
    const today = new Date()
    const trends = []
    for (let index = months - 1; index >= 0; index -= 1) {
      const month = new Date(today.getFullYear(), today.getMonth() - index, 1)
      const from = month.toISOString().split('T')[0]
      const to = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0]
      const statement = await buildStatement(pharmacyId, from, to)
      trends.push({ month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), revenue: statement.revenue.totalRevenue, expenses: statement.expenses.totalExpenses, profit: statement.profitLoss.netProfit, margin: statement.profitLoss.profitMargin })
    }
    return trends
  },

  getCategoryPerformance: async (pharmacyId: string, from: string, to: string) => {
    const { sales, expenses, inventory } = await getRows(pharmacyId, from, to)
    const inventoryByMedicine = new Map(inventory.map((item) => [item.medicine_id, item]))
    const categories = new Map<string, { revenue: number; cost: number; itemsSold: number }>()

    sales.forEach((sale) => sale.sale_items.forEach((item) => {
      const category = inventoryByMedicine.get(item.medicine_id)?.category || 'General'
      const current = categories.get(category) || { revenue: 0, cost: 0, itemsSold: 0 }
      current.revenue += Number(item.line_total || item.unit_price * item.quantity || 0)
      current.cost += Number(inventoryByMedicine.get(item.medicine_id)?.purchase_price || 0) * Number(item.quantity || 0)
      current.itemsSold += Number(item.quantity || 0)
      categories.set(category, current)
    }))

    const expensesByCategory = expenses.reduce((result, expense) => {
      result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0)
      return result
    }, {} as Record<string, number>)

    return Array.from(categories.entries()).map(([category, values]) => {
      const categoryExpenses = expensesByCategory[category] || 0
      const profit = values.revenue - values.cost - categoryExpenses
      return {
        category,
        revenue: values.revenue,
        expenses: values.cost + categoryExpenses,
        profit,
        margin: values.revenue ? profit / values.revenue * 100 : 0,
        itemsSold: values.itemsSold,
      }
    })
  },
}
