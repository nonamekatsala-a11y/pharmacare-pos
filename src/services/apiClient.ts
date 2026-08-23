import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@store/authStore'

// Use relative paths in development (proxied), absolute URL in production
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  : '/api'

console.log('API Base URL:', API_BASE_URL, 'PROD:', import.meta.env.PROD)

class ApiClient {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    })

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Add response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, logout
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  get instance() {
    return this.axiosInstance
  }
}

export const apiClient = new ApiClient().instance
