export type DemoUserRole = 'Admin' | 'Cashier' | 'Pharmacist'

export interface DemoUser {
  id: string
  userName: string
  email: string
  role: DemoUserRole
  fullName: string
  password: string
  isAdmin: boolean
}

export interface DemoMedicine {
  id: string
  barcode: string
  medicineName: string
  genericName: string
  category: string
  manufacturer: string
  supplier: string
  batchNumber: string
  expiryDate: string
  manufacturingDate: string
  dosageForm: string
  strength: string
  unit: string
  purchasePrice: number
  sellingPrice: number
  taxRate: number
  quantity: number
  reorderLevel: number
  prescriptionRequired: boolean
  status: 'Available' | 'Discontinued'
  isActive: boolean
  createdAt: string
}

export const demoUsers: DemoUser[] = [
  {
    id: 'u-admin',
    userName: 'admin',
    email: 'admin@pharmacare.local',
    role: 'Admin',
    fullName: 'System Administrator',
    password: 'Admin@123',
    isAdmin: true,
  },
  {
    id: 'u-pharmacist',
    userName: 'pharmacist',
    email: 'pharmacist@pharmacare.local',
    role: 'Pharmacist',
    fullName: 'Pharmacist User',
    password: 'Pharmacist@123',
    isAdmin: false,
  },
  {
    id: 'u-cashier',
    userName: 'cashier',
    email: 'cashier@pharmacare.local',
    role: 'Cashier',
    fullName: 'Cashier User',
    password: 'Cashier@123',
    isAdmin: false,
  },
]

export const demoMedicines: DemoMedicine[] = [
  {
    id: 'm-001',
    barcode: '890123456001',
    medicineName: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Pain Relief',
    manufacturer: 'PharmaCare Labs',
    supplier: 'Medix Supplies',
    batchNumber: 'PC-2026-01',
    expiryDate: '2027-12-31',
    manufacturingDate: '2025-02-12',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box',
    purchasePrice: 2.5,
    sellingPrice: 4.5,
    taxRate: 0.15,
    quantity: 120,
    reorderLevel: 25,
    prescriptionRequired: false,
    status: 'Available',
    isActive: true,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'm-002',
    barcode: '890123456002',
    medicineName: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    manufacturer: 'CareWell Pharma',
    supplier: 'Prime Medical',
    batchNumber: 'AM-2026-03',
    expiryDate: '2026-10-15',
    manufacturingDate: '2025-04-20',
    dosageForm: 'Capsule',
    strength: '250mg',
    unit: 'Pack',
    purchasePrice: 6.2,
    sellingPrice: 9.8,
    taxRate: 0.15,
    quantity: 42,
    reorderLevel: 20,
    prescriptionRequired: true,
    status: 'Available',
    isActive: true,
    createdAt: '2026-08-02T09:00:00.000Z',
  },
  {
    id: 'm-003',
    barcode: '890123456003',
    medicineName: 'Cough Syrup',
    genericName: 'Dextromethorphan',
    category: 'Respiratory',
    manufacturer: 'Apex Pharma',
    supplier: 'Alpha Distribution',
    batchNumber: 'CS-2026-07',
    expiryDate: '2027-06-05',
    manufacturingDate: '2025-03-10',
    dosageForm: 'Syrup',
    strength: '120ml',
    unit: 'Bottle',
    purchasePrice: 4.8,
    sellingPrice: 7.4,
    taxRate: 0.15,
    quantity: 18,
    reorderLevel: 15,
    prescriptionRequired: false,
    status: 'Available',
    isActive: true,
    createdAt: '2026-08-03T09:00:00.000Z',
  },
  {
    id: 'm-004',
    barcode: '890123456004',
    medicineName: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    category: 'Digestive',
    manufacturer: 'MediPlus',
    supplier: 'PharmaLink',
    batchNumber: 'OM-2026-02',
    expiryDate: '2027-02-11',
    manufacturingDate: '2025-08-20',
    dosageForm: 'Capsule',
    strength: '20mg',
    unit: 'Strip',
    purchasePrice: 5.4,
    sellingPrice: 8.7,
    taxRate: 0.15,
    quantity: 62,
    reorderLevel: 25,
    prescriptionRequired: false,
    status: 'Available',
    isActive: true,
    createdAt: '2026-08-04T09:00:00.000Z',
  },
  {
    id: 'm-005',
    barcode: '890123456005',
    medicineName: 'Insulin Glargine',
    genericName: 'Insulin',
    category: 'Diabetes',
    manufacturer: 'NovoCare',
    supplier: 'LifeCare Supply',
    batchNumber: 'IN-2026-11',
    expiryDate: '2026-09-01',
    manufacturingDate: '2025-01-15',
    dosageForm: 'Injection',
    strength: '100IU/ml',
    unit: 'Vial',
    purchasePrice: 14.5,
    sellingPrice: 22.0,
    taxRate: 0.15,
    quantity: 8,
    reorderLevel: 12,
    prescriptionRequired: true,
    status: 'Available',
    isActive: true,
    createdAt: '2026-08-05T09:00:00.000Z',
  },
]

export interface DemoSale {
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
  items: DemoSaleItem[]
  createdAt: string
}

export interface DemoSaleItem {
  id: string
  saleId: string
  medicineId: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export const demoSales: DemoSale[] = [
  {
    id: 's-001',
    invoiceNumber: 'INV-2026-08-15-001',
    userId: 'u-cashier',
    customerId: 'c-001',
    saleDate: '2026-08-15T09:30:00.000Z',
    subtotal: 18.0,
    discount: 0,
    tax: 2.7,
    total: 20.7,
    paymentMethod: 'Cash',
    status: 'Completed',
    items: [
      {
        id: 'si-001-1',
        saleId: 's-001',
        medicineId: 'm-001',
        quantity: 4,
        unitPrice: 4.5,
        lineTotal: 18.0,
      },
    ],
    createdAt: '2026-08-15T09:30:00.000Z',
  },
  {
    id: 's-002',
    invoiceNumber: 'INV-2026-08-15-002',
    userId: 'u-cashier',
    saleDate: '2026-08-15T10:15:00.000Z',
    subtotal: 25.6,
    discount: 2.0,
    tax: 3.54,
    total: 27.14,
    paymentMethod: 'Card',
    status: 'Completed',
    items: [
      {
        id: 'si-002-1',
        saleId: 's-002',
        medicineId: 'm-002',
        quantity: 2,
        unitPrice: 9.8,
        lineTotal: 19.6,
      },
      {
        id: 'si-002-2',
        saleId: 's-002',
        medicineId: 'm-003',
        quantity: 1,
        unitPrice: 7.4,
        lineTotal: 7.4,
      },
    ],
    createdAt: '2026-08-15T10:15:00.000Z',
  },
  {
    id: 's-003',
    invoiceNumber: 'INV-2026-08-14-001',
    userId: 'u-cashier',
    saleDate: '2026-08-14T14:45:00.000Z',
    subtotal: 44.0,
    discount: 0,
    tax: 6.6,
    total: 50.6,
    paymentMethod: 'Cash',
    status: 'Completed',
    items: [
      {
        id: 'si-003-1',
        saleId: 's-003',
        medicineId: 'm-004',
        quantity: 3,
        unitPrice: 8.7,
        lineTotal: 26.1,
      },
      {
        id: 'si-003-2',
        saleId: 's-003',
        medicineId: 'm-005',
        quantity: 1,
        unitPrice: 22.0,
        lineTotal: 22.0,
      },
    ],
    createdAt: '2026-08-14T14:45:00.000Z',
  },
  {
    id: 's-004',
    invoiceNumber: 'INV-2026-08-14-002',
    userId: 'u-cashier',
    saleDate: '2026-08-14T16:20:00.000Z',
    subtotal: 13.5,
    discount: 0,
    tax: 2.025,
    total: 15.525,
    paymentMethod: 'Cash',
    status: 'Refunded',
    items: [
      {
        id: 'si-004-1',
        saleId: 's-004',
        medicineId: 'm-001',
        quantity: 3,
        unitPrice: 4.5,
        lineTotal: 13.5,
      },
    ],
    createdAt: '2026-08-14T16:20:00.000Z',
  },
  {
    id: 's-005',
    invoiceNumber: 'INV-2026-08-13-001',
    userId: 'u-cashier',
    saleDate: '2026-08-13T11:00:00.000Z',
    subtotal: 74.8,
    discount: 5.0,
    tax: 10.47,
    total: 80.27,
    paymentMethod: 'Credit',
    status: 'Completed',
    items: [
      {
        id: 'si-005-1',
        saleId: 's-005',
        medicineId: 'm-002',
        quantity: 4,
        unitPrice: 9.8,
        lineTotal: 39.2,
      },
      {
        id: 'si-005-2',
        saleId: 's-005',
        medicineId: 'm-003',
        quantity: 2,
        unitPrice: 7.4,
        lineTotal: 14.8,
      },
      {
        id: 'si-005-3',
        saleId: 's-005',
        medicineId: 'm-004',
        quantity: 2,
        unitPrice: 8.7,
        lineTotal: 17.4,
      },
    ],
    createdAt: '2026-08-13T11:00:00.000Z',
  },
  {
    id: 's-006',
    invoiceNumber: 'INV-2026-08-12-001',
    userId: 'u-cashier',
    saleDate: '2026-08-12T13:30:00.000Z',
    subtotal: 9.0,
    discount: 0,
    tax: 1.35,
    total: 10.35,
    paymentMethod: 'Cash',
    status: 'Completed',
    items: [
      {
        id: 'si-006-1',
        saleId: 's-006',
        medicineId: 'm-001',
        quantity: 2,
        unitPrice: 4.5,
        lineTotal: 9.0,
      },
    ],
    createdAt: '2026-08-12T13:30:00.000Z',
  },
  {
    id: 's-007',
    invoiceNumber: 'INV-2026-08-11-001',
    userId: 'u-cashier',
    saleDate: '2026-08-11T10:00:00.000Z',
    subtotal: 35.8,
    discount: 0,
    tax: 5.37,
    total: 41.17,
    paymentMethod: 'Card',
    status: 'Completed',
    items: [
      {
        id: 'si-007-1',
        saleId: 's-007',
        medicineId: 'm-003',
        quantity: 3,
        unitPrice: 7.4,
        lineTotal: 22.2,
      },
      {
        id: 'si-007-2',
        saleId: 's-007',
        medicineId: 'm-004',
        quantity: 2,
        unitPrice: 8.7,
        lineTotal: 17.4,
      },
    ],
    createdAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 's-008',
    invoiceNumber: 'INV-2026-08-10-001',
    userId: 'u-cashier',
    saleDate: '2026-08-10T15:45:00.000Z',
    subtotal: 22.0,
    discount: 0,
    tax: 3.3,
    total: 25.3,
    paymentMethod: 'Cash',
    status: 'Completed',
    items: [
      {
        id: 'si-008-1',
        saleId: 's-008',
        medicineId: 'm-005',
        quantity: 1,
        unitPrice: 22.0,
        lineTotal: 22.0,
      },
    ],
    createdAt: '2026-08-10T15:45:00.000Z',
  },
]

export const demoDashboardSummary = {
  totalMedicines: demoMedicines.length,
  lowStockCount: demoMedicines.filter((m) => m.quantity <= m.reorderLevel).length,
  categoriesCount: 5,
  suppliersCount: 5,
  totalSalesToday: 154,
  revenueToday: 4860,
}

export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
