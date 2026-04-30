import React, { createContext, useEffect, useState } from 'react'
import api, { AUTH_STORAGE_KEY, loadStoredAuth, setAuthToken } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => loadStoredAuth() || { user: null, token: null })
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(loadStoredAuth()?.token))
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    if (!authState?.token) {
      setIsBootstrapping(false)
      return
    }

    setAuthToken(authState.token)

    let isMounted = true

    const restoreSession = async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (isMounted) {
          const nextState = { user: data.user, token: authState.token }
          setAuthState(nextState)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState))
        }
      } catch (error) {
        if (isMounted) {
          setAuthToken(null)
          localStorage.removeItem(AUTH_STORAGE_KEY)
          setAuthState({ user: null, token: null })
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const persistAuth = (payload) => {
    setAuthToken(payload?.token || null)
    if (payload?.token && payload?.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
      setAuthState(payload)
      return
    }
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthState({ user: null, token: null })
  }

  const login = async (credentials) => {
    setIsAuthenticating(true)
    setAuthToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthState({ user: null, token: null })
    
    const { data } = await api.post('/auth/login', credentials)
    setAuthToken(data.token)
    persistAuth(data)
    setIsAuthenticating(false)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  }

  const logout = () => {
    setAuthToken(null)
    persistAuth(null)
  }

  const value = {
    user: authState.user,
    token: authState.token,
    isAuthenticated: Boolean(authState.token && authState.user),
    isBootstrapping,
    isAuthenticating,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}