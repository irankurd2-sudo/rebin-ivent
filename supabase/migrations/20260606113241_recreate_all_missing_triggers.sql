/*
  # Recreate all missing database triggers and functions

  1. decrease_product_stock() - Reduces stock when a sale is made
  2. restore_product_stock() - Restores stock when a sale is deleted
  3. update_seller_stats() - Updates seller statistics after sale insert/delete
  4. Triggers on sales table for both insert and delete
*/

-- Function: Decrease product stock on sale (handles color variants and service sales)
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  product_uuid UUID;
  current_variants JSONB;
  variant_index INT;
  variant JSONB;
  updated_variants JSONB;
  color_found BOOLEAN := FALSE;
BEGIN
  -- Try to convert product_id to UUID (skip service sales)
  BEGIN
    product_uuid := NEW.product_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Non-UUID product_id (likely service sale): %', NEW.product_id;
    RETURN NEW;
  END;

  -- Get current color variants
  SELECT color_variants INTO current_variants
  FROM products
  WHERE id = product_uuid;

  -- If product has color variants and a color was specified in the sale
  IF current_variants IS NOT NULL AND jsonb_array_length(current_variants) > 0 AND NEW.product_color IS NOT NULL THEN
    updated_variants := '[]'::JSONB;

    FOR variant_index IN 0..(jsonb_array_length(current_variants) - 1) LOOP
      variant := current_variants->variant_index;

      IF variant->>'color' = NEW.product_color THEN
        variant := jsonb_set(
          variant,
          '{stock}',
          to_jsonb(GREATEST(0, (variant->>'stock')::INT - NEW.quantity))
        );
        color_found := TRUE;
      END IF;

      updated_variants := updated_variants || jsonb_build_array(variant);
    END LOOP;

    IF color_found THEN
      UPDATE products
      SET
        color_variants = updated_variants,
        stock = GREATEST(0, stock - NEW.quantity),
        updated_at = now()
      WHERE id = product_uuid;
    ELSE
      UPDATE products
      SET stock = GREATEST(0, stock - NEW.quantity), updated_at = now()
      WHERE id = product_uuid;
    END IF;
  ELSE
    -- No color variants, just reduce regular stock
    UPDATE products
    SET stock = GREATEST(0, stock - NEW.quantity), updated_at = now()
    WHERE id = product_uuid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Restore product stock on sale deletion (handles color variants)
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  product_uuid UUID;
  current_variants JSONB;
  variant_index INT;
  variant JSONB;
  updated_variants JSONB;
  color_found BOOLEAN := FALSE;
BEGIN
  -- Try to convert product_id to UUID (skip service sales)
  BEGIN
    product_uuid := OLD.product_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Non-UUID product_id (likely service sale): %', OLD.product_id;
    RETURN OLD;
  END;

  -- Get current color variants
  SELECT color_variants INTO current_variants
  FROM products
  WHERE id = product_uuid;

  -- If product has color variants and a color was specified in the sale
  IF current_variants IS NOT NULL AND jsonb_array_length(current_variants) > 0 AND OLD.product_color IS NOT NULL THEN
    updated_variants := '[]'::JSONB;

    FOR variant_index IN 0..(jsonb_array_length(current_variants) - 1) LOOP
      variant := current_variants->variant_index;

      IF variant->>'color' = OLD.product_color THEN
        variant := jsonb_set(
          variant,
          '{stock}',
          to_jsonb((variant->>'stock')::INT + OLD.quantity)
        );
        color_found := TRUE;
      END IF;

      updated_variants := updated_variants || jsonb_build_array(variant);
    END LOOP;

    IF color_found THEN
      UPDATE products
      SET
        color_variants = updated_variants,
        stock = stock + OLD.quantity,
        updated_at = now()
      WHERE id = product_uuid;
    ELSE
      UPDATE products
      SET stock = stock + OLD.quantity, updated_at = now()
      WHERE id = product_uuid;
    END IF;
  ELSE
    -- No color variants, just restore regular stock
    UPDATE products
    SET stock = stock + OLD.quantity, updated_at = now()
    WHERE id = product_uuid;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Update seller stats on sale insert
CREATE OR REPLACE FUNCTION update_seller_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    UPDATE sellers
    SET
      total_sales = total_sales + 1,
      total_revenue = total_revenue + NEW.total,
      total_profit = COALESCE(total_profit, 0) + NEW.profit
    WHERE id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update seller stats on sale delete
CREATE OR REPLACE FUNCTION update_seller_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.seller_id IS NOT NULL THEN
    UPDATE sellers
    SET
      total_sales = GREATEST(0, total_sales - 1),
      total_revenue = GREATEST(0, total_revenue - OLD.total),
      total_profit = GREATEST(0, COALESCE(total_profit, 0) - OLD.profit)
    WHERE id = OLD.seller_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (safe recreation)
DROP TRIGGER IF EXISTS trigger_decrease_stock_on_sale ON sales;
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_delete ON sales;
DROP TRIGGER IF EXISTS trigger_update_seller_stats_insert ON sales;
DROP TRIGGER IF EXISTS trigger_update_seller_stats_delete ON sales;

-- Create triggers
CREATE TRIGGER trigger_decrease_stock_on_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

CREATE TRIGGER trigger_restore_stock_on_sale_delete
  AFTER DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_stock();

CREATE TRIGGER trigger_update_seller_stats_insert
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats_on_insert();

CREATE TRIGGER trigger_update_seller_stats_delete
  AFTER DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats_on_delete();

-- Also recreate the updated_at trigger for products if missing
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
