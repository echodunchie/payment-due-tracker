# TECHNICAL_NOTES.md

## Overview
This is an append-only file documenting all architectural and logic changes for the payment-due-tracker project. Every significant decision must be recorded here.

---

## 2026-01-24: Initial Project Setup

### Architecture Decisions

#### Service-Based Architecture
- Implemented service pattern with interfaces for future Supabase integration
- Services: `BillService`, `ReminderService`, `AuthService`
- All data access abstracted behind service interfaces
- Current implementation uses in-memory storage

#### Component Structure
- Strict separation of concerns enforced
- UI components contain only presentation logic
- Business logic handled via custom hooks and services
- No data access allowed inside components
- Maximum 1,000 lines per file limit

#### Authentication Strategy
- Email-based authentication only (no social logins)
- Unauthenticated users can use core functionality (data in memory)
- Authenticated users get data persistence and reminders
- Service interface ready for Supabase Auth integration

#### Data Flow
- Core calculator accessible without authentication
- Unauthenticated: data lives in memory, lost on refresh
- Authenticated: data persisted via service layer
- Reminder toggles disabled for unauthenticated users

#### Tech Stack Choices
- **Next.js App Router**: For modern React architecture and file-based routing
- **TypeScript**: Type safety across all components and services
- **Tailwind CSS**: Utility-first styling for consistent design system
- **shadcn/ui**: Pre-built accessible components
- **Framer Motion**: Smooth animations and transitions
- **In-memory storage**: Temporary solution, service interfaces ready for Supabase

#### Monetization Architecture
- Mock ad system using `<AdPlaceholder />` components
- Ads shown to unauthenticated and free users
- Premium tier (₱99/month) removes ads and enables persistence
- No real payment integration in MVP

#### Calendar Visualization
- Month-only view (no week/day toggles)
- Focus on cash flow timeline, not scheduling
- Visual representation of money depletion over time
- Highlighted date ranges for due dates

#### Theme System
- Light/dark theme support throughout
- Theme-aware financial status indicators
- Settings accessible from any page

### Implementation Notes

#### File Structure
```
/src
  /app - Next.js App Router pages
  /components - UI components only
  /hooks - Custom React hooks
  /services - Data access services
  /types - TypeScript definitions
  /lib - Utility functions
```

#### Service Interfaces
```typescript
interface BillService {
  getBills(): Bill[]
  addBill(bill: Bill): void
  updateBill(id: string, bill: Partial<Bill>): void
  deleteBill(id: string): void
}
```

#### Component Guidelines
- Each component responsible for single concern
- Props typed with TypeScript interfaces
- No direct data access (use hooks/services)
- Theme-aware styling with Tailwind classes

### Future Integration Points

#### Supabase Integration
- Service interfaces designed for easy Supabase replacement
- Authentication: Replace in-memory auth with Supabase Auth
- Database: Replace in-memory storage with PostgreSQL queries
- Real-time: Add real-time bill updates for authenticated users

#### Email Reminders
- Current: Mock implementation in ReminderService
- Future: Integration with transactional email provider
- Architecture: Email templates and scheduling logic already abstracted

#### Payment Processing
- Current: Mock pricing display only
- Future: Stripe or similar integration for ₱99/month subscription
- Architecture: Payment service interface ready for implementation

---

## 2026-01-24: MVP Implementation Complete

### Core Features Implemented

#### Landing Page (/page.tsx)
- Public-facing marketing page with product explanation
- Modern UI with Framer Motion animations
- Features grid highlighting core value propositions
- Pricing section (₱99/month premium, free with ads)
- Mock ad placements for free tier users
- Responsive design with theme support

#### Authentication System (/auth/page.tsx)
- Simple email-based login/registration
- Single page for both auth modes
- Form validation and error handling
- Service layer integration with in-memory auth
- Smooth transitions and loading states
- Option to continue without account

#### Calculator Page (/calculator/page.tsx) - Heart of the App
- Accessible to both authenticated and unauthenticated users
- Available money input with live preview calculations
- Bill management with full CRUD operations
- Real-time balance calculations
- Calendar visualization with color-coded danger zones
- Financial status indicators (Safe/Warning/Danger zones)
- Reminder toggle (disabled for unauthenticated users)

#### Component Architecture
- **BillForm**: Add bills with due dates, amounts, reminder settings
- **BillList**: Display bills with sorting, editing, deletion
- **CashFlowVisualization**: Calendar view with daily cash flow tracking
- **AdPlaceholder**: Mock ad system for free users
- **ThemeToggle**: Light/dark theme switching

### Service Layer Architecture

#### In-Memory Services (MVP Implementation)
- **BillService**: CRUD operations for bills
- **AuthService**: User authentication and session management  
- **CalculationService**: Cash flow calculations and projections
- **ReminderService**: Mock reminder scheduling
- **StorageService**: In-memory data persistence

#### Business Logic
- Bills sorted by due date automatically
- Daily cash flow calculations with danger zone detection
- Live balance updates as user types
- Reminder toggles only enabled for authenticated users
- Financial status determination (Safe/Warning/Danger)

### UI/UX Implementation

#### Theme System
- Complete light/dark theme support
- System preference detection
- Persistent theme storage
- Theme-aware financial status colors

#### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Touch-friendly interactions
- Proper spacing and typography scaling

#### Accessibility
- Screen reader support
- Keyboard navigation
- High contrast theme options
- Semantic HTML structure

### Data Flow Architecture

#### Unauthenticated Users
- Data stored in memory only
- Lost on page refresh (intentional)
- Full calculator functionality available
- Reminder toggles disabled with explanatory text
- Ad placements shown

#### Authenticated Users  
- Data persisted via service layer
- Reminder functionality enabled
- No ads displayed
- Premium badge for paid users

### Calendar Visualization

#### Month View Implementation
- Color-coded dates based on cash flow status
- Green: Safe zone (sufficient funds)
- Yellow: Warning zone (low balance)
- Red: Danger zone (insufficient funds)
- Hover tooltips with bill details and running balance

#### Daily Breakdown
- Chronological list of bill payment dates
- Running balance calculation
- Visual indicators for financial status
- Bill grouping by due date

### Future Integration Points

#### Ready for Supabase Integration
- Service interfaces designed for easy database replacement
- Authentication service ready for Supabase Auth
- Data models compatible with PostgreSQL schema
- Real-time capabilities architected but not implemented

#### Email Service Integration  
- Reminder service interfaces ready for transactional email
- Mock implementation logs reminder actions
- Architecture supports SendGrid, AWS SES, or similar services

#### Payment Processing
- Premium tier architecture in place
- Service interfaces ready for Stripe integration
- User tier management implemented

### Performance Considerations

#### Optimization Strategies
- Framer Motion animations with proper performance settings
- Component memoization where appropriate
- Lazy loading of heavy components
- Efficient re-renders through proper state management

#### Bundle Size Management
- Tree-shaking enabled for unused components
- Dynamic imports for non-critical features
- Optimized icon usage with lucide-react

### Testing Strategy (Planned)
- Service layer unit tests
- Component testing with React Testing Library
- E2E testing with Playwright
- Accessibility testing with axe-core

---

## 2026-01-24: Email Integration Added

### Email Service Implementation

#### New EmailService Interface
- `sendWelcomeEmail(email, name?)` - Welcome email for new users
- `sendPasswordResetEmail(email, resetToken)` - Password reset functionality  
- `sendBillReminderEmail(email, billName, amount, dueDate)` - Bill payment reminders
- `sendTestEmail(email)` - Email testing functionality

#### Mock Email Service Features
- Console-based email logging for development
- Realistic email content generation
- Simulated network delays
- Email log tracking and debugging capabilities
- Professional email templates with PayTracker branding

#### Authentication Integration
- Welcome emails automatically sent on user registration
- Non-blocking email sending (registration succeeds even if email fails)
- User feedback via toast notifications about email sending
- Enhanced registration success message mentioning email

#### Reminder Service Enhancement
- Integration with email service for bill reminders
- `sendBillReminder()` method for authenticated users
- Email service fallback and error handling
- Console logging for development debugging

#### User Interface Updates
- "Test Email" button for authenticated users on calculator page
- Enhanced registration success message
- Email functionality demonstration in development environment
- Clear feedback when emails are sent

### Development Experience

#### Email Debugging
- All emails logged to console with full content
- Email logs stored in memory for debugging
- Email log filtering by type (welcome, reminder, test)
- Clear mock email indicators for development

#### Future Production Integration
- Service interface ready for real email providers:
  - SendGrid integration
  - AWS SES integration  
  - Mailgun support
  - Nodemailer compatibility
- Environment variable configuration planned
- Email template system ready for HTML templates

### Technical Implementation Details

#### Error Handling
- Email failures don't block user registration
- Graceful degradation when email service unavailable
- Clear error logging for debugging
- User-friendly error messages via toast notifications

#### Security Considerations
- Email content sanitization planned
- Rate limiting interfaces ready
- Unsubscribe functionality architecture prepared
- Email verification system designed (not yet implemented)

---

*All future changes must be appended below with timestamp and clear documentation.*