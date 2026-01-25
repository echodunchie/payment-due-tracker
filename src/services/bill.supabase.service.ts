import type { Bill } from '@/types'
import type { BillService } from './interfaces'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { DatabaseBill } from '@/lib/supabase'

class SupabaseBillService implements BillService {
  async getBills(): Promise<Bill[]> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Fetching bills for user:', session.user.id)

    // Ensure user profile exists
    await this.ensureUserProfile(session.user.id, session.user.email!)

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', session.user.id)
      .order('due_date', { ascending: true })

    if (error) {
      console.log('❌ [SUPABASE BILLS] Fetch error:', error.message)
      throw new Error(`Failed to fetch bills: ${error.message}`)
    }

    console.log('✅ [SUPABASE BILLS] Fetched', data.length, 'bills')
    return data.map(this.mapDatabaseBillToBill)
  }

  async addBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Adding bill:', billData.name)
    console.log('📋 [SUPABASE BILLS] User ID:', session.user.id)

    // Ensure user profile exists before adding bill
    await this.ensureUserProfile(session.user.id, session.user.email!)

    const { data, error } = await supabase
      .from('bills')
      .insert({
        user_id: session.user.id,
        name: billData.name,
        amount: billData.amount,
        due_date: format(billData.dueDate, 'yyyy-MM-dd'),
        notification_frequency: billData.notificationFrequency,
        reminder_enabled: billData.reminderEnabled
      })
      .select()
      .single()

    if (error) {
      console.log('❌ [SUPABASE BILLS] Add error:', error.message)
      console.log('❌ [SUPABASE BILLS] Error details:', error)
      throw new Error(`Failed to add bill: ${error.message}`)
    }

    console.log('✅ [SUPABASE BILLS] Bill added successfully:', data.name)
    return this.mapDatabaseBillToBill(data)
  }

  private async ensureUserProfile(userId: string, email: string): Promise<void> {
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (checkError) {
      console.log('❌ [SUPABASE BILLS] Error checking user profile:', checkError.message)
      throw new Error(`Failed to verify user profile: ${checkError.message}`)
    }

    if (!existingProfile) {
      console.log('📋 [SUPABASE BILLS] Creating missing user profile for:', email)

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          is_premium: false
        }, { onConflict: 'id' })

      if (upsertError) {
        console.log('❌ [SUPABASE BILLS] Failed to create user profile (upsert):', upsertError.message)
        throw new Error(`Failed to create user profile: ${upsertError.message}`)
      }

      console.log('✅ [SUPABASE BILLS] User profile created successfully')
    }
  }

  async updateBill(id: string, updates: Partial<Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Bill> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Updating bill:', id)

    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.dueDate !== undefined) updateData.due_date = format(updates.dueDate, 'yyyy-MM-dd')
    if (updates.notificationFrequency !== undefined) updateData.notification_frequency = updates.notificationFrequency
    if (updates.reminderEnabled !== undefined) updateData.reminder_enabled = updates.reminderEnabled

    const { data, error } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user owns this bill
      .select()
      .single()

    if (error) {
      console.log('❌ [SUPABASE BILLS] Update error:', error.message)
      throw new Error(`Failed to update bill: ${error.message}`)
    }

    console.log('✅ [SUPABASE BILLS] Bill updated successfully:', data.name)
    return this.mapDatabaseBillToBill(data)
  }

  async deleteBill(id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Deleting bill:', id)

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user owns this bill

    if (error) {
      console.log('❌ [SUPABASE BILLS] Delete error:', error.message)
      throw new Error(`Failed to delete bill: ${error.message}`)
    }

    console.log('✅ [SUPABASE BILLS] Bill deleted successfully')
  }

  async getBillById(id: string): Promise<Bill | null> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Fetching bill by ID:', id)

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user owns this bill
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null
      }
      console.log('❌ [SUPABASE BILLS] Fetch by ID error:', error.message)
      throw new Error(`Failed to fetch bill: ${error.message}`)
    }

    return this.mapDatabaseBillToBill(data)
  }

  async clearAllBills(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    console.log('📋 [SUPABASE BILLS] Clearing all bills for user:', session.user.id)

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('user_id', session.user.id)

    if (error) {
      console.log('❌ [SUPABASE BILLS] Clear all error:', error.message)
      throw new Error(`Failed to clear bills: ${error.message}`)
    }

    console.log('✅ [SUPABASE BILLS] All bills cleared successfully')
  }

  private mapDatabaseBillToBill(dbBill: DatabaseBill): Bill {
    // Parse stored YYYY-MM-DD into a local Date (avoid UTC shift when using new Date('YYYY-MM-DD'))
    const [y, m, d] = (dbBill.due_date || '').split('-').map(Number)
    const localDueDate = Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)
      ? new Date(y, m - 1, d)
      : new Date(dbBill.due_date)

    return {
      id: dbBill.id,
      name: dbBill.name,
      amount: dbBill.amount,
      dueDate: localDueDate,
      notificationFrequency: dbBill.notification_frequency as any,
      reminderEnabled: dbBill.reminder_enabled,
      createdAt: new Date(dbBill.created_at),
      updatedAt: new Date(dbBill.updated_at)
    }
  }
}

export const billService = new SupabaseBillService()