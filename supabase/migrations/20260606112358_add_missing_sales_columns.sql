/*
  # Add missing columns to sales table
  
  1. Changes
    - Add product_color for color variant tracking
    - Add unit_cost for cost tracking
    - Add product_category for categorization
    - Add transaction_id for grouping multi-item sales
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'product_color'
  ) THEN
    ALTER TABLE sales ADD COLUMN product_color text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE sales ADD COLUMN unit_cost numeric DEFAULT 0 CHECK (unit_cost >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'product_category'
  ) THEN
    ALTER TABLE sales ADD COLUMN product_category text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN transaction_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'sale_date'
  ) THEN
    ALTER TABLE sales ADD COLUMN sale_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;
