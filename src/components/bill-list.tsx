'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Trash2, Calendar, Bell, BellOff } from 'lucide-react'
import { format } from 'date-fns'
import type { Bill } from '@/types'
import { cn } from '@/lib/utils'

interface BillListProps {
  bills: Bill[]
  onDeleteBill: (id: string) => void
  onUpdateBill: (id: string, updates: Partial<Bill>) => void
  isAuthenticated: boolean
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

const getFrequencyLabel = (frequency: string) => {
  const labels: Record<string, string> = {
    'none': 'No reminders',
    '1_day': '1 day before',
    '3_days': '3 days before',
    '1_week': '1 week before',
    '2_weeks': '2 weeks before'
  }
  return labels[frequency] || frequency
}

const getDaysUntilDue = (dueDate: Date) => {
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getDueDateBadgeVariant = (daysUntil: number) => {
  if (daysUntil < 0) return 'destructive' // Overdue
  if (daysUntil === 0) return 'destructive' // Due today
  if (daysUntil <= 3) return 'secondary' // Due soon
  return 'outline' // Due later
}

export function BillList({ bills, onDeleteBill, onUpdateBill, isAuthenticated }: BillListProps) {
  const handleToggleReminder = (bill: Bill) => {
    if (!isAuthenticated) return
    
    onUpdateBill(bill.id, {
      reminderEnabled: !bill.reminderEnabled
    })
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bills added yet</h3>
          <p className="text-muted-foreground">
            Start by adding your first bill to track your upcoming payments.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Bills ({bills.length})</CardTitle>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {bills.map((bill) => {
          const daysUntil = getDaysUntilDue(bill.dueDate)
          const badgeVariant = getDueDateBadgeVariant(daysUntil)
          
          return (
            <Card key={bill.id} className={cn(
              "relative",
              daysUntil <= 0 && "border-destructive/50 bg-destructive/5",
              daysUntil <= 3 && daysUntil > 0 && "border-yellow-500/50 bg-yellow-500/5"
            )}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{bill.name}</h3>
                      <Badge variant={badgeVariant}>
                        {daysUntil < 0 
                          ? `${Math.abs(daysUntil)} days overdue`
                          : daysUntil === 0
                            ? 'Due today'
                            : `Due in ${daysUntil} days`
                        }
                      </Badge>
                    </div>

                    {/* Mobile: show amount full-width above controls to avoid truncation */}
                    <div className="sm:hidden text-2xl font-bold mt-2">
                      {formatCurrency(bill.amount)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(bill.dueDate, 'MMM dd, yyyy')}
                      </div>
                      <div>
                        {getFrequencyLabel(bill.notificationFrequency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 min-w-0 sm:items-center sm:justify-end">
                    <div className="hidden sm:block text-2xl font-bold truncate w-24 sm:w-auto sm:text-right min-w-0">
                      {formatCurrency(bill.amount)}
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-2 shrink-0">
                        {bill.reminderEnabled ? (
                          <Bell className="h-4 w-4 text-green-600" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={bill.reminderEnabled}
                          onCheckedChange={() => handleToggleReminder(bill)}
                          disabled={!isAuthenticated}
                          className="data-[state=unchecked]:bg-muted"
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteBill(bill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}