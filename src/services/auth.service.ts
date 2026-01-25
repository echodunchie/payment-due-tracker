import type { User, AuthFormData } from '@/types'
import type { AuthService, EmailService } from './interfaces'

class InMemoryAuthService implements AuthService {
  private currentUser: User | null = null
  private users: Map<string, User & { password: string }> = new Map()
  private emailService: EmailService | null = null
  private readonly STORAGE_KEY = 'paytracker_users'

  constructor() {
    // Load persisted users from localStorage first
    this.loadPersistedUsers()
    
    // Add default test users for development (only if they don't already exist)
    if (!this.users.has('test@example.com')) {
      this.users.set('test@example.com', {
        id: 'test-user-1',
        email: 'test@example.com',
        password: 'password123',
        isAuthenticated: true,
        isPremium: false,
        createdAt: new Date('2026-01-01')
      })
    }
    
    if (!this.users.has('premium@example.com')) {
      this.users.set('premium@example.com', {
        id: 'premium-user-1', 
        email: 'premium@example.com',
        password: 'premium123',
        isAuthenticated: true,
        isPremium: true,
        createdAt: new Date('2025-12-01')
      })
    }
    
    // Save updated users list (including any new default users)
    this.persistUsers()
    
    console.log('🔐 [AUTH] Initialized with users:', Array.from(this.users.keys()))
  }

  private loadPersistedUsers(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          const usersArray: Array<[string, User & { password: string }]> = JSON.parse(stored)
          this.users = new Map(usersArray.map(([email, user]) => [
            email,
            {
              ...user,
              createdAt: new Date(user.createdAt) // Restore Date object
            }
          ]))
          console.log('📋 [AUTH] Loaded', this.users.size, 'persisted users from localStorage')
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Error loading persisted users:', error)
    }
  }

  private persistUsers(): void {
    try {
      if (typeof window !== 'undefined') {
        const usersArray = Array.from(this.users.entries())
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usersArray))
        console.log('📋 [AUTH] Persisted', this.users.size, 'users to localStorage')
      }
    } catch (error) {
      console.error('❌ [AUTH] Error persisting users:', error)
    }
  }

  // Lazy load email service to avoid circular dependency
  private async getEmailService(): Promise<EmailService> {
    if (!this.emailService) {
      const { emailService } = await import('./email.service')
      this.emailService = emailService
    }
    return this.emailService
  }

  async login(credentials: AuthFormData): Promise<User> {
    console.log('🔐 [AUTH] Login attempt for:', credentials.email)
    console.log('🔐 [AUTH] Available users:', Array.from(this.users.keys()))
    
    const user = this.users.get(credentials.email)
    
    if (!user) {
      console.log('❌ [AUTH] User not found:', credentials.email)
      throw new Error('Invalid email or password')
    }
    
    if (user.password !== credentials.password) {
      console.log('❌ [AUTH] Password mismatch for:', credentials.email)
      throw new Error('Invalid email or password')
    }

    console.log('✅ [AUTH] Login successful for:', credentials.email)
    
    this.currentUser = {
      id: user.id,
      email: user.email,
      isAuthenticated: true,
      isPremium: user.isPremium,
      createdAt: user.createdAt
    }

    return this.currentUser
  }

  async register(credentials: AuthFormData): Promise<User> {
    console.log('🔐 [AUTH] Registration attempt for:', credentials.email)
    
    if (this.users.has(credentials.email)) {
      console.log('❌ [AUTH] User already exists:', credentials.email)
      throw new Error('User already exists')
    }

    if (credentials.password !== credentials.confirmPassword) {
      console.log('❌ [AUTH] Password confirmation mismatch')
      throw new Error('Passwords do not match')
    }

    const user: User & { password: string } = {
      id: crypto.randomUUID(),
      email: credentials.email,
      password: credentials.password,
      isAuthenticated: true,
      isPremium: false, // New users start with free tier
      createdAt: new Date()
    }

    this.users.set(credentials.email, user)
    this.persistUsers() // Save to localStorage
    console.log('✅ [AUTH] User registered successfully:', credentials.email)
    console.log('🔐 [AUTH] Total users now:', this.users.size)

    // Send welcome email
    try {
      const emailService = await this.getEmailService()
      await emailService.sendWelcomeEmail(credentials.email)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't fail registration if email fails
    }

    this.currentUser = {
      id: user.id,
      email: user.email,
      isAuthenticated: true,
      isPremium: user.isPremium,
      createdAt: user.createdAt
    }

    return this.currentUser
  }

  async logout(): Promise<void> {
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.isAuthenticated
  }

  async signInWithGoogle(): Promise<User> {
    // Simulate Google sign-in for in-memory service
    const googleUser: User = {
      id: 'google-user-1',
      email: 'googleuser@example.com',
      isAuthenticated: true,
      isPremium: false,
      createdAt: new Date()
    }
    this.currentUser = googleUser
    // Optionally add to users map for persistence
    this.users.set(googleUser.email, { ...googleUser, password: '' })
    this.persistUsers()
    return googleUser
  }
}

export const authService = new InMemoryAuthService()