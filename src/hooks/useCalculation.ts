import { useState, useCallback } from 'react'
import type { Bill, CalculationResult } from '@/types'
import { calculationService } from '@/services'

export function useCalculation() {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateCashFlow = useCallback(async (availableMoney: number, bills: Bill[]) => {
    try {
      setLoading(true)
      setError(null)
      const calculation = await calculationService.calculateCashFlow(availableMoney, bills)
      setResult(calculation)
      return calculation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getDaysUntilDanger = useCallback(async (availableMoney: number, bills: Bill[]) => {
    try {
      return await calculationService.getDaysUntilDanger(availableMoney, bills)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate days until danger')
      throw err
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    result,
    loading,
    error,
    calculateCashFlow,
    getDaysUntilDanger,
    clearResult
  }
}