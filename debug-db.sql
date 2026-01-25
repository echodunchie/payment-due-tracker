-- Check if the trigger was properly removed
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;

-- Check if there are any constraints or issues with the users table
SELECT * FROM pg_constraint WHERE conrelid = 'public.users'::regclass;

-- Check the structure of the users table
\d public.users;