import type { Medicine } from './medicineService'
import { warehouseService } from './warehouseService'

// Pharmacy-specific inventory data
// Each pharmacy has different stock levels, prices, and product availability

const baseMedicines: Omit<Medicine, 'quantity' | 'pharmacyId'>[] = [
  {
    id: 'm-1',
    barcode: 'PAR001',
    medicineName: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Pain Relief',
    manufacturer: 'PharmaCorp',
    supplier: 'MediSupply Ltd',
    batchNumber: 'B-2024-001',
    expiryDate: '2028-06-15',
    manufacturingDate: '2024-01-15',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box',
    purchasePrice: 25.00,
    sellingPrice: 35.00,
    taxRate: 0.15,
    reorderLevel: 50,
    prescriptionRequired: false,
    status: 'Available',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'm-2',
    barcode: 'AMO002',
    medicineName: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotics',
    manufacturer: 'BioPharma',
    supplier: 'HealthDist Co',
    batchNumber: 'B-2024-002',
    expiryDate: '2027-12-20',
    manufacturingDate: '2024-02-20',
    dosageForm: 'Capsule',
    strength: '250mg',
    unit: 'Box',
    purchasePrice: 45.00,
    sellingPrice: 65.00,
    taxRate: 0.15,
    reorderLevel: 30,
    prescriptionRequired: true,
    status: 'Available',
    isActive: true,
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'm-3',
    barcode: 'IBU003',
    medicineName: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    category: 'Pain Relief',
    manufacturer: 'PainRelief Inc',
    supplier: 'MediSupply Ltd',
    batchNumber: 'B-2024-003',
    expiryDate: '2028-03-10',
    manufacturingDate: '2024-03-10',
    dosageForm: 'Tablet',
    strength: '400mg',
    unit: 'Box',
    purchasePrice: 30.00,
    sellingPrice: 45.00,
    taxRate: 0.15,
    reorderLevel: 40,
    prescriptionRequired: false,
    status: 'Available',
    isActive: true,
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'm-4',
    barcode: 'OME004',
    medicineName: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Gastric',
    manufacturer: 'GastroCare',
    supplier: 'HealthDist Co',
    batchNumber: 'B-2024-004',
    expiryDate: '2027-09-25',
    manufacturingDate: '2024-04-25',
    dosageForm: 'Capsule',
    strength: '20mg',
    unit: 'Box',
    purchasePrice: 55.00,
    sellingPrice: 75.00,
    taxRate: 0.15,
    reorderLevel: 25,
    prescriptionRequired: true,
    status: 'Available',
    isActive: true,
    createdAt: '2024-04-25T10:00:00Z',
  },
  {
    id: 'm-5',
    barcode: 'MET005',
    medicineName: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Diabetes',
    manufacturer: 'DiaCare',
    supplier: 'MediSupply Ltd',
    batchNumber: 'B-2024-005',
    expiryDate: '2028-01-30',
    manufacturingDate: '2024-05-30',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box',
    purchasePrice: 40.00,
    sellingPrice: 60.00,
    taxRate: 0.15,
    reorderLevel: 60,
    prescriptionRequired: true,
    status: 'Available',
    isActive: true,
    createdAt: '2024-05-30T10:00:00Z',
  },
]

// Pharmacy-specific inventory configurations
export const pharmacyInventoryData: Record<string, Medicine[]> = {
  myneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [120, 85, 95, 45, 150][index], // Different stock levels
    pharmacyId: 'myneen',
  })),
  
  yaneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [80, 120, 60, 90, 110][index],
    pharmacyId: 'yaneen',
  })),
  
  zaneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [95, 70, 85, 55, 95][index],
    pharmacyId: 'zaneen',
  })),
  
  laneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [110, 95, 75, 85, 130][index],
    pharmacyId: 'laneen',
  })),
  
  taneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [65, 110, 50, 70, 85][index],
    pharmacyId: 'taneen',
  })),
  
  tinkempo: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [90, 65, 110, 60, 75][index],
    pharmacyId: 'tinkempo',
  })),
  
  tony: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [100, 80, 90, 75, 105][index],
    pharmacyId: 'tony',
  })),
  
  waneen: baseMedicines.map((med, index) => ({
    ...med,
    quantity: [75, 90, 65, 80, 70][index],
    pharmacyId: 'waneen',
  })),
}

// Helper function to get pharmacy-specific inventory
export const getPharmacyInventory = (pharmacyId: string): Medicine[] => {
  if (!pharmacyId || pharmacyId === 'default') {
    return baseMedicines.map(med => ({
      ...med,
      quantity: 50, // Default stock
      pharmacyId: 'default',
    }))
  }
  
  return pharmacyInventoryData[pharmacyId] || baseMedicines.map(med => ({
    ...med,
    quantity: 50, // Default stock
    pharmacyId,
  }))
}

// Helper function to add pharmacy context to medicines
export const addPharmacyContext = (medicines: Medicine[], pharmacyId: string): Medicine[] => {
  return medicines.map(medicine => ({
    ...medicine,
    pharmacyId,
  }))
}

// Helper function to get pharmacy inventory including warehouse allocations
export const getPharmacyInventoryWithAllocations = async (
  pharmacyId: string,
  initialInventory: Medicine[] = getPharmacyInventory(pharmacyId),
): Promise<Medicine[]> => {
  try {
    // Get base pharmacy inventory
    const baseInventory = initialInventory.map((medicine) => ({ ...medicine }))
    
    // Get completed allocations for this pharmacy
    const allocations = await warehouseService.getAllocationsByPharmacy(pharmacyId)
    console.log('Pharmacy allocation lookup:', {
      pharmacyId,
      allocationCount: allocations.length,
      initialInventoryCount: initialInventory.length,
    })
    const pharmacyAllocations = allocations.filter((alloc) => (
      alloc.status.toLowerCase() !== 'rejected'
    ))
    
    // For each allocation, add or update the medicine in pharmacy inventory
    pharmacyAllocations.forEach(allocation => {
      const existingMedicine = baseInventory.find((medicine) => (
        medicine.medicineName.trim().toLowerCase() === allocation.medicineName.trim().toLowerCase()
      ))
      
      if (existingMedicine) {
        // Update existing medicine quantity
        existingMedicine.quantity += allocation.quantity
      } else {
        // Add new medicine from warehouse allocation
        // In a real system, you'd fetch the full medicine details from warehouse
        baseInventory.push({
          id: allocation.medicineId || `warehouse-${allocation.warehouseItemId}`,
          barcode: `ALLOC-${allocation.id}`,
          medicineName: allocation.medicineName,
          genericName: '',
          category: 'General',
          manufacturer: '',
          supplier: '',
          batchNumber: allocation.batchNumber || '',
          expiryDate: allocation.expiryDate || '',
          manufacturingDate: '',
          dosageForm: 'Tablet',
          strength: '',
          unit: 'Box',
          purchasePrice: allocation.purchasePrice || 0,
          sellingPrice: allocation.sellingPrice || 0,
          taxRate: 0.15,
          quantity: allocation.quantity,
          reorderLevel: 10,
          prescriptionRequired: false,
          status: 'Available',
          isActive: true,
          pharmacyId,
          createdAt: allocation.createdAt,
        })
      }
    })
    
    return baseInventory
  } catch (error) {
    console.error('Failed to get pharmacy inventory with allocations:', error)
    return getPharmacyInventory(pharmacyId)
  }
}