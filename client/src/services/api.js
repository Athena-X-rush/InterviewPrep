import axios from 'axios'

export const AUTH_STORAGE_KEY = 'aiquiz-auth'

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5050/api'
  }

  const { hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5050/api'
  }

  return '/api'
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

export const loadStoredAuth = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export default api
