import { useState, useEffect, useCallback } from 'react'
import type { User, AuthFormData } from '@/types'
import { authService } from '@/services'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔐 [AUTH CHECK] Starting auth check...')
      // First try the in-memory auth service (used in demo/local mode)
      let currentUser = await authService.getCurrentUser()

      // If in-memory service has no user, fall back to Supabase session user
      if (!currentUser) {
        try {
          const { data } = await supabase.auth.getUser()
          const su = data.user
          if (su) {
            currentUser = {
              id: su.id,
              email: su.email ?? '',
              isAuthenticated: true,
              isPremium: false,
              createdAt: new Date()
            }
          }
        } catch (err) {
          // ignore and keep currentUser as null
        }
      }

      setUser(currentUser)
      console.log('🔐 [AUTH CHECK] Auth check completed, user:', currentUser?.email || 'none')
    } catch (err) {
      console.log('🔐 [AUTH CHECK] Auth check failed:', err)
      setError(err instanceof Error ? err.message : 'Auth check failed')
      setUser(null)
    } finally {
      setLoading(false)
      console.log('🔐 [AUTH CHECK] Auth loading set to false')
    }
  }, [])

  const login = async (credentials: AuthFormData) => {
    try {
      setLoading(true)
      setError(null)
      const user = await authService.login(credentials)
      setUser(user)
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      setUser(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (credentials: AuthFormData) => {
    try {
      setLoading(true)
      setError(null)
      const user = await authService.register(credentials)
      setUser(user)
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      setUser(null)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      // Immediately clear user state for responsive UI
      setUser(null)
      setLoading(false)
      
      // Then perform the actual logout
      await authService.logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
      // If logout fails, we should still clear the user state
      setUser(null)
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [AUTH STATE CHANGE]', event, session?.user?.id)
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Prefer Supabase session user when available
        const su = session?.user
        if (su) {
          setUser({
            id: su.id,
            email: su.email ?? '',
            isAuthenticated: true,
            isPremium: false,
            createdAt: new Date()
          })
          setLoading(false)
          return
        }

        // Fallback to in-memory auth service
        try {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        } catch (err) {
          setUser(null)
        } finally {
          setLoading(false)
        }
        return
      }

      // Handle other auth events by ensuring loading is false
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    clearError
  }
}