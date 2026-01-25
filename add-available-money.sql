-- Add available_money field to users table
ALTER TABLE public.users 
ADD COLUMN available_money DECIMAL(10,2) DEFAULT 0.00;

-- Update existing users to have 0 as default
UPDATE public.users 
SET available_money = 0.00 
WHERE available_money IS NULL;