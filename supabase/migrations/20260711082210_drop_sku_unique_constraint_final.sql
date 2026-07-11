-- Drop the unique constraint on sku permanently
-- SKU should not be unique as users may leave it blank or reuse values
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;