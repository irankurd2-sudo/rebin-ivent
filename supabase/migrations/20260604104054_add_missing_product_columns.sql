/*
  # Add missing color_variants column

  1. Changes
    - Add color_variants jsonb column to products table
    - This column stores color variant information for products like back glass
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'color_variants'
  ) THEN
    ALTER TABLE products ADD COLUMN color_variants jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_warning_level'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_warning_level text DEFAULT 'all'::text;
  END IF;
END $$;
