import type { Bill } from '@/types'
import type { CalculationService } from './interfaces'
import { startOfDay, addDays, isAfter, isSameDay, format } from 'date-fns'

class InMemoryCalculationService implements CalculationService {
  async calculateCashFlow(availableMoney: number, bills: Bill[]) {
    // Sort bills by due date
    const sortedBills = [...bills].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    
    let remainingMoney = availableMoney
    const totalBills = sortedBills.reduce((sum, bill) => sum + bill.amount, 0)
    const dailyDeductions: Array<{
      date: Date
      bills: Bill[]
      totalAmount: number
      remainingBalance: number
    }> = []

    let safeZoneEndDate: Date | null = null
    let dangerZoneStartDate: Date | null = null
    let currentDate = startOfDay(new Date())

    // Group bills by due date
    const billsByDate = new Map<string, Bill[]>()
    
    for (const bill of sortedBills) {
      const dateKey = format(startOfDay(bill.dueDate), 'yyyy-MM-dd')
      if (!billsByDate.has(dateKey)) {
        billsByDate.set(dateKey, [])
      }
      billsByDate.get(dateKey)!.push(bill)
    }

    // Calculate daily deductions for the next 60 days (or until money runs out)
    for (let i = 0; i < 60; i++) {
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      const billsForDate = billsByDate.get(dateKey) || []
      
      if (billsForDate.length > 0) {
        const totalForDate = billsForDate.reduce((sum, bill) => sum + bill.amount, 0)
        remainingMoney -= totalForDate
        
        dailyDeductions.push({
          date: new Date(currentDate),
          bills: billsForDate,
          totalAmount: totalForDate,
          remainingBalance: remainingMoney
        })

        // Determine safe/danger zones
        if (remainingMoney >= 0 && safeZoneEndDate === null) {
          // Still in safe zone
          safeZoneEndDate = new Date(currentDate)
        } else if (remainingMoney < 0 && dangerZoneStartDate === null) {
          // Entering danger zone
          dangerZoneStartDate = new Date(currentDate)
          break // No point calculating further once we hit danger
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return {
      totalBills,
      remainingMoney: availableMoney - totalBills,
      safeZoneEndDate,
      dangerZoneStartDate,
      dailyDeductions
    }
  }

  async getDaysUntilDanger(availableMoney: number, bills: Bill[]): Promise<number | null> {
    const result = await this.calculateCashFlow(availableMoney, bills)
    
    if (!result.dangerZoneStartDate) {
      return null // No danger zone found
    }

    const today = startOfDay(new Date())
    const diffTime = result.dangerZoneStartDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  async getUpcomingBills(days: number): Promise<Bill[]> {
    // This would typically come from the bill service, but for now we'll return empty
    // In a real implementation, this would integrate with the bill service
    return []
  }
}

export const calculationService = new InMemoryCalculationService()