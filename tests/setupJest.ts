// Jest setup: provide safe default environment variables for Supabase so tests
// that import `src/lib/supabase.ts` do not fail when run locally.

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-test-key';

// Optionally set other env vars used across the app in tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
