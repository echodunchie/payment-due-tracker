-- Alternative trigger setup (run this if the automatic trigger isn't working)

-- First, let's make sure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add some debug logging
  RAISE LOG 'Creating user profile for user ID: %', NEW.id;
  RAISE LOG 'Email: %', NEW.email;
  
  INSERT INTO public.users (id, email, is_premium)
  VALUES (NEW.id, NEW.email, false);
  
  RAISE LOG 'Successfully created user profile for: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW; -- Don't fail the auth process
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Check if trigger is created
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;