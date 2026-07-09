-- Add missing columns to products table that the app code expects
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_warning_level TEXT DEFAULT 'all';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;