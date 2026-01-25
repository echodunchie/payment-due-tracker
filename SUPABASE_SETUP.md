# Payment Due Tracker - Supabase Setup Instructions

## Database Integration Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Note your project URL and anon key

### 2. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create tables, policies, and triggers

### 3. Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Update the values with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Switch to Supabase Services
To enable Supabase integration, update your main services import:

**In `src/hooks/useAuth.ts`, `src/hooks/useBills.ts`, etc.**:
```typescript
// Replace this import:
import { authService, billService } from '@/services'

// With this import:
import { authService, billService } from '@/services/index.supabase'
```

Or update `src/services/index.ts` to export from Supabase services.

### 5. Features Available with Supabase
- ✅ Real user authentication with Supabase Auth
- ✅ Persistent data storage in PostgreSQL
- ✅ Row Level Security (RLS) for data protection
- ✅ Automatic user profile creation
- ✅ Real-time capabilities (ready for future features)
- ✅ Scalable infrastructure

### 6. Testing
1. Start your dev server: `npm run dev`
2. Register a new account - data will be stored in Supabase
3. Add bills - they'll persist across sessions
4. Test login/logout functionality

### 7. Production Deployment
Once tested, your app is ready for production deployment with:
- Real user accounts
- Persistent data
- Scalable database
- Security policies in place

## Files Created
- `src/lib/supabase.ts` - Supabase client configuration
- `src/services/auth.supabase.service.ts` - Auth with Supabase
- `src/services/bill.supabase.service.ts` - Bills with Supabase  
- `src/services/index.supabase.ts` - Supabase service exports
- `supabase-schema.sql` - Database setup script
- `.env.local.example` - Environment template

## Next Steps
After Supabase is working:
1. Set up real email service (SendGrid/AWS SES)
2. Add payment integration (Stripe)
3. Deploy to Vercel/Netlify
4. Set up custom domain