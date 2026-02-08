'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Trash2, Info } from 'lucide-react'
import type { Bill } from '@/types'
import { NotificationFrequency } from '@/types'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BillFormProps {
  onAddBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => void
  isAuthenticated: boolean
}

export function BillForm({ onAddBill, isAuthenticated }: BillFormProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState<Date>()
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(NotificationFrequency.ONE_DAY)
  const [reminderEnabled, setReminderEnabled] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !amount || !dueDate) {
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    onAddBill({
      name: name.trim(),
      amount: parsedAmount,
      dueDate,
      notificationFrequency,
      reminderEnabled: isAuthenticated ? reminderEnabled : false
    })

    // Reset form
    setName('')
    setAmount('')
    setDueDate(undefined)
    setReminderEnabled(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Bill</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billName">Bill Name</Label>
              <Input
                id="billName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Electric bill"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Reminder Frequency</Label>
            <Select value={notificationFrequency} onValueChange={(value: NotificationFrequency) => setNotificationFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationFrequency.NONE}>No reminders</SelectItem>
                <SelectItem value={NotificationFrequency.ONE_DAY}>1 day before</SelectItem>
                <SelectItem value={NotificationFrequency.THREE_DAYS}>3 days before</SelectItem>
                <SelectItem value={NotificationFrequency.ONE_WEEK}>1 week before</SelectItem>
                <SelectItem value={NotificationFrequency.TWO_WEEKS}>2 weeks before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="reminderToggle">Enable Reminders</Label>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  Login to enable reminders
                </p>
              )}
            </div>
            <Switch
              id="reminderToggle"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={!isAuthenticated}
            />
          </div>

          <Button type="submit" className="w-full">
            Add Bill
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}