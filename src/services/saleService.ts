import { demoSales, delay, demoMedicines } from './mockData'
import { getAdminPharmacyOverride } from './medicineService'
import { useAuthStore } from '@store/authStore'
import { getSupabaseClient } from '@lib/supabaseClient'

const getSalesPharmacyId = (): string | undefined => {
  const { user, selectedPharmacy } = useAuthStore.getState()
  return user?.role === 'Admin'
    ? getAdminPharmacyOverride() || selectedPharmacy?.id
    : user?.pharmacyId || selectedPharmacy?.id
}

export interface Sale {
  id: string
  invoiceNumber: string
  userId: string
  customerId?: string
  saleDate: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: 'Cash' | 'Card' | 'Credit'
  status: 'Completed' | 'Refunded'
  items: SaleItem[]
  createdAt: string
}

export interface SaleItem {
  id: string
  saleId: string
  medicineId: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface CheckoutRequest {
  items: {
    medicineId: string
    quantity: number
    unitPrice: number
  }[]
  invoiceNumber: string
  saleDate: string
  amountReceived: number
  paymentMethod: 'Cash' | 'Card' | 'Credit'
  customerId?: string
}

export interface DailySale {
  date: string
  dateLabel: string
  revenue: number
  revenueLabel: string
  orderCount: number
}

export interface MonthlySale {
  month: string
  monthLabel: string
  revenue: number
  revenueLabel: string
  orderCount: number
}

export interface MedicineSale {
  invoiceNumber: string
  saleId: string
  dateLabel: string
  productName: string
  medicineId: string
  quantity: number
  revenue: number
  revenueLabel: string
}

export interface TopSellingMedicine {
  medicineId: string
  medicineName: string
  genericName?: string
  totalQuantity: number
  totalRevenue: number
  transactions: number
}

export const saleService = {
  getAll: async (): Promise<Sale[]> => {
    const pharmacyId = getSalesPharmacyId()
    if (!pharmacyId) throw new Error('No pharmacy is selected for sales.')

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('sales')
      .select('id, invoice_number, user_id, customer_id, sale_date, subtotal, discount, tax, total, payment_method, status, created_at, sale_items(id, sale_id, medicine_id, quantity, unit_price, line_total)')
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'Completed')
      .order('sale_date', { ascending: false })

    if (error) throw error

    return (data || []).map((sale) => {
      const row = sale as {
        id: string
        invoice_number: string
        user_id: string
        customer_id: string | null
        sale_date: string
        subtotal: number
        discount: number
        tax: number
        total: number
        payment_method: Sale['paymentMethod']
        status: Sale['status']
        created_at: string
        sale_items: Array<{
          id: string
          sale_id: string
          medicine_id: string
          quantity: number
          unit_price: number
          line_total: number
        }>
      }

      return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        userId: row.user_id,
        customerId: row.customer_id || undefined,
        saleDate: row.sale_date,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        tax: Number(row.tax),
        total: Number(row.total),
        paymentMethod: row.payment_method,
        status: row.status,
        items: (row.sale_items || []).map((item) => ({
          id: item.id,
          saleId: item.sale_id,
          medicineId: item.medicine_id,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          lineTotal: Number(item.line_total),
        })),
        createdAt: row.created_at,
      }
    })
  },

  getTopSellingMedicinesReal: async (params: {
    period?: 'today' | 'week' | 'month' | 'all'
    limit?: number
  }): Promise<TopSellingMedicine[]> => {
    const sales = await saleService.getAll()
    const now = new Date()
    const fromDate = params.period === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : params.period === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : params.period === 'month'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : null
    const filteredSales = fromDate
      ? sales.filter((sale) => new Date(sale.saleDate) >= fromDate)
      : sales
    const pharmacyId = getSalesPharmacyId()
    const supabase = getSupabaseClient()
    const { data: inventory, error } = await supabase
      .from('pharmacy_inventory')
      .select('medicine_id, medicine_name, generic_name')
      .eq('pharmacy_id', pharmacyId)
    if (error) throw error

    const medicineMap = new Map((inventory || []).map((medicine) => {
      const row = medicine as { medicine_id: string; medicine_name: string; generic_name: string | null }
      return [row.medicine_id, row] as const
    }))
    const soldMedicineIds = Array.from(new Set(
      filteredSales.flatMap((sale) => sale.items.map((item) => item.medicineId)),
    ))
    const missingMedicineIds = soldMedicineIds.filter((id) => !medicineMap.has(id))

    if (missingMedicineIds.length > 0) {
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('id, medicine_name, generic_name')
        .in('id', missingMedicineIds)

      if (medicinesError) throw medicinesError
      ;(medicines || []).forEach((medicine) => {
        const row = medicine as { id: string; medicine_name: string; generic_name: string | null }
        medicineMap.set(row.id, {
          medicine_id: row.id,
          medicine_name: row.medicine_name,
          generic_name: row.generic_name,
        })
      })
    }
    const totals = new Map<string, TopSellingMedicine>()
    filteredSales.forEach((sale) => sale.items.forEach((item) => {
      const medicine = medicineMap.get(item.medicineId)
      const current = totals.get(item.medicineId) || {
        medicineId: item.medicineId,
        medicineName: medicine?.medicine_name || item.medicineId,
        genericName: medicine?.generic_name || undefined,
        totalQuantity: 0,
        totalRevenue: 0,
        transactions: 0,
      }
      current.totalQuantity += item.quantity
      current.totalRevenue += item.lineTotal
      current.transactions += 1
      totals.set(item.medicineId, current)
    }))
    return Array.from(totals.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, params.limit || 10)
  },

  getTopRevenueMedicinesReal: async (params: {
    period?: 'today' | 'week' | 'month' | 'all'
    limit?: number
  }): Promise<TopSellingMedicine[]> => {
    const results = await saleService.getTopSellingMedicinesReal(params)
    return results.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, params.limit || 10)
  },

  getById: async (id: string): Promise<Sale> => {
    const sale = (await saleService.getAll()).find((entry) => entry.id === id)
    if (!sale) throw new Error('Sale not found')
    return sale
  },

  create: async (sale: CheckoutRequest): Promise<Sale> => {
    const { user, selectedPharmacy } = useAuthStore.getState()
    const pharmacyId = user?.role === 'Admin'
      ? getAdminPharmacyOverride() || selectedPharmacy?.id
      : user?.pharmacyId || selectedPharmacy?.id

    if (!pharmacyId || !user) throw new Error('No pharmacy is selected for this sale.')

    const medicineIds = [...new Set(sale.items.map((item) => item.medicineId))]
    const supabase = getSupabaseClient()
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from('pharmacy_inventory')
      .select('medicine_id, medicine_name, expiry_date')
      .eq('pharmacy_id', pharmacyId)
      .in('medicine_id', medicineIds)

    if (inventoryError) throw inventoryError

    const expiredMedicine = (inventoryRows || []).find((item) => (
      item.expiry_date && new Date(item.expiry_date) < new Date()
    ))
    if (expiredMedicine) {
      throw new Error(`Cannot sell expired medicine: ${expiredMedicine.medicine_name}`)
    }

    const subtotal = sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const { data: saleRow, error: saleError } = await supabase
      .from('sales')
      .insert({
        invoice_number: sale.invoiceNumber,
        user_id: user.id,
        customer_id: sale.customerId || null,
        pharmacy_id: pharmacyId,
        sale_date: sale.saleDate,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        payment_method: sale.paymentMethod,
        status: 'Completed',
      })
      .select('id, invoice_number, user_id, customer_id, sale_date, subtotal, discount, tax, total, payment_method, status, created_at')
      .single()

    if (saleError) throw saleError

    const saleItems = sale.items.map((item) => ({
      sale_id: saleRow.id,
      medicine_id: item.medicineId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
    }))
    const { data: itemRows, error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)
      .select('id, sale_id, medicine_id, quantity, unit_price, line_total')

    if (itemsError) throw itemsError

    // Update inventory quantities for each sold item
    for (const item of sale.items) {
      try {
        // Get current quantity - try both by medicine_id and by matching medicine name
        let currentInventory: { quantity: number; medicine_id: string; medicine_name?: string } | null = null
        
        // First try by medicine_id
        const result = await supabase
          .from('pharmacy_inventory')
          .select('quantity, medicine_name, medicine_id')
          .eq('medicine_id', item.medicineId)
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle()
        
        currentInventory = result.data as { quantity: number; medicine_id: string; medicine_name?: string } | null

        // If not found by ID, try to find by medicine name (for allocated medicines)
        if (!currentInventory) {
          // Get the medicine name from the medicines table using the medicine_id
          const { data: medicineData } = await supabase
            .from('medicines')
            .select('medicine_name')
            .eq('id', item.medicineId)
            .maybeSingle()
          
          if (medicineData?.medicine_name) {
            const { data: inventoryByName } = await supabase
              .from('pharmacy_inventory')
              .select('quantity, medicine_id')
              .eq('medicine_name', medicineData.medicine_name)
              .eq('pharmacy_id', pharmacyId)
              .maybeSingle()
            
            if (inventoryByName) {
              currentInventory = inventoryByName as { quantity: number; medicine_id: string; medicine_name?: string }
            }
          }
        }

        if (!currentInventory) {
          // Create the pharmacy_inventory entry to allow sale to proceed (data correction)
          const { data: medicineDetails } = await supabase
            .from('medicines')
            .select('medicine_name, generic_name, barcode, manufacturer')
            .eq('id', item.medicineId)
            .maybeSingle()
          
          if (medicineDetails) {
            const { error: insertError } = await supabase
              .from('pharmacy_inventory')
              .insert({
                medicine_id: item.medicineId,
                pharmacy_id: pharmacyId,
                barcode: medicineDetails.barcode || `INV-${item.medicineId}`,
                medicine_name: medicineDetails.medicine_name,
                generic_name: medicineDetails.generic_name || null,
                category: 'General',
                manufacturer: medicineDetails.manufacturer || null,
                supplier: 'Data Correction',
                batch_number: null,
                expiry_date: null,
                manufacturing_date: null,
                dosage_form: 'Tablet',
                strength: null,
                unit: 'Box',
                purchase_price: item.unitPrice * 0.7,
                selling_price: item.unitPrice,
                tax_rate: 0.15,
                quantity: item.quantity,
                reorder_level: 10,
                prescription_required: false,
                status: 'Available',
                is_active: true,
                created_at: new Date().toISOString(),
              })
            
            if (insertError) {
              console.error(`Failed to create inventory entry for medicine ${item.medicineId}:`, insertError)
              continue
            }
            
            // Set currentInventory to the newly created entry
            currentInventory = {
              quantity: item.quantity,
              medicine_id: item.medicineId
            }
          } else {
            console.error(`Could not find medicine details for ${item.medicineId}`)
            continue
          }
        }

        const currentQuantity = currentInventory?.quantity || 0
        // If we just created the inventory entry with the sold quantity, set it to 0
        // Otherwise, subtract the sold quantity from current inventory
        const newQuantity = currentQuantity === item.quantity ? 0 : Math.max(0, currentQuantity - item.quantity)

        // Update with new quantity - use the correct medicine_id from the inventory record
        const medicineIdToUpdate = currentInventory.medicine_id || item.medicineId
        const { error: updateError } = await supabase
          .from('pharmacy_inventory')
          .update({ quantity: newQuantity })
          .eq('medicine_id', medicineIdToUpdate)
          .eq('pharmacy_id', pharmacyId)

        if (updateError) {
          console.error(`Failed to update inventory for medicine ${item.medicineId}:`, updateError)
        }
      } catch (error) {
        console.error(`Error processing inventory update for medicine ${item.medicineId}:`, error)
      }
    }

    return {
      id: saleRow.id,
      invoiceNumber: saleRow.invoice_number,
      userId: saleRow.user_id,
      customerId: saleRow.customer_id || undefined,
      saleDate: saleRow.sale_date,
      subtotal: Number(saleRow.subtotal),
      discount: Number(saleRow.discount),
      tax: Number(saleRow.tax),
      total: Number(saleRow.total),
      paymentMethod: saleRow.payment_method,
      status: saleRow.status,
      items: (itemRows || []).map((item) => ({
        id: item.id,
        saleId: item.sale_id,
        medicineId: item.medicine_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total),
      })),
      createdAt: saleRow.created_at,
    }
  },

  update: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const pharmacyId = getSalesPharmacyId()
    if (!pharmacyId) throw new Error('No pharmacy is selected for sales.')

    const supabase = getSupabaseClient()

    // Update the main sale record
    const { data: saleRow, error: saleError } = await supabase
      .from('sales')
      .update({
        payment_method: sale.paymentMethod,
        status: sale.status,
        subtotal: sale.subtotal,
        total: sale.total,
        tax: sale.tax,
        discount: sale.discount,
      })
      .eq('id', id)
      .eq('pharmacy_id', pharmacyId)
      .select('id, invoice_number, user_id, customer_id, sale_date, subtotal, discount, tax, total, payment_method, status, created_at')
      .single()

    if (saleError) throw saleError

    // Update sale items if provided
    if (sale.items) {
      await Promise.all(sale.items.map(async (item) => {
        const { error: itemError } = await supabase
          .from('sale_items')
          .update({
            medicine_id: item.medicineId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.unitPrice * item.quantity,
          })
          .eq('id', item.id)
          .eq('sale_id', id)

        if (itemError) throw itemError
      }))

      const { data: itemRows, error: itemsError } = await supabase
        .from('sale_items')
        .select('id, sale_id, medicine_id, quantity, unit_price, line_total')
        .eq('sale_id', id)

      if (itemsError) throw itemsError

      return {
        id: saleRow.id,
        invoiceNumber: saleRow.invoice_number,
        userId: saleRow.user_id,
        customerId: saleRow.customer_id || undefined,
        saleDate: saleRow.sale_date,
        subtotal: Number(saleRow.subtotal),
        discount: Number(saleRow.discount),
        tax: Number(saleRow.tax),
        total: Number(saleRow.total),
        paymentMethod: saleRow.payment_method,
        status: saleRow.status,
        items: (itemRows || []).map((item) => ({
          id: item.id,
          saleId: item.sale_id,
          medicineId: item.medicine_id,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          lineTotal: Number(item.line_total),
        })),
        createdAt: saleRow.created_at,
      }
    }

    // If no items updated, fetch existing items
    const { data: existingItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('id, sale_id, medicine_id, quantity, unit_price, line_total')
      .eq('sale_id', id)

    if (itemsError) throw itemsError

    return {
      id: saleRow.id,
      invoiceNumber: saleRow.invoice_number,
      userId: saleRow.user_id,
      customerId: saleRow.customer_id || undefined,
      saleDate: saleRow.sale_date,
      subtotal: Number(saleRow.subtotal),
      discount: Number(saleRow.discount),
      tax: Number(saleRow.tax),
      total: Number(saleRow.total),
      paymentMethod: saleRow.payment_method,
      status: saleRow.status,
      items: (existingItems || []).map((item) => ({
        id: item.id,
        saleId: item.sale_id,
        medicineId: item.medicine_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        lineTotal: Number(item.line_total),
      })),
      createdAt: saleRow.created_at,
    }
  },

  delete: async (id: string): Promise<void> => {
    await delay(200)
    const index = demoSales.findIndex((s) => s.id === id)
    if (index !== -1) {
      demoSales.splice(index, 1)
    }
  },

  getSalesByDateRange: async (from: string, to: string): Promise<Sale[]> => {
    const sales = await saleService.getAll()
    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    return sales.filter((sale) => new Date(sale.saleDate) >= fromDate && new Date(sale.saleDate) <= toDate)
  },

  getDailySales: async (from?: string, to?: string): Promise<DailySale[]> => {
    const filteredSales = from && to ? await saleService.getSalesByDateRange(from, to) : await saleService.getAll()

    // Group by date
    const dailyMap = new Map<string, { revenue: number; orderCount: number }>()
    
    filteredSales.forEach((sale) => {
      const date = new Date(sale.saleDate).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { revenue: 0, orderCount: 0 }
      dailyMap.set(date, {
        revenue: existing.revenue + sale.total,
        orderCount: existing.orderCount + 1,
      })
    })

    // Convert to array and sort by date
    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: data.revenue,
        revenueLabel: `K${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  getMonthlySales: async (from?: string, to?: string): Promise<MonthlySale[]> => {
    const filteredSales = from && to ? await saleService.getSalesByDateRange(from, to) : await saleService.getAll()

    // Group by month
    const monthlyMap = new Map<string, { revenue: number; orderCount: number }>()
    
    filteredSales.forEach((sale) => {
      const date = new Date(sale.saleDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyMap.get(monthKey) || { revenue: 0, orderCount: 0 }
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + sale.total,
        orderCount: existing.orderCount + 1,
      })
    })

    // Convert to array and sort by month
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-')
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        return {
          month,
          monthLabel: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          revenue: data.revenue,
          revenueLabel: `K${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          orderCount: data.orderCount,
        }
      })
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
  },

  getSalesByMedicine: async (from?: string, to?: string): Promise<MedicineSale[]> => {
    const filteredSales = from && to ? await saleService.getSalesByDateRange(from, to) : await saleService.getAll()
    const pharmacyId = getSalesPharmacyId()
    const { data: inventory, error } = await getSupabaseClient()
      .from('pharmacy_inventory')
      .select('medicine_id, medicine_name')
      .eq('pharmacy_id', pharmacyId)
    if (error) throw error
    const medicineNames = new Map((inventory || []).map((row) => {
      const item = row as { medicine_id: string; medicine_name: string }
      return [item.medicine_id, item.medicine_name] as const
    }))

    const medicineSales: MedicineSale[] = []

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productName = medicineNames.get(item.medicineId) || item.medicineId
        
        medicineSales.push({
          invoiceNumber: sale.invoiceNumber,
          saleId: sale.id,
          dateLabel: new Date(sale.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          productName,
          medicineId: item.medicineId,
          quantity: item.quantity,
          revenue: item.lineTotal,
          revenueLabel: `K${item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        })
      })
    })

    return medicineSales.sort((a, b) => new Date(b.saleId).getTime() - new Date(a.saleId).getTime())
  },

  getSalesReport: async (params: {
    from?: string
    to?: string
    paymentMethod?: string
    status?: string
  }): Promise<{
    totalSales: number
    totalRevenue: number
    averageTransaction: number
    salesByPaymentMethod: Record<string, number>
    salesByStatus: Record<string, number>
    sales: Sale[]
  }> => {
    await delay(400)
    let filteredSales = demoSales

    if (params.from && params.to) {
      const fromDate = new Date(params.from)
      const toDate = new Date(params.to)
      toDate.setHours(23, 59, 59, 999)
      filteredSales = filteredSales.filter((sale) => {
        const saleDate = new Date(sale.saleDate)
        return saleDate >= fromDate && saleDate <= toDate
      })
    }

    if (params.paymentMethod) {
      filteredSales = filteredSales.filter((s) => s.paymentMethod === params.paymentMethod)
    }

    if (params.status) {
      filteredSales = filteredSales.filter((s) => s.status === params.status)
    }

    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const averageTransaction = totalSales > 0 ? totalRevenue / totalSales : 0

    const salesByPaymentMethod = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const salesByStatus = filteredSales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalSales,
      totalRevenue,
      averageTransaction,
      salesByPaymentMethod,
      salesByStatus,
      sales: filteredSales,
    }
  },

  getTopSellingMedicines: async (params: {
    period?: 'today' | 'week' | 'month' | 'all'
    limit?: number
  }): Promise<TopSellingMedicine[]> => {
    await delay(300)
    let filteredSales = demoSales

    // Filter by time period
    if (params.period && params.period !== 'all') {
      const now = new Date()
      let fromDate: Date | null = null

      if (params.period === 'today') {
        fromDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (params.period === 'week') {
        fromDate = new Date(now.setDate(now.getDate() - 7))
      } else if (params.period === 'month') {
        fromDate = new Date(now.setDate(now.getDate() - 30))
      }

      if (fromDate) {
        filteredSales = filteredSales.filter((sale) => {
          const saleDate = new Date(sale.saleDate)
          return saleDate >= fromDate
        })
      }
    }

    // Aggregate medicine sales
    const medicineMap = new Map<string, {
      medicineId: string
      medicineName: string
      genericName?: string
      totalQuantity: number
      totalRevenue: number
      transactions: number
    }>()

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const medicine = demoMedicines.find((m) => m.id === item.medicineId)
        const medicineName = medicine?.medicineName || 'Unknown Medicine'
        const genericName = medicine?.genericName

        const existing = medicineMap.get(item.medicineId) || {
          medicineId: item.medicineId,
          medicineName,
          genericName,
          totalQuantity: 0,
          totalRevenue: 0,
          transactions: 0,
        }

        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.lineTotal
        existing.transactions += 1

        medicineMap.set(item.medicineId, existing)
      })
    })

    // Convert to array and sort by quantity (default)
    const topMedicines = Array.from(medicineMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, params.limit || 10)

    return topMedicines
  },

  getTopRevenueMedicines: async (params: {
    period?: 'today' | 'week' | 'month' | 'all'
    limit?: number
  }): Promise<TopSellingMedicine[]> => {
    await delay(300)
    let filteredSales = demoSales

    // Filter by time period
    if (params.period && params.period !== 'all') {
      const now = new Date()
      let fromDate: Date | null = null

      if (params.period === 'today') {
        fromDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (params.period === 'week') {
        fromDate = new Date(now.setDate(now.getDate() - 7))
      } else if (params.period === 'month') {
        fromDate = new Date(now.setDate(now.getDate() - 30))
      }

      if (fromDate) {
        filteredSales = filteredSales.filter((sale) => {
          const saleDate = new Date(sale.saleDate)
          return saleDate >= fromDate
        })
      }
    }

    // Aggregate medicine sales
    const medicineMap = new Map<string, {
      medicineId: string
      medicineName: string
      genericName?: string
      totalQuantity: number
      totalRevenue: number
      transactions: number
    }>()

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const medicine = demoMedicines.find((m) => m.id === item.medicineId)
        const medicineName = medicine?.medicineName || 'Unknown Medicine'
        const genericName = medicine?.genericName

        const existing = medicineMap.get(item.medicineId) || {
          medicineId: item.medicineId,
          medicineName,
          genericName,
          totalQuantity: 0,
          totalRevenue: 0,
          transactions: 0,
        }

        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.lineTotal
        existing.transactions += 1

        medicineMap.set(item.medicineId, existing)
      })
    })

    // Convert to array and sort by revenue
    const topMedicines = Array.from(medicineMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, params.limit || 10)

    return topMedicines
  },

  clearSales: async (): Promise<void> => {
    const supabase = getSupabaseClient()
    
    console.log('Starting sales clear operation...')
    
    // Delete all sale items first
    const { error: itemsError, count: itemsCount } = await supabase
      .from('sale_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted sale items:', itemsCount, 'Error:', itemsError)
    
    if (itemsError) throw itemsError
    
    // Delete all sales
    const { error: salesError, count: salesCount } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted sales:', salesCount, 'Error:', salesError)
    
    if (salesError) throw salesError

    // Also clear expenses if they exist (related to financial records)
    const { error: expensesError, count: expensesCount } = await supabase
      .from('expenses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted expenses:', expensesCount, 'Error:', expensesError)
    
    // Ignore error if expenses table doesn't exist
    if (expensesError && expensesError.code !== 'PGRST116') {
      console.warn('Error clearing expenses (table may not exist):', expensesError)
    }
    
    console.log('Sales clear operation completed successfully')
  },
}
