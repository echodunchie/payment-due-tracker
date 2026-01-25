import type { User, AuthFormData } from '@/types'
import type { AuthService } from './interfaces'
import { supabase } from '@/lib/supabase'
import type { DatabaseUser } from '@/lib/supabase'

class SupabaseAuthService implements AuthService {
  async login(credentials: AuthFormData): Promise<User> {
    console.log('🔐 [SUPABASE AUTH] Login attempt for:', credentials.email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      console.log('❌ [SUPABASE AUTH] Login error:', error.message)
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Login failed - no user returned')
    }

    // Get user profile from our users table (handle unexpected multiple rows)
    let profile: DatabaseUser | null = null
    try {
      const { data: p, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) throw profileError
      profile = p as DatabaseUser | null
    } catch (err: any) {
      console.log('❌ [SUPABASE AUTH] Profile fetch error:', err?.message || err)
      // Fallback: if the query returned multiple rows unexpectedly, fetch the first one
      try {
        const { data: rows, error: rowsErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .limit(1)

        if (rowsErr) throw rowsErr
        profile = Array.isArray(rows) && rows.length > 0 ? (rows[0] as DatabaseUser) : null
      } catch (fallbackErr: any) {
        console.log('❌ [SUPABASE AUTH] Fallback profile fetch failed:', fallbackErr?.message || fallbackErr)
        profile = null
      }
    }

    if (!profile) {
      console.log('❌ [SUPABASE AUTH] Profile not found by id for user:', data.user.id)

      // Try to find an existing profile by email and reconcile
      let byEmail: DatabaseUser | null = null
      try {
        const { data: be, error: byEmailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .maybeSingle()
        if (byEmailError) throw byEmailError
        byEmail = be as DatabaseUser | null
      } catch (err: any) {
        console.log('❌ [SUPABASE AUTH] By-email lookup error:', err?.message || err)
        // Fallback to first matching row
        try {
          const { data: rows, error: rowsErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .limit(1)
          if (rowsErr) throw rowsErr
          byEmail = Array.isArray(rows) && rows.length > 0 ? (rows[0] as DatabaseUser) : null
        } catch (fallbackErr: any) {
          console.log('❌ [SUPABASE AUTH] By-email fallback failed:', fallbackErr?.message || fallbackErr)
          byEmail = null
        }
      }

      if (byEmail) {
        const oldId = byEmail.id
        console.log('🔧 [SUPABASE AUTH] Found profile by email with id:', oldId)

        // Upsert profile to ensure the row uses the auth user id (reconcile)
        const { data: upserted, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: credentials.email,
            is_premium: byEmail.is_premium ?? false,
            available_money: byEmail.available_money ?? 0.00
          }, { onConflict: 'email' })
          .select()
          .maybeSingle()

        if (upsertError) {
          console.log('❌ [SUPABASE AUTH] Upsert error:', upsertError.message)
          throw new Error('Failed to reconcile user profile')
        }

        const upsertProfile = upserted as DatabaseUser | null

        // Transfer any bills from the old profile id to the new auth id
        if (oldId && oldId !== data.user.id) {
          const { error: billsError } = await supabase
            .from('bills')
            .update({ user_id: data.user.id })
            .eq('user_id', oldId)

          if (billsError) {
            console.log('❌ [SUPABASE AUTH] Failed to transfer bills:', billsError.message)
            throw new Error('Failed to reconcile user data')
          }
        }

        console.log('✅ [SUPABASE AUTH] Reconciled profile and transferred bills')
        console.log('✅ [SUPABASE AUTH] Login successful for:', credentials.email)
        return this.mapDatabaseUserToUser(upsertProfile!)
      }

      // No profile by id or email — create one
      const { data: inserted, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: credentials.email,
          is_premium: false,
          available_money: 0.00
        })
        .select()
        .limit(1)

      if (createError) {
        console.log('❌ [SUPABASE AUTH] Failed to create missing profile:', createError.message)
        throw new Error('Failed to create user profile')
      }

      const createdProfile = Array.isArray(inserted) ? inserted[0] as DatabaseUser : inserted as DatabaseUser
      console.log('✅ [SUPABASE AUTH] Missing profile created successfully')
      console.log('✅ [SUPABASE AUTH] Login successful for:', credentials.email)
      return this.mapDatabaseUserToUser(createdProfile)
    }

    console.log('✅ [SUPABASE AUTH] Login successful for:', credentials.email)
    
    return this.mapDatabaseUserToUser(profile)
  }

  async register(credentials: AuthFormData): Promise<User> {
    console.log('🔐 [SUPABASE AUTH] Registration attempt for:', credentials.email)
    
    if (credentials.password !== credentials.confirmPassword) {
      console.log('❌ [SUPABASE AUTH] Password confirmation mismatch')
      throw new Error('Passwords do not match')
    }

    try {
      console.log('🔐 [SUPABASE AUTH] Step 1: Creating auth user...')
      
      // Create auth user with timeout
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for dev
        }
      })

      if (error) {
        console.log('❌ [SUPABASE AUTH] Registration error:', error.message)
        console.log('❌ [SUPABASE AUTH] Error code:', error.status)
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Registration failed - no user returned')
      }

      console.log('🔐 [SUPABASE AUTH] Step 2: User created in auth.users, ID:', data.user.id)
      console.log('🔧 [SUPABASE AUTH] Step 3: Creating user profile manually...')

      // First, check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (existingProfile && !checkError) {
        console.log('✅ [SUPABASE AUTH] Profile already exists, using existing profile')
        return this.mapDatabaseUserToUser(existingProfile)
      }

      // Create user profile manually (no automatic trigger) using upsert
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: credentials.email,
          is_premium: false,
          available_money: 0.00
        }, {
          onConflict: 'id'
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ [SUPABASE AUTH] Profile creation error:', createError.message)
        console.log('❌ [SUPABASE AUTH] Error details:', createError)
        
        throw new Error(`Failed to create user profile: ${createError.message}`)
      }

      console.log('✅ [SUPABASE AUTH] User registered successfully:', credentials.email)
      return this.mapDatabaseUserToUser(newProfile)
      
    } catch (error) {
      console.log('❌ [SUPABASE AUTH] Registration failed:', error)
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Registration failed - please check your connection and try again')
      }
    }
  }

  async logout(): Promise<void> {
    console.log('🔐 [SUPABASE AUTH] Logout attempt')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.log('❌ [SUPABASE AUTH] Logout error:', error.message)
      throw new Error(error.message)
    }
    
    console.log('✅ [SUPABASE AUTH] Logout successful')
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return null
    }
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.log('❌ [SUPABASE AUTH] Current user fetch error:', error.message)

      // Try to find by email and reconcile
      const { data: byEmail, error: byEmailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email || '')
        .single()

      if (byEmail && !byEmailError) {
        const oldId = byEmail.id
        console.log('🔧 [SUPABASE AUTH] Found profile by email for current user, id:', oldId)

        const { data: upserted, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email || '',
            is_premium: byEmail.is_premium ?? false,
            available_money: byEmail.available_money ?? 0.00
          }, { onConflict: 'email' })
          .select()
          .single()

        if (upsertError) {
          console.log('❌ [SUPABASE AUTH] Upsert error for current user:', upsertError.message)
          return null
        }

        if (oldId && oldId !== session.user.id) {
          const { error: billsError } = await supabase
            .from('bills')
            .update({ user_id: session.user.id })
            .eq('user_id', oldId)

          if (billsError) {
            console.log('❌ [SUPABASE AUTH] Failed to transfer bills for current user:', billsError.message)
            return null
          }
        }

        console.log('✅ [SUPABASE AUTH] Missing profile reconciled for current user')
        return this.mapDatabaseUserToUser(upserted)
      }

      // No profile found
      return null
    }

    return this.mapDatabaseUserToUser(profile)
  }

  isAuthenticated(): boolean {
    try {
      // This is a synchronous check; may not reflect latest auth state if not cached
      const session = supabase.auth.getSession()
      return !!session
    } catch {
      return false
    }
  }

  private mapDatabaseUserToUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      isAuthenticated: true,
      isPremium: dbUser.is_premium,
      availableMoney: Number(dbUser.available_money) || 0,
      createdAt: new Date(dbUser.created_at)
    }
  }

  async updateAvailableMoney(amount: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('💰 [SUPABASE AUTH] Updating available money to:', amount)

    const { error } = await supabase
      .from('users')
      .update({ available_money: amount })
      .eq('id', session.user.id)

    if (error) {
      console.log('❌ [SUPABASE AUTH] Update available money error:', error.message)
      throw new Error(`Failed to update available money: ${error.message}`)
    }

    console.log('✅ [SUPABASE AUTH] Available money updated successfully')
  }
}

export const authService = new SupabaseAuthService()