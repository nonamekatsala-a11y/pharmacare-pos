export interface Pharmacy {
  id: string
  name: string
  location?: string
  pharmacist: {
    id: string
    userName: string
    fullName: string
    email: string
  }
  // Pharmacy-specific inventory settings
  inventorySettings?: {
    reorderThreshold: number
    lowStockThreshold: number
    defaultCurrency: string
  }
}

export const PHARMACIES: Pharmacy[] = [
  {
    id: 'myneen',
    name: 'MYNEEN MEDICINE STORE',
    pharmacist: {
      id: 'pharm-1',
      userName: 'myneen_pharm',
      fullName: 'MyNeen Pharmacist',
      email: 'myneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 15,
      lowStockThreshold: 10,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'yaneen',
    name: 'YANEEN MEDICINE STORE',
    pharmacist: {
      id: 'pharm-2',
      userName: 'yaneen_pharm',
      fullName: 'Yaneen Pharmacist',
      email: 'yaneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 20,
      lowStockThreshold: 15,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'zaneen',
    name: 'ZANEEN MEDICINE STORE',
    pharmacist: {
      id: 'pharm-3',
      userName: 'zaneen_pharm',
      fullName: 'Zaneen Pharmacist',
      email: 'zaneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 12,
      lowStockThreshold: 8,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'laneen',
    name: 'LANEEN MEDICINE STORE',
    pharmacist: {
      id: 'pharm-4',
      userName: 'laneen_pharm',
      fullName: 'Laneen Pharmacist',
      email: 'laneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 18,
      lowStockThreshold: 12,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'taneen',
    name: 'TANEEN MEDICINE STORE',
    pharmacist: {
      id: 'pharm-5',
      userName: 'taneen_pharm',
      fullName: 'Taneen Pharmacist',
      email: 'taneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 25,
      lowStockThreshold: 20,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'tinkempo',
    name: 'TINKEMPO MEDICINE STORE',
    pharmacist: {
      id: 'pharm-6',
      userName: 'tinkempo_pharm',
      fullName: 'Tinkempo Pharmacist',
      email: 'tinkempo@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 10,
      lowStockThreshold: 5,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'tony',
    name: 'TONY MEDICINE STORE',
    pharmacist: {
      id: 'pharm-7',
      userName: 'tony_pharm',
      fullName: 'Tony Pharmacist',
      email: 'tony@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 14,
      lowStockThreshold: 9,
      defaultCurrency: 'K',
    },
  },
  {
    id: 'waneen',
    name: 'WANEEN PVT CLINIC',
    pharmacist: {
      id: 'pharm-8',
      userName: 'waneen_pharm',
      fullName: 'Waneen Pharmacist',
      email: 'waneen@pharmacare.local',
    },
    inventorySettings: {
      reorderThreshold: 8,
      lowStockThreshold: 5,
      defaultCurrency: 'K',
    },
  },
]

// Helper function to get pharmacy by pharmacist username
export const getPharmacyByPharmacist = (pharmacistUserName: string): Pharmacy | null => {
  return PHARMACIES.find(
    (pharmacy) => pharmacy.pharmacist.userName === pharmacistUserName
  ) || null
}

// Helper function to validate if pharmacist belongs to selected pharmacy
export const validatePharmacistPharmacy = (
  pharmacistUserName: string,
  pharmacyId: string
): boolean => {
  const pharmacy = PHARMACIES.find((p) => p.id === pharmacyId)
  if (!pharmacy) return false
  return pharmacy.pharmacist.userName === pharmacistUserName
}

// Helper function to get pharmacist by pharmacy ID
export const getPharmacistByPharmacy = (pharmacyId: string) => {
  const pharmacy = PHARMACIES.find((p) => p.id === pharmacyId)
  return pharmacy?.pharmacist || null
}

// Helper function to get pharmacy inventory settings
export const getPharmacyInventorySettings = (pharmacyId: string) => {
  const pharmacy = PHARMACIES.find((p) => p.id === pharmacyId)
  return pharmacy?.inventorySettings || {
    reorderThreshold: 10,
    lowStockThreshold: 5,
    defaultCurrency: 'K',
  }
}

// Admin account (shared across all pharmacies)
export const ADMIN_ACCOUNT = {
  id: 'admin-1',
  userName: 'admin',
  fullName: 'System Administrator',
  email: 'admin@pharmacare.local',
  role: 'Admin' as const,
}
