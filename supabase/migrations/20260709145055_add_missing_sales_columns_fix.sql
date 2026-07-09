-- Add missing columns to sales table that the app code expects
ALTER TABLE sales ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_category TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS product_color TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_date DATE;