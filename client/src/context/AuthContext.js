import React, { createContext, useEffect, useState } from 'react'
import api, { AUTH_STORAGE_KEY, loadStoredAuth, setAuthToken } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => loadStoredAuth() || { user: null, token: null });
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(loadStoredAuth()?.token));

  useEffect(() => {
    if (!authState?.token) {
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;

    const restoreSession = async () => {
      try {
        setAuthToken(authState.token);
        const { data } = await api.get('/api/auth/me');

        if (isMounted) {
          const nextState = { user: data.user, token: authState.token };
          setAuthState(nextState);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
        }
      } catch (error) {
        if (isMounted) {
          setAuthToken(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setAuthState({ user: null, token: null });
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [])

  const persistAuth = (payload) => {
    setAuthToken(payload?.token || null);

    if (payload?.token && payload?.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      setAuthState(payload);
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({ user: null, token: null });
  };

  const login = async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials);
    persistAuth(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    persistAuth(data);
    return data;
  };

  const logout = () => {
    persistAuth(null);
  };

  const value = {
    user: authState.user,
    token: authState.token,
    isAuthenticated: Boolean(authState.token && authState.user),
    isBootstrapping,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};