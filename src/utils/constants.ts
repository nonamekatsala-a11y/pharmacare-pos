/**
 * Constants used throughout the application
 */

export const ROLES = {
  ADMIN: 'Admin',
  CASHIER: 'Cashier',
  PHARMACIST: 'Pharmacist',
} as const

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  CREDIT: 'Credit',
} as const

export const MEDICINE_STATUS = {
  AVAILABLE: 'Available',
  DISCONTINUED: 'Discontinued',
} as const

export const SALE_STATUS = {
  COMPLETED: 'Completed',
  REFUNDED: 'Refunded',
  PENDING: 'Pending',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  MEDICINES: {
    LIST: '/medicines',
    GET: '/medicines/:id',
    CREATE: '/medicines',
    UPDATE: '/medicines/:id',
    DELETE: '/medicines/:id',
    SEARCH: '/medicines/search',
  },
  INVENTORY: {
    LIST: '/inventory',
    SUMMARY: '/inventory/summary',
    ADD_STOCK: '/inventory/:id/add-stock',
  },
  SALES: {
    LIST: '/sales',
    GET: '/sales/:id',
    CREATE: '/sales',
    UPDATE: '/sales/:id',
    DELETE: '/sales/:id',
  },
  USERS: {
    LIST: '/users',
    GET: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },
  REPORTS: {
    DASHBOARD: '/reports/dashboard-summary',
    LOW_STOCK: '/reports/low-stock',
    EXPIRED: '/reports/expired-medicines',
  },
} as const
