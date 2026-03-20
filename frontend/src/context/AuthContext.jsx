import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bt_token') || null)
  const [adminUser, setAdminUser] = useState(() => localStorage.getItem('bt_user') || null)

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setToken(data.token)
    setAdminUser(data.username)
    localStorage.setItem('bt_token', data.token)
    localStorage.setItem('bt_user', data.username)
    return data
  }, [])

  const logout = useCallback(() => {
    setToken(null); setAdminUser(null)
    localStorage.removeItem('bt_token')
    localStorage.removeItem('bt_user')
  }, [])

  return (
    <AuthContext.Provider value={{ token, adminUser, login, logout, isAdmin: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
