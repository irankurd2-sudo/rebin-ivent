-- Remove the unique constraint on products.sku to allow duplicate SKUs
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;