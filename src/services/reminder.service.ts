import type { ReminderService } from './interfaces'
import { emailService } from './email.service'
import { authService } from './auth.service'

class InMemoryReminderService implements ReminderService {
  private reminders: Map<string, boolean> = new Map()

  async scheduleReminder(billId: string): Promise<void> {
    console.log(`[MOCK] Scheduling reminder for bill ${billId}`)
    this.reminders.set(billId, true)
  }

  async cancelReminder(billId: string): Promise<void> {
    console.log(`[MOCK] Cancelling reminder for bill ${billId}`)
    this.reminders.set(billId, false)
  }

  async getReminderStatus(billId: string): Promise<boolean> {
    return this.reminders.get(billId) ?? false
  }

  async sendTestReminder(email: string): Promise<void> {
    console.log(`[MOCK] Sending test reminder to ${email}`)
    try {
      await emailService.sendTestEmail(email)
    } catch (error) {
      console.error('Failed to send test reminder email:', error)
      throw error
    }
  }

  // New method to send bill reminder emails
  async sendBillReminder(billId: string, billName: string, amount: number, dueDate: Date): Promise<void> {
    const currentUser = await authService.getCurrentUser()
    
    if (!currentUser) {
      throw new Error('User must be authenticated to receive email reminders')
    }

    try {
      await emailService.sendBillReminderEmail(currentUser.email, billName, amount, dueDate)
      console.log(`[MOCK] Bill reminder sent to ${currentUser.email} for ${billName}`)
    } catch (error) {
      console.error('Failed to send bill reminder email:', error)
      throw error
    }
  }
}

export const reminderService = new InMemoryReminderService()