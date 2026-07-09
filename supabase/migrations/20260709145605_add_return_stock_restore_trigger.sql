-- Create function to restore stock when a return is inserted
CREATE OR REPLACE FUNCTION restore_stock_on_return_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip stock restoration for service returns (product_id starts with 'service-')
  IF NEW.product_id LIKE 'service-%' THEN
    RETURN NEW;
  END IF;

  -- Restore stock to the product
  UPDATE products
  SET stock = stock + NEW.quantity
  WHERE id = NEW.product_id::uuid;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on returns INSERT
DROP TRIGGER IF EXISTS trigger_restore_stock_on_return_insert ON returns;
CREATE TRIGGER trigger_restore_stock_on_return_insert
  AFTER INSERT ON returns
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_return_insert();