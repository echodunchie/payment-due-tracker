import { useState, useEffect } from 'react'
import type { Bill } from '@/types'
import { billService } from '@/services'
import { useAuth } from './useAuth'

// Memory-based bill service for non-authenticated users
class MemoryBillService {
  private bills: Bill[] = []

  async getBills(): Promise<Bill[]> {
    return [...this.bills]
  }

  async addBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const bill: Bill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.bills.push(bill)
    return bill
  }

  async updateBill(id: string, billData: Partial<Bill>): Promise<Bill> {
    const index = this.bills.findIndex(b => b.id === id)
    if (index === -1) throw new Error('Bill not found')
    
    const updatedBill = { ...this.bills[index], ...billData, updatedAt: new Date() }
    this.bills[index] = updatedBill
    return updatedBill
  }

  async deleteBill(id: string): Promise<void> {
    this.bills = this.bills.filter(b => b.id !== id)
  }

  async clearAllBills(): Promise<void> {
    this.bills = []
  }
}

const memoryBillService = new MemoryBillService()

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  // Use different service based on authentication
  const currentService = isAuthenticated ? billService : memoryBillService

  const fetchBills = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedBills = await currentService.getBills()
      setBills(fetchedBills)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bills')
    } finally {
      setLoading(false)
    }
  }

  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBill = await currentService.addBill(billData)
      setBills(prev => [...prev, newBill].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()))
      return newBill
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bill')
      throw err
    }
  }

  const updateBill = async (id: string, billData: Partial<Bill>) => {
    try {
      const updatedBill = await currentService.updateBill(id, billData)
      setBills(prev => prev.map(bill => bill.id === id ? updatedBill : bill))
      return updatedBill
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bill')
      throw err
    }
  }

  const deleteBill = async (id: string) => {
    try {
      await currentService.deleteBill(id)
      setBills(prev => prev.filter(bill => bill.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bill')
      throw err
    }
  }

  const clearAllBills = async () => {
    try {
      await currentService.clearAllBills()
      setBills([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear bills')
      throw err
    }
  }

  useEffect(() => {
    fetchBills()
  }, [isAuthenticated]) // Re-fetch when authentication changes

  return {
    bills,
    loading,
    error,
    addBill,
    updateBill,
    deleteBill,
    clearAllBills,
    refetch: fetchBills
  }
}