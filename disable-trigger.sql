-- Disable the automatic trigger that's causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- We'll handle user profile creation manually in the application code instead