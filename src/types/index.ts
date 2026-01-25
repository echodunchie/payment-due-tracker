// Core data types for the payment due tracker

export interface Bill {
  id: string
  name: string
  amount: number
  dueDate: Date
  notificationFrequency: NotificationFrequency
  reminderEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export enum NotificationFrequency {
  NONE = 'none',
  ONE_DAY = '1_day',
  THREE_DAYS = '3_days',
  ONE_WEEK = '1_week',
  TWO_WEEKS = '2_weeks',
}

export type Currency = {
  code: string
  name: string
  symbol: string
}

export interface User {
  id: string
  email: string
  isAuthenticated: boolean
  isPremium: boolean
  availableMoney?: number
  createdAt: Date
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface CalculationResult {
  totalBills: number
  remainingMoney: number
  safeZoneEndDate: Date | null
  dangerZoneStartDate: Date | null
  dailyDeductions: DailyDeduction[]
}

export interface DailyDeduction {
  date: Date
  bills: Bill[]
  totalAmount: number
  remainingBalance: number
}

export interface AdPlacement {
  id: string
  type: 'banner' | 'rectangle' | 'sidebar'
  position: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

// Form types
export interface BillFormData {
  name: string
  amount: string
  dueDate: string
  notificationFrequency: NotificationFrequency
  reminderEnabled: boolean
}

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
}

export interface CalculatorState {
  availableMoney: number
  bills: Bill[]
  calculationResult: CalculationResult | null
}