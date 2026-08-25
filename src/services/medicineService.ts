import { demoDashboardSummary, delay } from './mockData'
import { useAuthStore } from '@store/authStore'
import { getPharmacyInventory } from './pharmacyInventoryData'
import { getSupabaseClient } from '@lib/supabaseClient'
import { warehouseService } from './warehouseService'

// Admin pharmacy override for viewing other pharmacies' data
let adminPharmacyOverride: string | null = null

export const setAdminPharmacyOverride = (pharmacyId: string | null) => {
  adminPharmacyOverride = pharmacyId
}

export const getAdminPharmacyOverride = () => adminPharmacyOverride

export interface Medicine {
  id: string
  barcode: string
  medicineName: string
  genericName?: string
  category?: string
  manufacturer?: string
  supplier?: string
  batchNumber?: string
  expiryDate?: string
  manufacturingDate?: string
  dosageForm?: string
  strength?: string
  unit?: string
  purchasePrice: number
  sellingPrice: number
  taxRate: number
  quantity: number
  reorderLevel: number
  prescriptionRequired: boolean
  status: 'Available' | 'Discontinued'
  isActive: boolean
  pharmacyId?: string // Add pharmacy ID for pharmacy-specific inventory
  createdAt: string
  pendingAllocation?: number // Track pending warehouse allocations for display
  allocationStatus?: string // Track the status of the allocation (Pending, Approved, Completed)
}

export interface InventoryItem {
  id: string
  medicineId: string
  quantityOnHand: number
  reservedQuantity: number
  expiryDate?: string
  batchNumber: string
  unitCost: number
  location: string
  medicine?: Medicine
}

export interface DashboardSummary {
  totalMedicines: number
  lowStockCount: number
  categoriesCount: number
  suppliersCount: number
  totalSalesToday: number
  totalUnitsSold: number
  revenueToday: number
}

interface PharmacyInventoryRow {
  medicine_id: string
  barcode: string
  medicine_name: string
  generic_name: string | null
  category: string | null
  manufacturer: string | null
  supplier: string | null
  batch_number: string | null
  expiry_date: string | null
  manufacturing_date: string | null
  dosage_form: string | null
  strength: string | null
  unit: string | null
  purchase_price: number | null
  selling_price: number | null
  tax_rate: number | null
  quantity: number
  reorder_level: number
  prescription_required: boolean
  status: 'Available' | 'Discontinued'
  is_active: boolean
  pharmacy_id: string
  created_at: string
}

const getCurrentPharmacyId = (): string => {
  const { user, selectedPharmacy } = useAuthStore.getState()
  const pharmacyId = user?.pharmacyId || selectedPharmacy?.id
  if (!pharmacyId) throw new Error('No pharmacy is selected for this account.')
  return pharmacyId
}

const getEffectivePharmacyId = (): string => {
  const { user } = useAuthStore.getState()
  return user?.role === 'Admin' && adminPharmacyOverride
    ? adminPharmacyOverride
    : getCurrentPharmacyId()
}

const mapInventoryRow = (row: PharmacyInventoryRow): Medicine => ({
  id: row.medicine_id,
  barcode: row.barcode,
  medicineName: row.medicine_name,
  genericName: row.generic_name || undefined,
  category: row.category || undefined,
  manufacturer: row.manufacturer || undefined,
  supplier: row.supplier || undefined,
  batchNumber: row.batch_number || undefined,
  expiryDate: row.expiry_date || undefined,
  manufacturingDate: row.manufacturing_date || undefined,
  dosageForm: row.dosage_form || undefined,
  strength: row.strength || undefined,
  unit: row.unit || undefined,
  purchasePrice: Number(row.purchase_price || 0),
  sellingPrice: Number(row.selling_price || 0),
  taxRate: Number(row.tax_rate || 0),
  quantity: row.quantity,
  reorderLevel: row.reorder_level,
  prescriptionRequired: row.prescription_required,
  status: row.status,
  isActive: row.is_active,
  pharmacyId: row.pharmacy_id,
  createdAt: row.created_at,
})

export const medicineService = {
  getAll: async (): Promise<Medicine[]> => {
    const pharmacyId = getEffectivePharmacyId()
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('medicine_name')

    if (error) throw error
    const pharmacyInventory = (data as PharmacyInventoryRow[]).map(mapInventoryRow)
    
    // Add allocations as informational data (display only)
    // This includes both pending/approved allocations and completed ones that might not be in pharmacy_inventory yet
    try {
      const allocations = await warehouseService.getAllocationsByPharmacy(pharmacyId)
      const activeAllocations = allocations.filter(alloc => alloc.status === 'Pending' || alloc.status === 'Approved' || alloc.status === 'Completed')
      
      activeAllocations.forEach(allocation => {
        // Try to match by medicine ID first, then by name as fallback
        const existingMedicine = pharmacyInventory.find((medicine) => 
          medicine.id === allocation.medicineId ||
          medicine.medicineName.trim().toLowerCase() === allocation.medicineName.trim().toLowerCase()
        )
        
        if (existingMedicine) {
          // For pending/approved allocations, show as pending
          if (allocation.status === 'Pending' || allocation.status === 'Approved') {
            (existingMedicine as any).pendingAllocation = allocation.quantity
          }
          // For completed allocations, the quantity should already be in the database
          // But if it's not showing up, this indicates a data issue
        } else {
          // Only add completed allocations that aren't in pharmacy_inventory
          // These represent data integrity issues where allocations were completed but not properly added to inventory
          if (allocation.status === 'Completed') {
            console.warn(`Completed allocation ${allocation.id} for medicine ${allocation.medicineName} not found in pharmacy_inventory. This is a data integrity issue - the allocation should have been added to pharmacy_inventory when completed.`)
            // Add it temporarily so it can be sold, but this should be fixed in the warehouse allocation completion logic
            pharmacyInventory.push({
              id: allocation.medicineId || `alloc-${allocation.id}`,
              barcode: allocation.batchNumber || `ALLOC-${allocation.id}`,
              medicineName: allocation.medicineName,
              genericName: '',
              category: 'General',
              manufacturer: '',
              supplier: 'Warehouse',
              batchNumber: allocation.batchNumber || '',
              expiryDate: allocation.expiryDate || '',
              manufacturingDate: '',
              dosageForm: 'Tablet',
              strength: '',
              unit: 'Box',
              purchasePrice: allocation.purchasePrice || 0,
              sellingPrice: allocation.sellingPrice || 0,
              taxRate: 0.15,
              quantity: allocation.quantity, // Use the allocated quantity
              reorderLevel: 10,
              prescriptionRequired: false,
              status: 'Available',
              isActive: true,
              pharmacyId,
              createdAt: allocation.createdAt,
              allocationStatus: allocation.status,
            } as Medicine & { allocationStatus?: string })
          }
          // Don't add pending/approved allocations that aren't in inventory - they shouldn't be sellable yet
        }
      })
    } catch (error) {
      console.error('Failed to load allocations:', error)
    }
    
    return pharmacyInventory
  },

  getById: async (id: string): Promise<Medicine> => {
    const pharmacyId = getEffectivePharmacyId()
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('medicine_id', id)
      .eq('pharmacy_id', pharmacyId)
      .single()

    if (error) throw error
    return mapInventoryRow(data as PharmacyInventoryRow)
  },

  search: async (query: string): Promise<Medicine[]> => {
    const q = query.trim().toLowerCase()
    const inventory = await medicineService.getAll()

    return inventory
      .filter((medicine) => (
        medicine.medicineName.toLowerCase().includes(q) ||
        (medicine.genericName || '').toLowerCase().includes(q) ||
        (medicine.category || '').toLowerCase().includes(q) ||
        medicine.barcode.toLowerCase().includes(q)
      ))
      .sort((firstMedicine, secondMedicine) => firstMedicine.medicineName.localeCompare(secondMedicine.medicineName))
  },

  create: async (medicine: Partial<Medicine>): Promise<Medicine> => {
    await delay(200)
    const pharmacyId = getEffectivePharmacyId()
    const newMedicine: Medicine = {
      id: `m-${Date.now()}`,
      barcode: medicine.barcode || 'NEW-BARCODE',
      medicineName: medicine.medicineName || 'New Medicine',
      genericName: medicine.genericName || 'Generic',
      category: medicine.category || 'General',
      manufacturer: medicine.manufacturer || 'Demo Manufacturer',
      supplier: medicine.supplier || 'Demo Supplier',
      batchNumber: medicine.batchNumber || `B-${Date.now()}`,
      expiryDate: medicine.expiryDate || '2028-01-01',
      manufacturingDate: medicine.manufacturingDate || '2026-01-01',
      dosageForm: medicine.dosageForm || 'Tablet',
      strength: medicine.strength || '500mg',
      unit: medicine.unit || 'Box',
      purchasePrice: medicine.purchasePrice || 0,
      sellingPrice: medicine.sellingPrice || 0,
      taxRate: medicine.taxRate || 0.15,
      quantity: medicine.quantity || 0,
      reorderLevel: medicine.reorderLevel || 10,
      prescriptionRequired: Boolean(medicine.prescriptionRequired),
      status: medicine.status || 'Available',
      isActive: medicine.isActive ?? true,
      pharmacyId: pharmacyId !== 'default' ? pharmacyId : undefined,
      createdAt: new Date().toISOString(),
    }
    return newMedicine
  },

  update: async (id: string, medicine: Partial<Medicine>): Promise<Medicine> => {
    await delay(200)
    const pharmacyId = getEffectivePharmacyId()
    const pharmacyInventory = pharmacyId && pharmacyId !== 'default'
      ? getPharmacyInventory(pharmacyId)
      : getPharmacyInventory('default')
    const current = pharmacyInventory.find((item) => item.id === id) || pharmacyInventory[0]
    return { ...current, ...medicine, id }
  },

  delete: async (id: string): Promise<void> => {
    const { user } = useAuthStore.getState()
    if (user?.role !== 'Admin') {
      throw new Error('Only administrators can delete inventory medicines.')
    }

    const pharmacyId = getEffectivePharmacyId()
    const supabase = getSupabaseClient()

    const { data: warehouseItems, error: warehouseItemsError } = await supabase
      .from('warehouse_items')
      .select('id')
      .eq('medicine_id', id)

    if (warehouseItemsError) throw warehouseItemsError

    for (const warehouseItem of warehouseItems || []) {
      await warehouseService.deleteItem(warehouseItem.id)
    }

    const { error } = await supabase
      .from('pharmacy_inventory')
      .delete()
      .eq('medicine_id', id)
      .eq('pharmacy_id', pharmacyId)

    if (error) throw error
  },
}

export const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    const pharmacyInventory = await medicineService.getAll()

    return pharmacyInventory.map((medicine) => ({
      id: `inv-${medicine.id}`,
      medicineId: medicine.id,
      quantityOnHand: medicine.quantity,
      reservedQuantity: 0,
      expiryDate: medicine.expiryDate,
      batchNumber: medicine.batchNumber || 'Unassigned',
      unitCost: medicine.purchasePrice,
      location: 'Main',
      medicine,
    }))
  },

  getSummary: async (): Promise<DashboardSummary> => {
    const pharmacyInventory = await medicineService.getAll()
    
    // Calculate pharmacy-specific summary
    const totalMedicines = pharmacyInventory.length
    const lowStockCount = pharmacyInventory.filter((item) => item.quantity <= item.reorderLevel).length
    const categoriesCount = new Set(pharmacyInventory.map((m) => m.category)).size
    const suppliersCount = new Set(pharmacyInventory.map((m) => m.supplier)).size
    
    return {
      totalMedicines,
      lowStockCount,
      categoriesCount,
      suppliersCount,
      totalSalesToday: demoDashboardSummary.totalSalesToday,
      totalUnitsSold: 0,
      revenueToday: demoDashboardSummary.revenueToday,
    }
  },

  addStock: async (id: string, quantity: number): Promise<void> => {
    const pharmacyId = getEffectivePharmacyId()
    const supabase = getSupabaseClient()
    
    // Get current quantity
    const { data: currentInventory, error: fetchError } = await supabase
      .from('pharmacy_inventory')
      .select('quantity')
      .eq('medicine_id', id)
      .eq('pharmacy_id', pharmacyId)
      .single()

    if (fetchError) throw fetchError

    const currentQuantity = currentInventory?.quantity || 0
    const newQuantity = currentQuantity + quantity

    // Update with new quantity
    const { error: updateError } = await supabase
      .from('pharmacy_inventory')
      .update({ quantity: newQuantity })
      .eq('medicine_id', id)
      .eq('pharmacy_id', pharmacyId)

    if (updateError) throw updateError
  },

  updateQuantity: async (id: string, quantity: number): Promise<void> => {
    const { user } = useAuthStore.getState()
    if (user?.role !== 'Admin') {
      throw new Error('Only administrators can update inventory.')
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error('Inventory quantity must be a whole number of zero or more.')
    }

    const pharmacyId = getEffectivePharmacyId()
    const { error } = await getSupabaseClient()
      .from('pharmacy_inventory')
      .update({ quantity })
      .eq('medicine_id', id)
      .eq('pharmacy_id', pharmacyId)

    if (error) throw error
  },
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const pharmacyId = getEffectivePharmacyId()
    const supabase = getSupabaseClient()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const [{ data: salesData, error: salesError }, inventoryData] = await Promise.all([
      supabase
        .from('sales')
        .select('total, sale_items(quantity)')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'Completed')
        .gte('sale_date', startOfDay)
        .lt('sale_date', endOfDay),
      medicineService.getAll(),
    ])

    if (salesError) throw salesError

    const sales = (salesData || []) as Array<{
      total: number
      sale_items: Array<{ quantity: number }>
    }>
    
    return {
      totalMedicines: inventoryData.length,
      lowStockCount: inventoryData.filter((item) => item.quantity <= item.reorderLevel).length,
      categoriesCount: new Set(inventoryData.map((item) => item.category).filter(Boolean)).size,
      suppliersCount: new Set(inventoryData.map((item) => item.supplier).filter(Boolean)).size,
      totalSalesToday: sales.length,
      totalUnitsSold: sales.reduce(
        (sum, sale) => sum + sale.sale_items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ),
      revenueToday: sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    }
  },

  getLowStockItems: async (): Promise<Medicine[]> => {
    const pharmacyInventory = await medicineService.getAll()
    return pharmacyInventory.filter((item) => item.quantity <= item.reorderLevel)
  },

  getExpiredMedicines: async (): Promise<Medicine[]> => {
    const pharmacyInventory = await medicineService.getAll()
    return pharmacyInventory.filter((item) => item.expiryDate && new Date(item.expiryDate) < new Date())
  },
}
