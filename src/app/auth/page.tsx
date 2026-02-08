'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks'
import type { AuthFormData } from '@/types'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const { login, register, loading: authLoading, error, clearError } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      console.log('🔐 [AUTH FORM] Starting', isLogin ? 'login' : 'registration', 'for:', formData.email)

      if (isLogin) {
        await login(formData)
        toast.success('Welcome back!')
      } else {
        await register(formData)
        toast.success('Account created successfully!')
      }

      console.log('🔐 [AUTH FORM] Auth successful, redirecting to calculator...')

      // Redirect to calculator after successful auth
      router.push('/calculator')
    } catch (err) {
      // Error is handled by useAuth hook and displayed via the error state
      console.error('Auth error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormData({ email: '', password: '', confirmPassword: '' })
    clearError() // Clear any existing errors when switching modes
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6"
        >
          {/* Header with Logo */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <Calendar className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PayTracker
              </span>
            </Link>
            <p className="text-muted-foreground">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {isLogin ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin 
                  ? 'Enter your email and password to access your bills'
                  : 'Sign up to save your bills and enable reminders'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        disabled={submitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        disabled={submitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary hover:underline font-medium"
                    disabled={submitting}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Or continue without an account:
                  {' '}
                  <Link href="/calculator" className="text-primary hover:underline">
                    Try for free
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}