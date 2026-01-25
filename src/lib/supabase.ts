import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types for type safety
export interface DatabaseUser {
  id: string
  email: string
  is_premium: boolean
  available_money: number
  created_at: string
  updated_at: string
}

export interface DatabaseBill {
  id: string
  user_id: string
  name: string
  amount: number
  due_date: string
  notification_frequency: string
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>
      }
      bills: {
        Row: DatabaseBill
        Insert: Omit<DatabaseBill, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseBill, 'id' | 'created_at'>>
      }
    }
  }
}