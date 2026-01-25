-- Complete cleanup of any remaining triggers and constraints
-- Run this in your Supabase SQL Editor

-- 1. Remove all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 2. Remove the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Check if there are any other triggers
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- 4. If the users table is causing issues, let's recreate it without foreign key constraint
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 5. Recreate users table without foreign key to auth.users (we'll handle this in code)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Recreate bills table
CREATE TABLE public.bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  notification_frequency TEXT NOT NULL DEFAULT 'none' CHECK (notification_frequency IN ('none', '1_day', '3_days', '1_week', '2_weeks')),
  reminder_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 8. Create policies
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view own bills" 
  ON public.bills FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own bills" 
  ON public.bills FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own bills" 
  ON public.bills FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own bills" 
  ON public.bills FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- 9. Create indexes
CREATE INDEX idx_bills_user_id ON public.bills(user_id);
CREATE INDEX idx_bills_due_date ON public.bills(due_date);

SELECT 'Database cleanup and recreation complete!' as result;