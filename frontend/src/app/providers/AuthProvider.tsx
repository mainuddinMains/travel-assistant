
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { logout as logoutApi } from '../../features/auth/api'

type User = { id: string | number; name: string }
type AuthCtx = {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Load saved authentication from localStorage
    const saved = localStorage.getItem('auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed.user)
        setToken(parsed.token)
      } catch (error) {
        console.error('Failed to parse saved auth:', error)
        localStorage.removeItem('auth')
      }
    }
    
    // Check for autologin parameter (for development)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autologin') === '1') {
      const fake = { user: { id: 'u_dev', name: 'Dev Tester' }, token: 'dev-token' };
      localStorage.setItem('auth', JSON.stringify(fake));
      setUser(fake.user);
      setToken(fake.token);
    }
  }, []);
  

  const value = useMemo(() => ({
    user, token,
    login: (u: User, t: string) => {
      console.log('AuthProvider login called with:', { user: u, token: t })
      setUser(u); setToken(t)
      localStorage.setItem('auth', JSON.stringify({ user: u, token: t }))
      console.log('Auth state updated, localStorage saved')
    },
    logout: async () => {
      console.log('AuthProvider logout called')
      try {
        if (token) {
          await logoutApi()
        }
      } catch (error) {
        console.error('Logout API call failed:', error)
      } finally {
        setUser(null); setToken(null)
        localStorage.removeItem('auth')
      }
    }
  }), [user, token])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
