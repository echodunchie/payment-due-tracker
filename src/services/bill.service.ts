import type { Bill } from '@/types'
import type { BillService } from './interfaces'

class InMemoryBillService implements BillService {
  private bills: Bill[] = []

  async getBills(): Promise<Bill[]> {
    return [...this.bills].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  async addBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const bill: Bill = {
      ...billData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.bills.push(bill)
    return bill
  }

  async updateBill(id: string, billData: Partial<Bill>): Promise<Bill> {
    const index = this.bills.findIndex(bill => bill.id === id)
    
    if (index === -1) {
      throw new Error(`Bill with id ${id} not found`)
    }

    this.bills[index] = {
      ...this.bills[index],
      ...billData,
      updatedAt: new Date()
    }

    return this.bills[index]
  }

  async deleteBill(id: string): Promise<void> {
    const index = this.bills.findIndex(bill => bill.id === id)
    
    if (index === -1) {
      throw new Error(`Bill with id ${id} not found`)
    }

    this.bills.splice(index, 1)
  }

  async clearAllBills(): Promise<void> {
    this.bills = []
  }
}

export const billService = new InMemoryBillService()