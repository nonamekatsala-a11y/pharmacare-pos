/**
 * Type definitions used throughout the application
 */

export type UserRole = 'Admin' | 'Cashier' | 'Pharmacist'
export type MedicineStatus = 'Available' | 'Discontinued'
export type SaleStatus = 'Completed' | 'Refunded' | 'Pending'
export type PaymentMethod = 'Cash' | 'Card' | 'Credit'

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
