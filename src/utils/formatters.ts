/**
 * Utility functions and helpers for the application
 */

export const formatCurrency = (value: number): string => {
  return `K${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isExpired = (expiryDate: string | Date): boolean => {
  const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  return date < new Date()
}

export const daysUntilExpiry = (expiryDate: string | Date): number => {
  const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const difference = date.getTime() - today.getTime()
  return Math.ceil(difference / (1000 * 60 * 60 * 24))
}
