import { createContext, useContext, useState, useCallback } from 'react'
import { authAPI } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('tsa_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('tsa_token'))

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('tsa_token', data.access_token)
    localStorage.setItem('tsa_user', JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authAPI.register(payload)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tsa_token')
    localStorage.removeItem('tsa_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
