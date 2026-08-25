import { getSupabaseClient } from '@lib/supabaseClient'
import { PHARMACIES } from '@config/pharmacyConfig'

export interface WarehouseItem {
  id: string
  medicineId: string
  medicineName: string
  genericName?: string | null
  category?: string
  barcode?: string
  totalQuantity: number
  availableQuantity: number
  allocatedQuantity: number
  purchasePrice: number
  sellingPrice: number
  expiryDate?: string
  batchNumber?: string | null
  location?: string
  supplier?: string
  manufacturer?: string
  reorderLevel?: number
  createdAt: string
  lastUpdated: string
}

export interface Allocation {
  id: string
  warehouseItemId: string
  medicineId?: string
  pharmacyId: string
  pharmacyName: string
  medicineName: string
  quantity: number
  allocatedDate: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'
  allocatedBy: string
  notes?: string
  createdAt: string
  purchasePrice?: number
  sellingPrice?: number
  expiryDate?: string
  batchNumber?: string
}

interface WarehouseRow {
  id: string
  medicine_id: string
  batch_number: string
  expiry_date: string | null
  purchase_price: number
  selling_price: number
  total_quantity: number
  allocated_quantity: number
  location: string
  reorder_level: number
  created_at: string
  updated_at: string
  medicines: { medicine_name: string; generic_name: string | null; barcode: string; manufacturer: string | null } | Array<{ medicine_name: string; generic_name: string | null; barcode: string; manufacturer: string | null }> | null
}

interface AllocationRow {
  id: string
  warehouse_item_id: string
  pharmacy_id: string
  quantity: number
  allocated_date: string
  status: Allocation['status']
  allocated_by: string | null
  notes: string | null
  created_at: string
  warehouse_items: {
    medicine_id: string
    purchase_price: number
    selling_price: number
    expiry_date: string | null
    batch_number: string | null
    medicines: { medicine_name: string } | Array<{ medicine_name: string }> | null
  } | Array<{
    medicine_id: string
    purchase_price: number
    selling_price: number
    expiry_date: string | null
    batch_number: string | null
    medicines: { medicine_name: string } | Array<{ medicine_name: string }> | null
  }> | null
}

const pharmacyName = (id: string) => PHARMACIES.find((pharmacy) => pharmacy.id === id)?.name || id
const first = <T,>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] || null : value || null

const mapWarehouseItem = (row: WarehouseRow): WarehouseItem => ({
  id: row.id,
  medicineId: row.medicine_id,
  medicineName: first(row.medicines)?.medicine_name || 'Unknown medicine',
  genericName: first(row.medicines)?.generic_name || undefined,
  barcode: first(row.medicines)?.barcode || undefined,
  totalQuantity: row.total_quantity,
  availableQuantity: row.total_quantity - row.allocated_quantity,
  allocatedQuantity: row.allocated_quantity,
  purchasePrice: Number(row.purchase_price),
  sellingPrice: Number(row.selling_price),
  expiryDate: row.expiry_date || undefined,
  batchNumber: row.batch_number || undefined,
  location: row.location,
  manufacturer: first(row.medicines)?.manufacturer || undefined,
  reorderLevel: row.reorder_level,
  createdAt: row.created_at,
  lastUpdated: row.updated_at,
})

const mapAllocation = (row: AllocationRow): Allocation => ({
  id: row.id,
  warehouseItemId: row.warehouse_item_id,
  medicineId: first(row.warehouse_items)?.medicine_id,
  pharmacyId: row.pharmacy_id,
  pharmacyName: pharmacyName(row.pharmacy_id),
  medicineName: first(first(row.warehouse_items)?.medicines)?.medicine_name || 'Unknown medicine',
  quantity: row.quantity,
  allocatedDate: row.allocated_date,
  status: row.status,
  allocatedBy: row.allocated_by || '',
  notes: row.notes || undefined,
  createdAt: row.created_at,
  purchasePrice: Number(first(row.warehouse_items)?.purchase_price || 0),
  sellingPrice: Number(first(row.warehouse_items)?.selling_price || 0),
  expiryDate: first(row.warehouse_items)?.expiry_date || undefined,
  batchNumber: first(row.warehouse_items)?.batch_number || undefined,
})

const allocationSelect = 'id, warehouse_item_id, pharmacy_id, quantity, allocated_date, status, allocated_by, notes, created_at, warehouse_items(medicine_id, purchase_price, selling_price, expiry_date, batch_number, medicines(medicine_name))'

export const warehouseService = {
  getAllItems: async (): Promise<WarehouseItem[]> => {
    const { data, error } = await getSupabaseClient()
      .from('warehouse_items')
      .select('id, medicine_id, batch_number, expiry_date, purchase_price, selling_price, total_quantity, allocated_quantity, location, reorder_level, created_at, updated_at, medicines(medicine_name, generic_name, barcode, manufacturer)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as WarehouseRow[]).map(mapWarehouseItem)
  },

  getItemById: async (id: string): Promise<WarehouseItem> => {
    const items = await warehouseService.getAllItems()
    const item = items.find((entry) => entry.id === id)
    if (!item) throw new Error('Warehouse item not found')
    return item
  },

  getAllAllocations: async (): Promise<Allocation[]> => {
    const { data, error } = await getSupabaseClient()
      .from('warehouse_allocations')
      .select(allocationSelect)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as AllocationRow[]).map(mapAllocation)
  },

  getAllocationsByPharmacy: async (pharmacyId: string): Promise<Allocation[]> => {
    const { data, error } = await getSupabaseClient()
      .from('warehouse_allocations')
      .select(allocationSelect)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as AllocationRow[]).map(mapAllocation)
  },

  getAllocationsByWarehouseItem: async (warehouseItemId: string) =>
    (await warehouseService.getAllAllocations()).filter((allocation) => allocation.warehouseItemId === warehouseItemId),

  getWarehouseSummary: async () => {
    const items = await warehouseService.getAllItems()
    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.totalQuantity, 0),
      availableQuantity: items.reduce((sum, item) => sum + item.availableQuantity, 0),
      allocatedQuantity: items.reduce((sum, item) => sum + item.allocatedQuantity, 0),
      totalValue: items.reduce((sum, item) => sum + item.purchasePrice * item.availableQuantity, 0),
      lowStockItems: items.filter((item) => item.availableQuantity <= (item.reorderLevel || 0)).length,
    }
  },

  getAllocationSummary: async () => {
    const allocations = await warehouseService.getAllAllocations()
    return {
      totalAllocations: allocations.length,
      pendingAllocations: allocations.filter((item) => item.status === 'Pending').length,
      completedAllocations: allocations.filter((item) => item.status === 'Completed').length,
      byPharmacy: allocations.reduce((result, item) => {
        result[item.pharmacyName] = (result[item.pharmacyName] || 0) + item.quantity
        return result
      }, {} as Record<string, number>),
      byStatus: allocations.reduce((result, item) => {
        result[item.status] = (result[item.status] || 0) + 1
        return result
      }, {} as Record<string, number>),
    }
  },

  addItem: async (item: Omit<WarehouseItem, 'id' | 'availableQuantity' | 'allocatedQuantity' | 'createdAt' | 'lastUpdated'>): Promise<WarehouseItem> => {
    const supabase = getSupabaseClient()
    
    // First, check if medicine exists, if not create it
    let medicineId = item.medicineId
    if (!medicineId || medicineId.startsWith('m-')) {
      // Create the medicine first
      const { data: medicineData, error: medicineError } = await supabase
        .from('medicines')
        .insert({
          barcode: `WH-${Date.now()}`,
          medicine_name: item.medicineName,
          generic_name: null,
          manufacturer: null,
          prescription_required: false,
          status: 'Available',
          is_active: true,
        })
        .select('id')
        .single()
      
      if (medicineError) throw medicineError
      medicineId = medicineData.id
    }

    // Create the warehouse item
    const { data, error } = await supabase
      .from('warehouse_items')
      .insert({
        medicine_id: medicineId,
        batch_number: `BATCH-${Date.now()}`,
        expiry_date: item.expiryDate || null,
        purchase_price: item.purchasePrice,
        selling_price: item.sellingPrice,
        total_quantity: item.totalQuantity,
        allocated_quantity: 0,
        location: 'Main Warehouse',
        reorder_level: item.reorderLevel || 0,
      })
      .select('id, medicine_id, batch_number, expiry_date, purchase_price, selling_price, total_quantity, allocated_quantity, location, reorder_level, created_at, updated_at, medicines(medicine_name, generic_name, barcode, manufacturer)')
      .single()

    if (error) throw error
    return mapWarehouseItem(data as WarehouseRow)
  },

  addStock: async (id: string, quantity: number): Promise<WarehouseItem> => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Stock quantity must be a positive whole number.')
    }

    const supabase = getSupabaseClient()
    const { data: currentItem, error: currentItemError } = await supabase
      .from('warehouse_items')
      .select('total_quantity')
      .eq('id', id)
      .single()

    if (currentItemError) throw currentItemError

    const { data, error } = await supabase
      .from('warehouse_items')
      .update({ total_quantity: currentItem.total_quantity + quantity })
      .eq('id', id)
      .select('id, medicine_id, batch_number, expiry_date, purchase_price, selling_price, total_quantity, allocated_quantity, location, reorder_level, created_at, updated_at, medicines(medicine_name, generic_name, barcode, manufacturer)')
      .single()

    if (error) throw error
    return mapWarehouseItem(data as WarehouseRow)
  },

  deleteItem: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error: allocationsError } = await supabase
      .from('warehouse_allocations')
      .delete()
      .eq('warehouse_item_id', id)

    if (allocationsError) throw allocationsError

    const { error } = await supabase.from('warehouse_items').delete().eq('id', id)
    if (error) throw error
  },

  createAllocation: async (allocation: Omit<Allocation, 'id' | 'createdAt'>): Promise<Allocation> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('warehouse_allocations')
      .insert({
        warehouse_item_id: allocation.warehouseItemId,
        pharmacy_id: allocation.pharmacyId,
        quantity: allocation.quantity,
        allocated_date: allocation.allocatedDate,
        status: allocation.status,
        notes: allocation.notes,
      })
      .select(allocationSelect)
      .single()
    if (error) throw error

    const { data: warehouseItem, error: warehouseItemError } = await supabase
      .from('warehouse_items')
      .select('allocated_quantity')
      .eq('id', allocation.warehouseItemId)
      .single()
    if (warehouseItemError) throw warehouseItemError

    const { error: updateError } = await supabase
      .from('warehouse_items')
      .update({ allocated_quantity: warehouseItem.allocated_quantity + allocation.quantity })
      .eq('id', allocation.warehouseItemId)
    if (updateError) throw updateError

    // If allocation is created with 'Completed' status, update pharmacy inventory immediately
    if (allocation.status === 'Completed') {
      const allocationData = data as AllocationRow
      const pharmacyId = allocationData.pharmacy_id
      const medicineId = first(allocationData.warehouse_items)?.medicine_id
      const quantity = allocationData.quantity
      const purchasePrice = Number(first(allocationData.warehouse_items)?.purchase_price || 0)
      const sellingPrice = Number(first(allocationData.warehouse_items)?.selling_price || 0)
      const expiryDate = first(allocationData.warehouse_items)?.expiry_date
      const batchNumber = first(allocationData.warehouse_items)?.batch_number
      const medicineName = first(first(allocationData.warehouse_items)?.medicines)?.medicine_name || 'Unknown Medicine'

      if (medicineId && pharmacyId) {
        // Check if medicine exists in pharmacy inventory
        const { data: existingInventory, error: fetchInventoryError } = await supabase
          .from('pharmacy_inventory')
          .select('quantity')
          .eq('medicine_id', medicineId)
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle()

        if (fetchInventoryError && fetchInventoryError.code !== 'PGRST116') {
          console.error('Error checking pharmacy inventory:', fetchInventoryError)
        }

        if (existingInventory) {
          // Update existing inventory - ADD to current quantity
          const currentQuantity = existingInventory.quantity || 0
          const newQuantity = currentQuantity + quantity

          const { error: updateInventoryError } = await supabase
            .from('pharmacy_inventory')
            .update({ quantity: newQuantity })
            .eq('medicine_id', medicineId)
            .eq('pharmacy_id', pharmacyId)

          if (updateInventoryError) {
            console.error('Error updating pharmacy inventory:', updateInventoryError)
          }
        } else {
          // Create new inventory entry
          const { error: insertInventoryError } = await supabase
            .from('pharmacy_inventory')
            .insert({
              medicine_id: medicineId,
              pharmacy_id: pharmacyId,
              barcode: `WH-${medicineId}`,
              medicine_name: medicineName,
              generic_name: null,
              category: 'General',
              manufacturer: null,
              supplier: 'Warehouse',
              batch_number: batchNumber || null,
              expiry_date: expiryDate || null,
              manufacturing_date: null,
              dosage_form: 'Tablet',
              strength: null,
              unit: 'Box',
              purchase_price: purchasePrice,
              selling_price: sellingPrice,
              tax_rate: 0.15,
              quantity: quantity,
              reorder_level: 10,
              prescription_required: false,
              status: 'Available',
              is_active: true,
              created_at: new Date().toISOString(),
            })

          if (insertInventoryError) {
            console.error('Error creating pharmacy inventory:', insertInventoryError)
          }
        }
      }
    }

    return mapAllocation(data as AllocationRow)
  },

  updateAllocationStatus: async (id: string, status: Allocation['status']): Promise<Allocation> => {
    const supabase = getSupabaseClient()
    
    // Get the allocation details before updating
    const { data: allocation, error: fetchError } = await supabase
      .from('warehouse_allocations')
      .select(allocationSelect)
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const oldStatus = (allocation as AllocationRow).status
    const allocationData = allocation as AllocationRow

    // Update the allocation status
    const { data: updatedAllocation, error: updateError } = await supabase
      .from('warehouse_allocations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(allocationSelect)
      .single()

    if (updateError) throw updateError

    // If status changed to Completed, add the quantity to pharmacy inventory
    if (status === 'Completed' && oldStatus !== 'Completed') {
      const pharmacyId = allocationData.pharmacy_id
      const medicineId = first(allocationData.warehouse_items)?.medicine_id
      const quantity = allocationData.quantity
      const purchasePrice = Number(first(allocationData.warehouse_items)?.purchase_price || 0)
      const sellingPrice = Number(first(allocationData.warehouse_items)?.selling_price || 0)
      const expiryDate = first(allocationData.warehouse_items)?.expiry_date
      const batchNumber = first(allocationData.warehouse_items)?.batch_number
      const medicineName = first(first(allocationData.warehouse_items)?.medicines)?.medicine_name || 'Unknown Medicine'

      console.log(`Completing allocation for pharmacy ${pharmacyId}, medicine ${medicineId}, quantity ${quantity}`)

      if (medicineId && pharmacyId) {
        // Check if medicine exists in pharmacy inventory
        const { data: existingInventory, error: fetchInventoryError } = await supabase
          .from('pharmacy_inventory')
          .select('quantity')
          .eq('medicine_id', medicineId)
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle()

        console.log('Existing inventory check result:', existingInventory, 'Error:', fetchInventoryError)

        if (fetchInventoryError && fetchInventoryError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected
          console.error('Error checking pharmacy inventory:', fetchInventoryError)
        }

        if (existingInventory) {
          // Update existing inventory
          const currentQuantity = existingInventory.quantity || 0
          const newQuantity = currentQuantity + quantity

          console.log(`Updating existing inventory: ${currentQuantity} -> ${newQuantity}`)

          const { error: updateInventoryError } = await supabase
            .from('pharmacy_inventory')
            .update({ quantity: newQuantity })
            .eq('medicine_id', medicineId)
            .eq('pharmacy_id', pharmacyId)

          if (updateInventoryError) {
            console.error('Error updating pharmacy inventory:', updateInventoryError)
          } else {
            console.log('Successfully updated pharmacy inventory')
          }
        } else {
          // Create new inventory entry
          console.log('Creating new pharmacy inventory entry')
          
          const { error: insertInventoryError } = await supabase
            .from('pharmacy_inventory')
            .insert({
              medicine_id: medicineId,
              pharmacy_id: pharmacyId,
              barcode: `WH-${medicineId}`,
              medicine_name: medicineName,
              generic_name: null,
              category: 'General',
              manufacturer: null,
              supplier: 'Warehouse',
              batch_number: batchNumber || null,
              expiry_date: expiryDate || null,
              manufacturing_date: null,
              dosage_form: 'Tablet',
              strength: null,
              unit: 'Box',
              purchase_price: purchasePrice,
              selling_price: sellingPrice,
              tax_rate: 0.15,
              quantity: quantity,
              reorder_level: 10,
              prescription_required: false,
              status: 'Available',
              is_active: true,
              created_at: new Date().toISOString(),
            })

          if (insertInventoryError) {
            console.error('Error creating pharmacy inventory:', insertInventoryError)
          } else {
            console.log('Successfully created pharmacy inventory entry')
          }
        }
      } else {
        console.error('Missing medicineId or pharmacyId for allocation completion')
      }
    }

    return mapAllocation(updatedAllocation as AllocationRow)
  },

  deleteAllocation: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient()
    const { data: allocation, error: allocationError } = await supabase
      .from('warehouse_allocations')
      .select('warehouse_item_id, quantity, pharmacy_id, status')
      .eq('id', id)
      .single()
    if (allocationError) throw allocationError

    const { data: warehouseItem, error: warehouseItemError } = await supabase
      .from('warehouse_items')
      .select('allocated_quantity')
      .eq('id', allocation.warehouse_item_id)
      .single()
    if (warehouseItemError) throw warehouseItemError

    const { error: updateError } = await supabase
      .from('warehouse_items')
      .update({ allocated_quantity: Math.max(0, warehouseItem.allocated_quantity - allocation.quantity) })
      .eq('id', allocation.warehouse_item_id)
    if (updateError) throw updateError

    // If allocation was completed, remove the quantity from pharmacy inventory
    if (allocation.status === 'Completed') {
      const { data: allocationDetails, error: detailsError } = await supabase
        .from('warehouse_allocations')
        .select(allocationSelect)
        .eq('id', id)
        .single()

      if (!detailsError && allocationDetails) {
        const medicineId = first(allocationDetails.warehouse_items)?.medicine_id
        const pharmacyId = allocationDetails.pharmacy_id
        const quantity = allocationDetails.quantity

        if (medicineId && pharmacyId) {
          const { data: existingInventory, error: fetchInventoryError } = await supabase
            .from('pharmacy_inventory')
            .select('quantity')
            .eq('medicine_id', medicineId)
            .eq('pharmacy_id', pharmacyId)
            .single()

          if (!fetchInventoryError && existingInventory) {
            const currentQuantity = existingInventory.quantity || 0
            const newQuantity = Math.max(0, currentQuantity - quantity)

            const { error: updateInventoryError } = await supabase
              .from('pharmacy_inventory')
              .update({ quantity: newQuantity })
              .eq('medicine_id', medicineId)
              .eq('pharmacy_id', pharmacyId)

            if (updateInventoryError) {
              console.error('Error updating pharmacy inventory:', updateInventoryError)
            }
          }
        }
      }
    }

    const { error } = await supabase.from('warehouse_allocations').delete().eq('id', id)
    if (error) throw error
  },

  clearWarehouse: async (): Promise<void> => {
    const supabase = getSupabaseClient()
    
    console.log('Starting warehouse clear operation...')
    
    // IMPORTANT: Delete in correct order to respect foreign key constraints
    // Order: sale_items → sales → warehouse_allocations → warehouse_items → pharmacy_inventory → medicines
    
    // First, delete all sale_items (references medicines)
    const { error: saleItemsError, count: saleItemsCount } = await supabase
      .from('sale_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted sale items:', saleItemsCount, 'Error:', saleItemsError)
    
    // Ignore error if sale_items table doesn't exist
    if (saleItemsError && saleItemsError.code !== 'PGRST116') {
      console.warn('Error clearing sale items:', saleItemsError)
    }
    
    // Delete all sales (references sale_items)  
    const { error: salesError, count: salesCount } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted sales:', salesCount, 'Error:', salesError)
    
    // Ignore error if sales table doesn't exist
    if (salesError && salesError.code !== 'PGRST116') {
      console.warn('Error clearing sales:', salesError)
    }
    
    // Delete all allocations first
    const { error: allocationsError, count: allocationsCount } = await supabase
      .from('warehouse_allocations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted warehouse allocations:', allocationsCount, 'Error:', allocationsError)
    
    if (allocationsError) throw allocationsError
    
    // Delete all warehouse items
    const { error: itemsError, count: itemsCount } = await supabase
      .from('warehouse_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted warehouse items:', itemsCount, 'Error:', itemsError)
    
    if (itemsError) throw itemsError

    // Delete all pharmacy inventory (since it's related to warehouse allocations)
    const { error: pharmacyInventoryError, count: pharmacyCount } = await supabase
      .from('pharmacy_inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted pharmacy inventory:', pharmacyCount, 'Error:', pharmacyInventoryError)
    
    if (pharmacyInventoryError) throw pharmacyInventoryError

    // Now delete medicines table entries (these are referenced by pharmacy inventory and sale_items)
    const { error: medicinesError, count: medicinesCount } = await supabase
      .from('medicines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      .select()
    
    console.log('Deleted medicines:', medicinesCount, 'Error:', medicinesError)
    
    // Ignore error if medicines table doesn't exist or has constraints
    if (medicinesError && medicinesError.code !== 'PGRST116') {
      console.warn('Error clearing medicines:', medicinesError)
    }
    
    console.log('Warehouse clear operation completed successfully')
  },

  clearAllData: async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('clear_all_business_data')

    if (error) {
      throw new Error(`Failed to clear business data: ${error.message}`)
    }
  },
}
