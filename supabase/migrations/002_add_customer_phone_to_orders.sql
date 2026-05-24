-- Add customer_phone column to orders table for manual lookup
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
COMMENT ON COLUMN public.orders.customer_phone IS 'Phone number of the customer for verification fallback';
