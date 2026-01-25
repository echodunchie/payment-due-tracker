'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { AdPlaceholder } from '@/components/ui/ad-placeholder'
import { BillForm } from '@/components/bill-form'
import { BillList } from '@/components/bill-list'
import { CashFlowVisualization } from '@/components/cash-flow-visualization'
import { 
  Calendar, 
  Calculator, 
  User, 
  LogOut, 
  Settings,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useBills, useAuth, useCalculation } from '@/hooks'
import { emailService, authService } from '@/services'
import type { Bill, NotificationFrequency, Currency } from '@/types'

const currencies: Currency[] = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
]

const getCurrencyIcon = (currencyCode: string) => {
  switch (currencyCode) {
    case 'USD':
    case 'AUD':
    case 'CAD':
      return DollarSign
    case 'EUR':
      return () => <span className="text-lg font-bold">€</span>
    case 'GBP':
      return () => <span className="text-lg font-bold">£</span>
    case 'JPY':
    case 'CNY':
      return () => <span className="text-lg font-bold">¥</span>
    case 'PHP':
      return () => <span className="text-lg font-bold">₱</span>
    case 'KRW':
      return () => <span className="text-lg font-bold">₩</span>
    case 'INR':
      return () => <span className="text-lg font-bold">₹</span>
    default:
      return DollarSign
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export default function CalculatorPage() {
  const [availableMoney, setAvailableMoney] = useState('')
  const [showCalculation, setShowCalculation] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]) // PHP as default
  
  const router = useRouter()
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const { bills, loading: billsLoading, addBill, updateBill, deleteBill } = useBills()
  const { result, loading: calculationLoading, calculateCashFlow } = useCalculation()

  // Load available money from user data
  useEffect(() => {
    if (user?.availableMoney !== undefined) {
      setAvailableMoney(user.availableMoney.toString())
    }
  }, [user])

  // Save available money when it changes
  const handleAvailableMoneyChange = async (value: string) => {
    setAvailableMoney(value)
    
    // Only save to database if user is authenticated
    if (isAuthenticated) {
      const amount = parseFloat(value)
      if (!isNaN(amount) && amount >= 0) {
        try {
          await authService.updateAvailableMoney(amount)
        } catch (error) {
          console.error('Failed to save available money:', error)
        }
      }
    }
  }

  // No redirect for unauthenticated users - allow "Try Free" mode
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     router.push('/auth')
  //   }
  // }, [isAuthenticated, authLoading, router])

  // Show loading while checking authentication (with timeout fallback)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calculator...</p>
          <p className="text-xs text-muted-foreground mt-2">
            If this takes too long, try refreshing the page
          </p>
        </div>
      </div>
    )
  }

  const handleAddBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔧 [CALCULATOR] Adding bill:', billData)
      await addBill(billData)
      console.log('✅ [CALCULATOR] Bill added successfully')
      toast.success('Bill added successfully!')
    } catch (error) {
      console.error('❌ [CALCULATOR] Failed to add bill:', error)
      toast.error('Failed to add bill')
    }
  }

  const handleUpdateBill = async (id: string, updates: Partial<Bill>) => {
    try {
      await updateBill(id, updates)
      toast.success('Bill updated!')
    } catch (error) {
      toast.error('Failed to update bill')
    }
  }

  const handleDeleteBill = async (id: string) => {
    try {
      await deleteBill(id)
      toast.success('Bill deleted!')
      setShowCalculation(false) // Hide calculation when bills change
    } catch (error) {
      toast.error('Failed to delete bill')
    }
  }

  const handleCalculate = async () => {
    const money = parseFloat(availableMoney)
    
    if (isNaN(money) || money < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (bills.length === 0) {
      toast.error('Please add at least one bill')
      return
    }

    try {
      await calculateCashFlow(money, bills)
      setShowCalculation(true)
      toast.success('Calculation complete!')
    } catch (error) {
      toast.error('Calculation failed')
    }
  }

  const handleLogout = async () => {
    try {
      // Redirect immediately for better UX
      router.push('/')
      toast.success('Logged out successfully!')
      
      // Logout in background
      await logout()
    } catch (error) {
      toast.error('Logout failed')
      // Still redirect even if logout fails
      router.push('/')
    }
  }

  const handleTestEmail = async () => {
    if (!user?.email) {
      toast.error('No email found for current user')
      return
    }

    try {
      console.log('🧪 Testing email functionality for:', user.email)
      await emailService.sendTestEmail(user.email)
      toast.success('Test email sent! Check your browser console for the mock email content.')
      console.log('✅ Test email completed successfully!')
    } catch (error) {
      console.error('❌ Test email failed:', error)
      toast.error('Failed to send test email')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Live calculation display
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const availableAmount = parseFloat(availableMoney) || 0
  const remainingAmount = availableAmount - totalBills

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PayTracker
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.email}</span>
                    {user?.isPremium && (
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleTestEmail}>
                    📧 Test Email
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Free Trial Banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-primary/10 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/20 p-1 rounded">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    You're using PayTracker in free trial mode
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Data won't be saved. Sign in to save your bills and get email reminders.
                  </p>
                </div>
              </div>
              <Link href="/auth">
                <Button size="sm" variant="default">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-8"
        >
          {/* Header with Step Indicator */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Payment Calculator
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {isAuthenticated 
                  ? "Track your bills and visualize your cash flow. Your data is saved automatically."
                  : "Try the calculator without signing up. Your data lives in memory only - sign in to save it."
                }
              </p>
            </div>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 md:space-x-8 py-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="text-sm font-medium">Set Money</span>
              </div>
              <div className="w-8 h-1 bg-muted rounded"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  bills.length > 0 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Add Bills</span>
              </div>
              <div className="w-8 h-1 bg-muted rounded"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  showCalculation 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  3
                </div>
                <span className="text-sm font-medium">View Results</span>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="pt-4">
                <AdPlaceholder type="banner" className="max-w-4xl mx-auto" />
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Money Input and Bills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Available Money Input */}
              <Card className={`transition-all duration-300 ${
                !availableMoney ? 'ring-2 ring-primary/50 bg-primary/5' : 'hover:shadow-lg'
              }`}>
                <CardHeader className="bg-primary/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const CurrencyIcon = getCurrencyIcon(selectedCurrency.code)
                        return <CurrencyIcon className="h-5 w-5" />
                      })()}
                      <span>Set Your Available Money</span>
                    </div>
                    {availableMoney && (
                      <Badge variant="secondary" className="ml-auto">
                        ✓ Complete
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Enter how much money you currently have available
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="availableMoney" className="text-base font-semibold">
                        Available Money ({selectedCurrency.symbol})
                      </Label>
                      <Input
                        id="availableMoney"
                        type="number"
                        step="0.01"
                        min="0"
                        value={availableMoney}
                        onChange={(e) => handleAvailableMoneyChange(e.target.value)}
                        placeholder="Enter amount..."
                        className="text-xl h-12 text-center font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-base font-semibold">Currency</Label>
                      <Select 
                        value={selectedCurrency.code} 
                        onValueChange={(value) => {
                          const currency = currencies.find(c => c.code === value)
                          if (currency) setSelectedCurrency(currency)
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              <span className="flex items-center gap-2">
                                <span className="font-mono text-lg">{currency.symbol}</span>
                                <span className="font-medium">{currency.code}</span>
                                <span className="text-muted-foreground">- {currency.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Live Money Preview */}
                  {availableMoney && (
                    <div className="border-2 border-primary/20 rounded-xl p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Available Money</div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(parseFloat(availableMoney))}
                        </div>
                        {bills.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ready to calculate with {bills.length} bill{bills.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Bill Form */}
              <Card className={`transition-all duration-300 ${
                bills.length === 0 && availableMoney ? 'ring-2 ring-primary/50 bg-primary/5' : 'hover:shadow-lg'
              }`}>
                <CardHeader className="bg-muted/30 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      bills.length > 0 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <span>Add Your Bills</span>
                    {bills.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Add all your upcoming bills and payments
                  </CardDescription>
                </CardHeader>
              </Card>
              <div className="-mt-4">
                <BillForm onAddBill={handleAddBill} isAuthenticated={isAuthenticated} />
              </div>

              {/* Bill List */}
              {billsLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </CardContent>
                </Card>
              ) : (
                <BillList 
                  bills={bills}
                  onDeleteBill={handleDeleteBill}
                  onUpdateBill={handleUpdateBill}
                  isAuthenticated={isAuthenticated}
                />
              )}

              {/* Calculate Action Area - Between Steps 2 and 3 */}
              {availableMoney && bills.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-foreground/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium">Calculate</span>
                  </div>
                </div>
              )}
              
              {availableMoney && bills.length > 0 && (
                <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Ready to Calculate!</h3>
                        <p className="text-sm text-muted-foreground">You have {formatCurrency(parseFloat(availableMoney))} and {bills.length} bill{bills.length !== 1 ? 's' : ''} to analyze.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Available</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(availableAmount)}
                          </div>
                        </div>
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Total Bills</div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(totalBills)}
                          </div>
                        </div>
                        <div className="bg-background/60 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Remaining</div>
                          <div className={`text-lg font-bold ${
                            remainingAmount >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(remainingAmount)}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleCalculate} 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        disabled={calculationLoading || billsLoading}
                        size="lg"
                      >
                        {calculationLoading ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Calculating Your Cash Flow...
                          </>
                        ) : (
                          <>
                            <Calculator className="mr-3 h-6 w-6" />
                            Calculate Full Cash Flow Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Step 3: Calculation Results */}
            <div className="space-y-6">
              {!isAuthenticated && (
                <AdPlaceholder type="sidebar" />
              )}
              
              <Card className={`transition-all duration-300 ${
                showCalculation ? 'ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
              }`}>
                <CardHeader className={`${showCalculation ? 'bg-green-100/50 dark:bg-green-950/30' : 'bg-muted/30'} rounded-t-lg`}>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      showCalculation 
                        ? 'bg-green-600 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      3
                    </div>
                    <span>Cash Flow Results</span>
                    {showCalculation && (
                      <Badge variant="default" className="ml-auto bg-green-600">
                        ✓ Complete
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {showCalculation && result ? (
                    <CashFlowVisualization 
                      result={result} 
                      availableMoney={parseFloat(availableMoney)} 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        (!availableMoney || bills.length === 0) 
                          ? 'bg-yellow-100 dark:bg-yellow-950/30' 
                          : 'bg-primary/10'
                      }`}>
                        <TrendingUp className={`h-8 w-8 ${
                          (!availableMoney || bills.length === 0) 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-primary'
                        }`} />
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">
                        {!availableMoney 
                          ? 'Set Your Available Money' 
                          : bills.length === 0 
                            ? 'Add Your Bills' 
                            : 'Ready to Calculate'
                        }
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 text-sm">
                        {!availableMoney 
                          ? 'Enter your available money amount in Step 1 to get started.' 
                          : bills.length === 0 
                            ? 'Add your bills in Step 2, then calculate your cash flow.' 
                            : 'Click the calculate button above to see your detailed cash flow analysis.'
                        }
                      </p>
                      
                      {(!availableMoney || bills.length === 0) && (
                        <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                          <div className="font-medium text-foreground mb-1">What you'll get:</div>
                          {!availableMoney && (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              <span>Real-time money tracking</span>
                            </div>
                          )}
                          {bills.length === 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              <span>Bill management & reminders</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Cash flow visualization</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Financial insights & recommendations</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {!isAuthenticated && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Upgrade Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Save your bills permanently</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Enable email reminders</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Remove ads</span>
                      </li>
                    </ul>
                    <Link href="/auth">
                      <Button className="w-full">
                        Sign Up Free
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}