import { apiClient } from './apiClient'

export interface Customer {
  id: string
  fullName: string
  phone?: string
  email?: string
  address?: string
  insuranceProvider?: string
  creditBalance: number
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
}

export interface Prescription {
  id: string
  prescriptionNumber: string
  patientName: string
  doctorName: string
  prescriptionDate: string
  medicineId: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  isApproved: boolean
  createdAt: string
}

export interface Category {
  id: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface Supplier {
  id: string
  companyName: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  createdAt: string
}

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get('/customers')
    return response.data
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`)
    return response.data
  },

  create: async (customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post('/customers', customer)
    return response.data
  },

  update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, customer)
    return response.data
  },
}

export const prescriptionService = {
  getAll: async (): Promise<Prescription[]> => {
    const response = await apiClient.get('/prescriptions')
    return response.data
  },

  getById: async (id: string): Promise<Prescription> => {
    const response = await apiClient.get(`/prescriptions/${id}`)
    return response.data
  },

  create: async (prescription: Partial<Prescription>): Promise<Prescription> => {
    const response = await apiClient.post('/prescriptions', prescription)
    return response.data
  },

  approve: async (id: string): Promise<Prescription> => {
    const response = await apiClient.put(`/prescriptions/${id}/approve`, {})
    return response.data
  },
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  create: async (category: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories', category)
    return response.data
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, category)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },
}

export const supplierService = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await apiClient.get('/suppliers')
    return response.data
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/suppliers/${id}`)
    return response.data
  },

  create: async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', supplier)
    return response.data
  },

  update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/suppliers/${id}`, supplier)
    return response.data
  },
}
