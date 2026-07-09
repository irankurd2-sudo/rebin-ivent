-- Create function to reduce stock when a sale is inserted
CREATE OR REPLACE FUNCTION reduce_stock_on_sale_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip stock reduction for service sales (product_id starts with 'service-')
  IF NEW.product_id LIKE 'service-%' THEN
    RETURN NEW;
  END IF;

  -- Reduce stock from the product
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id::uuid;

  -- Also reduce from color variant if product_color is specified
  IF NEW.product_color IS NOT NULL AND NEW.product_color != '' THEN
    UPDATE products
    SET color_variants = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'color' = NEW.product_color
          THEN jsonb_set(elem, '{stock}', to_jsonb((elem->>'stock')::int - NEW.quantity))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(color_variants) AS elem
    )
    WHERE id = NEW.product_id::uuid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on sales INSERT
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_sale_insert ON sales;
CREATE TRIGGER trigger_reduce_stock_on_sale_insert
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_sale_insert();

-- Create function to restore stock when a sale is deleted
CREATE OR REPLACE FUNCTION restore_stock_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip stock restoration for service sales
  IF OLD.product_id LIKE 'service-%' THEN
    RETURN OLD;
  END IF;

  -- Restore stock to the product
  UPDATE products
  SET stock = stock + OLD.quantity
  WHERE id = OLD.product_id::uuid;

  -- Also restore to color variant if product_color is specified
  IF OLD.product_color IS NOT NULL AND OLD.product_color != '' THEN
    UPDATE products
    SET color_variants = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'color' = OLD.product_color
          THEN jsonb_set(elem, '{stock}', to_jsonb((elem->>'stock')::int + OLD.quantity))
          ELSE elem
        END
      )
      FROM jsonb_array_elements(color_variants) AS elem
    )
    WHERE id = OLD.product_id::uuid;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on sales DELETE
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_delete ON sales;
CREATE TRIGGER trigger_restore_stock_on_sale_delete
  AFTER DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_sale_delete();