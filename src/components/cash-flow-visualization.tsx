'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import type { CalculationResult } from '@/types'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface CashFlowVisualizationProps {
  result: CalculationResult
  availableMoney: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function CashFlowVisualization({ result, availableMoney }: CashFlowVisualizationProps) {
  const currentMonth = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Create a map of dates to deductions for easy lookup
  const deductionMap = new Map<string, typeof result.dailyDeductions[0]>()
  result.dailyDeductions.forEach(deduction => {
    const dateKey = format(deduction.date, 'yyyy-MM-dd')
    deductionMap.set(dateKey, deduction)
  })

  // Determine financial status
  const getFinancialStatus = () => {
    if (result.remainingMoney >= 0) {
      return {
        status: 'safe',
        icon: TrendingUp,
        title: 'Safe Zone',
        description: 'Your money covers all upcoming bills',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-700 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800'
      }
    } else {
      return {
        status: 'danger',
        icon: AlertTriangle,
        title: 'Danger Zone',
        description: 'You may run short before all bills are paid',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800'
      }
    }
  }

  const status = getFinancialStatus()
  const StatusIcon = status.icon

  const getDayStatus = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    const deduction = deductionMap.get(dateKey)
    
    if (!deduction) return null
    
    if (deduction.remainingBalance < 0) {
      return 'danger'
    } else if (deduction.remainingBalance < availableMoney * 0.2) {
      return 'warning'
    }
    return 'safe'
  }

  const getDayClassName = (day: Date) => {
    const dayStatus = getDayStatus(day)
    const baseClasses = "relative"
    
    if (!dayStatus) return baseClasses
    
    const statusClasses = {
      danger: 'bg-red-500 text-white hover:bg-red-600',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      safe: 'bg-green-500 text-white hover:bg-green-600'
    }
    
    return cn(baseClasses, statusClasses[dayStatus])
  }

  return (
    <div className="space-y-6">
      {/* Financial Status Summary */}
      <Card className={cn("border-2", status.borderColor, status.bgColor)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-full", status.bgColor)}>
              <StatusIcon className={cn("h-6 w-6", status.textColor)} />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn("text-xl font-bold", status.textColor)}>
                  {status.title}
                </h3>
                <Badge variant={status.status === 'safe' ? 'default' : 'destructive'}>
                  {status.status === 'safe' ? 'All Good' : 'Attention Needed'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{status.description}</p>
              
              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Available Money</div>
                  <div className="text-2xl font-bold">{formatCurrency(availableMoney)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Bills</div>
                  <div className="text-2xl font-bold">{formatCurrency(result.totalBills)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">After Bills</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    result.remainingMoney >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(result.remainingMoney)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cash Flow Calendar - {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Low balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Danger zone</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const deduction = deductionMap.get(dateKey)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={index}
                  className={cn(
                    "p-2 text-center text-sm min-h-[50px] flex flex-col justify-between border rounded-md transition-colors",
                    getDayClassName(day),
                    isToday && "ring-2 ring-primary ring-offset-2",
                    !deduction && "hover:bg-muted"
                  )}
                  title={deduction ? `Bills: ${formatCurrency(deduction.totalAmount)} | Balance: ${formatCurrency(deduction.remainingBalance)}` : ''}
                >
                  <span className={cn(
                    "font-medium",
                    getDayStatus(day) ? "text-white" : ""
                  )}>
                    {format(day, 'd')}
                  </span>
                  {deduction && (
                    <div className="space-y-1">
                      <div className="text-xs opacity-90">
                        -{formatCurrency(deduction.totalAmount)}
                      </div>
                      <div className="text-xs font-medium">
                        {formatCurrency(deduction.remainingBalance)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      {result.dailyDeductions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.dailyDeductions.map((deduction, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border",
                  deduction.remainingBalance < 0 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
                  deduction.remainingBalance < availableMoney * 0.2 ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" :
                  "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                )}
              >
                <div className="space-y-1">
                  <div className="font-medium">{format(deduction.date, 'MMM dd, yyyy')}</div>
                  <div className="text-sm text-muted-foreground">
                    {deduction.bills.map(bill => bill.name).join(', ')}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-medium">-{formatCurrency(deduction.totalAmount)}</div>
                  <div className={cn(
                    "text-sm font-medium",
                    deduction.remainingBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    Balance: {formatCurrency(deduction.remainingBalance)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}