import type { Bill, User, AuthFormData } from '@/types'

export interface BillService {
  getBills(): Promise<Bill[]>
  addBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill>
  updateBill(id: string, bill: Partial<Bill>): Promise<Bill>
  deleteBill(id: string): Promise<void>
  clearAllBills(): Promise<void>
}

export interface AuthService {
  login(credentials: AuthFormData): Promise<User>
  register(credentials: AuthFormData): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  isAuthenticated(): boolean
}

export interface ReminderService {
  scheduleReminder(billId: string): Promise<void>
  cancelReminder(billId: string): Promise<void>
  getReminderStatus(billId: string): Promise<boolean>
  sendTestReminder(email: string): Promise<void>
}

export interface CalculationService {
  calculateCashFlow(availableMoney: number, bills: Bill[]): Promise<{
    totalBills: number
    remainingMoney: number
    safeZoneEndDate: Date | null
    dangerZoneStartDate: Date | null
    dailyDeductions: Array<{
      date: Date
      bills: Bill[]
      totalAmount: number
      remainingBalance: number
    }>
  }>
  
  getDaysUntilDanger(availableMoney: number, bills: Bill[]): Promise<number | null>
  getUpcomingBills(days: number): Promise<Bill[]>
}

export interface EmailService {
  sendWelcomeEmail(email: string, name?: string): Promise<void>
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>
  sendBillReminderEmail(email: string, billName: string, amount: number, dueDate: Date): Promise<void>
  sendTestEmail(email: string): Promise<void>
}

export interface StorageService {
  setItem<T>(key: string, value: T): Promise<void>
  getItem<T>(key: string): Promise<T | null>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}