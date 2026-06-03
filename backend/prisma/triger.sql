-- ============================================================
-- SUPABASE SQL TRIGGERS - BENGKEL POS (ULTIMATE SECURE VERSION)
-- ============================================================

-- ============================================================
-- 0. Setup: Extension & Table tambahan
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Audit log table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  action TEXT NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "changedById" TEXT,
  "changedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON "AuditLog" ("tableName", "recordId");
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON "AuditLog" ("changedAt");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog" (action);

-- ============================================================
-- 1. Trigger: Sinkronisasi user dari auth.users ke User
--    DENGAN GENERATE NAMA RANDOM JIKA TIDAK DISEDIAKAN
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_phone TEXT;
  user_fullname TEXT;
  random_suffix TEXT;
BEGIN
  -- Generate random suffix untuk nama (contoh: user_a7b3c9)
  random_suffix := substring(encode(gen_random_bytes(4), 'hex') from 1 for 8);
  
  -- Ambil data dari metadata atau gunakan default random
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'CASHIER');
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- PRIORITAS NAMA: metadata > email prefix > random
  IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL AND NEW.raw_user_meta_data->>'full_name' != '' THEN
    user_fullname := NEW.raw_user_meta_data->>'full_name';
  ELSIF NEW.raw_user_meta_data->>'fullName' IS NOT NULL AND NEW.raw_user_meta_data->>'fullName' != '' THEN
    user_fullname := NEW.raw_user_meta_data->>'fullName';
  ELSIF NEW.raw_user_meta_data->>'name' IS NOT NULL AND NEW.raw_user_meta_data->>'name' != '' THEN
    user_fullname := NEW.raw_user_meta_data->>'name';
  ELSIF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- Ambil prefix email sebelum @ sebagai nama
    user_fullname := split_part(NEW.email, '@', 1) || '_' || random_suffix;
  ELSE
    -- Generate nama random: user_a7b3c9d2
    user_fullname := 'user_' || random_suffix;
  END IF;

  -- Validasi role
  IF user_role NOT IN ('ADMIN', 'CASHIER', 'MECHANIC') THEN
    user_role := 'CASHIER';
  END IF;

  -- Insert ke User dengan ON CONFLICT untuk handle race condition
  INSERT INTO "User" (id, email, "fullName", phone, role, "isActive", "isAuthenticated", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    user_fullname,
    user_phone,
    user_role::"Role",
    true,
    false,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    phone = COALESCE(EXCLUDED.phone, "User".phone),
    role = EXCLUDED.role,
    "updatedAt" = NOW()
  WHERE "User".email IS DISTINCT FROM EXCLUDED.email
     OR "User"."fullName" IS DISTINCT FROM EXCLUDED."fullName";

  -- Audit log
  INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
  VALUES (
    'User', 
    NEW.id, 
    'USER_CREATED_AUTH',
    jsonb_build_object(
      'email', NEW.email, 
      'fullName', user_fullname, 
      'role', user_role, 
      'phone', user_phone,
      'isRandomName', CASE 
        WHEN NEW.raw_user_meta_data->>'full_name' IS NULL 
         AND NEW.raw_user_meta_data->>'fullName' IS NULL 
         AND NEW.raw_user_meta_data->>'name' IS NULL 
        THEN true ELSE false 
      END
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_auth_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict execute permission
REVOKE ALL ON FUNCTION handle_new_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION handle_new_auth_user() FROM anon;
REVOKE ALL ON FUNCTION handle_new_auth_user() FROM authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- 2. Trigger: Auto Update updatedAt
-- ============================================================
DROP TRIGGER IF EXISTS product_updated_trigger ON "Product";
DROP TRIGGER IF EXISTS expense_updated_trigger ON "Expense";
DROP TRIGGER IF EXISTS user_updated_trigger ON "User";
DROP TRIGGER IF EXISTS order_updated_trigger ON "Order";
DROP FUNCTION IF EXISTS update_timestamp();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER product_updated_trigger 
  BEFORE UPDATE ON "Product" 
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER expense_updated_trigger 
  BEFORE UPDATE ON "Expense" 
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER user_updated_trigger 
  BEFORE UPDATE ON "User" 
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER order_updated_trigger 
  BEFORE UPDATE ON "Order" 
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 3. Trigger: Cegah hapus user dengan relasi aktif
-- ============================================================
DROP TRIGGER IF EXISTS prevent_user_delete_trigger ON "User";
DROP FUNCTION IF EXISTS prevent_user_delete();

CREATE OR REPLACE FUNCTION prevent_user_delete()
RETURNS TRIGGER AS $$
DECLARE
  active_order_count INT;
  open_shift_count INT;
BEGIN
  -- Hitung order aktif (tidak di soft delete dan belum closed/cancelled)
  SELECT COUNT(*) INTO active_order_count 
  FROM "Order" 
  WHERE "cashierId" = OLD.id 
    AND "deletedAt" IS NULL 
    AND status NOT IN ('CLOSED', 'CANCELLED');

  IF active_order_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menghapus user. User masih memiliki % pesanan aktif.', active_order_count;
  END IF;
  
  -- Hitung shift yang masih open
  SELECT COUNT(*) INTO open_shift_count
  FROM "Shift" 
  WHERE "cashierId" = OLD.id 
    AND status = 'OPEN';

  IF open_shift_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menghapus user. User masih memiliki % shift aktif.', open_shift_count;
  END IF;

  -- Cek apakah user masih menjadi mekanik di assignment aktif
  IF EXISTS (
    SELECT 1 FROM "MechanicAssignment" ma
    JOIN "OrderItem" oi ON ma."orderItemId" = oi.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE ma."mechanicId" = OLD.id 
      AND ma."endAt" IS NULL 
      AND o."deletedAt" IS NULL
      AND o.status NOT IN ('CLOSED', 'CANCELLED')
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Tidak dapat menghapus user. User masih memiliki assignment mekanik aktif.';
  END IF;

  INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues")
  VALUES (
    'User', 
    OLD.id, 
    'USER_DELETED',
    jsonb_build_object(
      'email', OLD.email, 
      'fullName', OLD."fullName", 
      'role', OLD.role, 
      'isActive', OLD."isActive"
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_user_delete_trigger
  BEFORE DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION prevent_user_delete();

-- ============================================================
-- 4. Trigger: Hapus user di auth.users saat public."User" dihapus
-- ============================================================
DROP TRIGGER IF EXISTS on_public_user_deleted ON "User";
DROP FUNCTION IF EXISTS delete_auth_user();

CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Gunakan perform untuk delete yang aman
  PERFORM FROM auth.users WHERE id = OLD.id::uuid;
  IF FOUND THEN
    DELETE FROM auth.users WHERE id = OLD.id::uuid;
  END IF;
  
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error deleting auth user %: %', OLD.id, SQLERRM;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION delete_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_auth_user() FROM anon;
REVOKE ALL ON FUNCTION delete_auth_user() FROM authenticated;

CREATE TRIGGER on_public_user_deleted
  AFTER DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION delete_auth_user();

-- ============================================================
-- 5. Trigger: Cascade Soft Delete Order
-- ============================================================
DROP TRIGGER IF EXISTS order_soft_delete_trigger ON "Order";
DROP FUNCTION IF EXISTS cascade_soft_delete_order();

CREATE OR REPLACE FUNCTION cascade_soft_delete_order()
RETURNS TRIGGER AS $$
DECLARE
  cancelled_payments INT := 0;
  closed_assignments INT := 0;
  affected_order_items INT := 0;
BEGIN
  -- Hanya proses jika deletedAt berubah dari NULL ke NOT NULL
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    
    -- Update payments
    WITH updated_payments AS (
      UPDATE "Payment" 
      SET status = 'REFUNDED' 
      WHERE "orderId" = NEW.id 
        AND status = 'PAID' 
      RETURNING id
    ) 
    SELECT COUNT(*) INTO cancelled_payments FROM updated_payments;
    
    -- Close mechanic assignments
    WITH updated_assignments AS (
      UPDATE "MechanicAssignment" 
      SET "endAt" = NOW() 
      WHERE "orderItemId" IN (
        SELECT id FROM "OrderItem" WHERE "orderId" = NEW.id
      ) 
      AND "endAt" IS NULL 
      RETURNING id
    ) 
    SELECT COUNT(*) INTO closed_assignments FROM updated_assignments;
    
    -- Update order status ke CANCELLED jika belum
    IF NEW.status != 'CANCELLED' THEN
      UPDATE "Order" 
      SET status = 'CANCELLED' 
      WHERE id = NEW.id 
        AND status != 'CANCELLED';
    END IF;
    
    -- Audit log
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Order', 
      NEW.id, 
      'ORDER_SOFT_DELETED',
      jsonb_build_object(
        'status', OLD.status, 
        'deletedAt', OLD."deletedAt"
      ),
      jsonb_build_object(
        'deletedAt', NEW."deletedAt", 
        'orderNumber', NEW."orderNumber", 
        'total', NEW.total, 
        'cancelledPayments', cancelled_payments, 
        'closedMechanicAssignments', closed_assignments,
        'previousStatus', OLD.status
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in cascade_soft_delete_order for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PERBAIKAN: Gunakan BEFORE UPDATE untuk mencegah recursive trigger
CREATE TRIGGER order_soft_delete_trigger
  BEFORE UPDATE OF "deletedAt" ON "Order"
  FOR EACH ROW 
  WHEN (NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL)
  EXECUTE FUNCTION cascade_soft_delete_order();

-- ============================================================
-- 6. Trigger: Audit Product Changes
-- ============================================================
DROP TRIGGER IF EXISTS product_audit_trigger ON "Product";
DROP FUNCTION IF EXISTS audit_product_changes();

CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
DECLARE
  margin_change NUMERIC;
  margin_pct_change NUMERIC;
BEGIN
  -- Audit perubahan harga
  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.cost IS DISTINCT FROM OLD.cost THEN
    margin_change := (NEW.price - NEW.cost) - (OLD.price - OLD.cost);
    margin_pct_change := ROUND(
      ((NEW.price - NEW.cost)::NUMERIC / NULLIF(NEW.price, 0)) * 100 - 
      ((OLD.price - OLD.cost)::NUMERIC / NULLIF(OLD.price, 0)) * 100, 
      2
    );
    
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Product', 
      NEW.id, 
      'PRODUCT_PRICE_CHANGE', 
      jsonb_build_object(
        'price', OLD.price, 
        'cost', OLD.cost,
        'margin', OLD.price - OLD.cost
      ), 
      jsonb_build_object(
        'price', NEW.price, 
        'cost', NEW.cost, 
        'productName', NEW.name, 
        'sku', NEW.sku, 
        'margin', NEW.price - NEW.cost, 
        'marginChange', margin_change,
        'marginPercentage', ROUND(((NEW.price - NEW.cost)::NUMERIC / NULLIF(NEW.price, 0)) * 100, 2),
        'marginPercentageChange', margin_pct_change
      )
    );
  END IF;

  -- Audit perubahan stok
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Product', 
      NEW.id, 
      'PRODUCT_STOCK_CHANGE', 
      jsonb_build_object('stock', OLD.stock), 
      jsonb_build_object(
        'stock', NEW.stock, 
        'productName', NEW.name, 
        'sku', NEW.sku, 
        'change', NEW.stock - OLD.stock,
        'changeType', CASE 
          WHEN NEW.stock > OLD.stock THEN 'INCREASE'
          WHEN NEW.stock < OLD.stock THEN 'DECREASE'
          ELSE 'NO_CHANGE'
        END
      )
    );
  END IF;

  -- Audit perubahan nama
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Product', 
      NEW.id, 
      'PRODUCT_NAME_CHANGE', 
      jsonb_build_object('name', OLD.name), 
      jsonb_build_object('name', NEW.name, 'sku', NEW.sku)
    );
  END IF;

  -- Audit perubahan status aktif
  IF NEW."isActive" IS DISTINCT FROM OLD."isActive" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Product', 
      NEW.id, 
      CASE WHEN NEW."isActive" THEN 'PRODUCT_ACTIVATED' ELSE 'PRODUCT_DEACTIVATED' END, 
      jsonb_build_object('isActive', OLD."isActive"), 
      jsonb_build_object(
        'isActive', NEW."isActive", 
        'productName', NEW.name, 
        'sku', NEW.sku,
        'stock', NEW.stock
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_product_changes for product %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER product_audit_trigger 
  AFTER UPDATE ON "Product" 
  FOR EACH ROW EXECUTE FUNCTION audit_product_changes();

-- ============================================================
-- 7. Trigger: Audit User Status & Role Changes
-- ============================================================
DROP TRIGGER IF EXISTS user_status_change_trigger ON "User";
DROP FUNCTION IF EXISTS audit_user_changes();

CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Audit perubahan status aktif
  IF NEW."isActive" IS DISTINCT FROM OLD."isActive" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'User', 
      NEW.id, 
      CASE WHEN NEW."isActive" THEN 'USER_ACTIVATED' ELSE 'USER_DEACTIVATED' END, 
      jsonb_build_object('isActive', OLD."isActive"), 
      jsonb_build_object(
        'isActive', NEW."isActive", 
        'email', NEW.email, 
        'fullName', NEW."fullName", 
        'role', NEW.role
      )
    );
  END IF;

  -- Audit perubahan role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'User', 
      NEW.id, 
      'USER_ROLE_CHANGE', 
      jsonb_build_object('role', OLD.role), 
      jsonb_build_object(
        'role', NEW.role, 
        'email', NEW.email, 
        'fullName', NEW."fullName",
        'fromRole', OLD.role,
        'toRole', NEW.role
      )
    );
  END IF;

  -- Audit perubahan nama
  IF NEW."fullName" IS DISTINCT FROM OLD."fullName" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'User', 
      NEW.id, 
      'USER_NAME_CHANGE', 
      jsonb_build_object('fullName', OLD."fullName"), 
      jsonb_build_object(
        'fullName', NEW."fullName", 
        'email', NEW.email,
        'oldFullName', OLD."fullName",
        'newFullName', NEW."fullName"
      )
    );
  END IF;

  -- Audit perubahan phone
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'User', 
      NEW.id, 
      'USER_PHONE_CHANGE', 
      jsonb_build_object('phone', OLD.phone), 
      jsonb_build_object(
        'phone', NEW.phone, 
        'email', NEW.email,
        'oldPhone', OLD.phone,
        'newPhone', NEW.phone
      )
    );
  END IF;

  -- Audit perubahan status autentikasi
  IF NEW."isAuthenticated" IS DISTINCT FROM OLD."isAuthenticated" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'User', 
      NEW.id, 
      CASE WHEN NEW."isAuthenticated" THEN 'USER_AUTHENTICATED' ELSE 'USER_UNAUTHENTICATED' END, 
      jsonb_build_object('isAuthenticated', OLD."isAuthenticated"), 
      jsonb_build_object(
        'isAuthenticated', NEW."isAuthenticated", 
        'email', NEW.email, 
        'fullName', NEW."fullName"
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_user_changes for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER user_status_change_trigger 
  AFTER UPDATE ON "User" 
  FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

-- ============================================================
-- 8. Trigger: Audit Order Status Changes
-- ============================================================
DROP TRIGGER IF EXISTS order_status_change_trigger ON "Order";
DROP FUNCTION IF EXISTS audit_order_status_change();

CREATE OR REPLACE FUNCTION audit_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Order', 
      NEW.id, 
      'ORDER_STATUS_CHANGE', 
      jsonb_build_object('status', OLD.status), 
      jsonb_build_object(
        'status', NEW.status, 
        'orderNumber', NEW."orderNumber", 
        'total', NEW.total, 
        'cashierId', NEW."cashierId", 
        'customerId', NEW."customerId", 
        'vehicleId', NEW."vehicleId",
        'fromStatus', OLD.status,
        'toStatus', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_order_status_change for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PERBAIKAN: Trigger hanya pada perubahan status
CREATE TRIGGER order_status_change_trigger 
  AFTER UPDATE ON "Order"
  FOR EACH ROW 
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION audit_order_status_change();

-- ============================================================
-- 9. Trigger: Audit Payment Changes
-- ============================================================
DROP TRIGGER IF EXISTS payment_audit_trigger ON "Payment";
DROP FUNCTION IF EXISTS audit_payment_changes();

CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
    VALUES (
      'Payment', 
      NEW.id, 
      'PAYMENT_CREATED', 
      jsonb_build_object(
        'orderId', NEW."orderId", 
        'method', NEW.method, 
        'amountPaid', NEW."amountPaid", 
        'change', NEW.change, 
        'status', NEW.status,
        'paidAt', NEW."paidAt"
      )
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Payment', 
      NEW.id, 
      'PAYMENT_STATUS_CHANGE', 
      jsonb_build_object(
        'status', OLD.status, 
        'method', OLD.method, 
        'amountPaid', OLD."amountPaid"
      ), 
      jsonb_build_object(
        'status', NEW.status, 
        'method', NEW.method, 
        'amountPaid', NEW."amountPaid", 
        'orderId', NEW."orderId",
        'fromStatus', OLD.status,
        'toStatus', NEW.status
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_payment_changes for payment %: %', COALESCE(NEW.id, OLD.id), SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER payment_audit_trigger 
  AFTER INSERT OR UPDATE ON "Payment" 
  FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- ============================================================
-- 10. Trigger: Audit Expense Changes
-- ============================================================
DROP TRIGGER IF EXISTS expense_audit_trigger ON "Expense";
DROP FUNCTION IF EXISTS audit_expense_changes();

CREATE OR REPLACE FUNCTION audit_expense_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
      VALUES (
        'Expense', 
        NEW.id, 
        'EXPENSE_AMOUNT_CHANGE', 
        jsonb_build_object('amount', OLD.amount), 
        jsonb_build_object(
          'amount', NEW.amount, 
          'title', NEW.title,
          'change', NEW.amount - OLD.amount,
          'oldAmount', OLD.amount,
          'newAmount', NEW.amount
        )
      );
    END IF;
    
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
      VALUES (
        'Expense', 
        NEW.id, 
        'EXPENSE_CATEGORY_CHANGE', 
        jsonb_build_object('category', OLD.category), 
        jsonb_build_object(
          'category', NEW.category, 
          'title', NEW.title,
          'oldCategory', OLD.category,
          'newCategory', NEW.category
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_expense_changes for expense %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER expense_audit_trigger 
  AFTER UPDATE ON "Expense" 
  FOR EACH ROW EXECUTE FUNCTION audit_expense_changes();

-- ============================================================
-- 11. Trigger: Audit Stock Movement (INSERT only)
-- ============================================================
DROP TRIGGER IF EXISTS stock_movement_audit_trigger ON "StockMovement";
DROP FUNCTION IF EXISTS audit_stock_movement();

CREATE OR REPLACE FUNCTION audit_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  recorded_by_name TEXT;
  current_stock INT;
BEGIN
  -- Ambil nama produk
  SELECT name INTO product_name 
  FROM "Product" 
  WHERE id = NEW."productId";
  
  -- Ambil nama user yang merekam
  SELECT "fullName" INTO recorded_by_name 
  FROM "User" 
  WHERE id = NEW."recordedById";

  -- Ambil stok saat ini
  SELECT stock INTO current_stock
  FROM "Product"
  WHERE id = NEW."productId";

  INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
  VALUES (
    'StockMovement', 
    NEW.id, 
    'STOCK_MOVEMENT_CREATED', 
    jsonb_build_object(
      'productId', NEW."productId", 
      'productName', product_name, 
      'quantity', NEW.quantity, 
      'type', NEW.type, 
      'sourceType', NEW."sourceType", 
      'recordedById', NEW."recordedById", 
      'recordedByName', recorded_by_name, 
      'orderItemId', NEW."orderItemId", 
      'note', NEW.note,
      'currentStock', current_stock
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_stock_movement for movement %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER stock_movement_audit_trigger 
  AFTER INSERT ON "StockMovement" 
  FOR EACH ROW EXECUTE FUNCTION audit_stock_movement();

-- ============================================================
-- 12. Trigger: Audit Shift Changes
-- ============================================================
DROP TRIGGER IF EXISTS shift_audit_trigger ON "Shift";
DROP FUNCTION IF EXISTS audit_shift_changes();

CREATE OR REPLACE FUNCTION audit_shift_changes()
RETURNS TRIGGER AS $$
DECLARE
  cashier_name TEXT;
  shift_duration INTERVAL;
BEGIN
  -- Ambil nama kasir
  SELECT "fullName" INTO cashier_name 
  FROM "User" 
  WHERE id = COALESCE(NEW."cashierId", OLD."cashierId");

  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
    VALUES (
      'Shift', 
      NEW.id, 
      'SHIFT_OPENED', 
      jsonb_build_object(
        'cashierId', NEW."cashierId", 
        'cashierName', cashier_name, 
        'startingCash', NEW."startingCash", 
        'openedAt', NEW."openedAt",
        'status', NEW.status
      )
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'CLOSED' AND OLD.status = 'OPEN' THEN
    -- Hitung durasi shift
    shift_duration := NEW."closedAt" - OLD."openedAt";
    
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Shift', 
      NEW.id, 
      'SHIFT_CLOSED', 
      jsonb_build_object(
        'status', OLD.status, 
        'cashSales', OLD."cashSales", 
        'endingCash', OLD."endingCash"
      ), 
      jsonb_build_object(
        'status', NEW.status, 
        'cashierId', NEW."cashierId", 
        'cashierName', cashier_name, 
        'cashSales', NEW."cashSales", 
        'cashIn', NEW."cashIn", 
        'cashOut', NEW."cashOut", 
        'endingCash', NEW."endingCash", 
        'expectedCash', NEW."expectedCash", 
        'discrepancy', NEW.discrepancy, 
        'closedAt', NEW."closedAt",
        'openedAt', OLD."openedAt",
        'shiftDuration', EXTRACT(EPOCH FROM shift_duration) / 3600 || ' hours'
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_shift_changes for shift %: %', COALESCE(NEW.id, OLD.id), SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER shift_audit_trigger 
  AFTER INSERT OR UPDATE ON "Shift" 
  FOR EACH ROW EXECUTE FUNCTION audit_shift_changes();

-- ============================================================
-- 13. Trigger: Auto Delete Notifications (7 days read, 30 days unread)
-- ============================================================
DROP TRIGGER IF EXISTS notification_cleanup_trigger ON "Notification";
DROP FUNCTION IF EXISTS auto_delete_old_notifications();

CREATE OR REPLACE FUNCTION auto_delete_old_notifications()
RETURNS TRIGGER AS $$
DECLARE
  deleted_read INT;
  deleted_unread INT;
BEGIN
  -- Hapus notifikasi yang sudah dibaca dan lebih dari 7 hari
  WITH deleted AS (
    DELETE FROM "Notification" 
    WHERE "createdAt" < NOW() - INTERVAL '7 days' 
      AND "isRead" = true 
    RETURNING id
  ) 
  SELECT COUNT(*) INTO deleted_read FROM deleted;
  
  -- Hapus notifikasi yang belum dibaca dan lebih dari 30 hari
  WITH deleted AS (
    DELETE FROM "Notification" 
    WHERE "createdAt" < NOW() - INTERVAL '30 days' 
      AND "isRead" = false 
    RETURNING id
  ) 
  SELECT COUNT(*) INTO deleted_unread FROM deleted;
  
  -- Log jika ada yang dihapus
  IF (deleted_read + deleted_unread) > 0 THEN
    RAISE NOTICE 'Notification cleanup: deleted % read and % unread notifications', deleted_read, deleted_unread;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in auto_delete_old_notifications: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER notification_cleanup_trigger 
  AFTER INSERT ON "Notification" 
  FOR EACH STATEMENT EXECUTE FUNCTION auto_delete_old_notifications();

-- ============================================================
-- 14. Function: Manual Cleanup (untuk cron job)
-- ============================================================
CREATE OR REPLACE FUNCTION manual_cleanup_old_data()
RETURNS TABLE(cleaned_table TEXT, deleted_count BIGINT) AS $$
DECLARE
  cnt BIGINT;
BEGIN
  -- Cleanup Notifications
  WITH deleted AS (
    DELETE FROM "Notification" 
    WHERE ("createdAt" < NOW() - INTERVAL '7 days' AND "isRead" = true) 
       OR ("createdAt" < NOW() - INTERVAL '30 days' AND "isRead" = false) 
    RETURNING *
  ) 
  SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN 
    cleaned_table := 'Notification'; 
    deleted_count := cnt; 
    RETURN NEXT; 
  END IF;
  
  -- Cleanup AuditLogs (90 hari)
  WITH deleted AS (
    DELETE FROM "AuditLog" 
    WHERE "changedAt" < NOW() - INTERVAL '90 days' 
    RETURNING *
  ) 
  SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN 
    cleaned_table := 'AuditLog'; 
    deleted_count := cnt; 
    RETURN NEXT; 
  END IF;
  
  -- Cleanup Soft Deleted Orders (180 hari)
  WITH deleted AS (
    DELETE FROM "Order" 
    WHERE "deletedAt" IS NOT NULL 
      AND "deletedAt" < NOW() - INTERVAL '180 days' 
    RETURNING *
  ) 
  SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN 
    cleaned_table := 'Order'; 
    deleted_count := cnt; 
    RETURN NEXT; 
  END IF;

  -- Cleanup old Stock Movements (365 hari)
  WITH deleted AS (
    DELETE FROM "StockMovement" 
    WHERE "createdAt" < NOW() - INTERVAL '365 days' 
    RETURNING *
  ) 
  SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN 
    cleaned_table := 'StockMovement'; 
    deleted_count := cnt; 
    RETURN NEXT; 
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 15. Indexes untuk performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notification_created_at_read ON "Notification" ("createdAt", "isRead");
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON "Notification" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON "Notification" ("userId", "isRead") WHERE "isRead" = false;

-- ============================================================
-- 16. PERBAIKAN LINTER: Kunci Fungsi Eksternal/Lainnya
-- ============================================================
DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT proname 
    FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace 
      AND prokind = 'f'
      AND proname NOT IN (
        'handle_new_auth_user',
        'update_timestamp',
        'prevent_user_delete',
        'delete_auth_user',
        'cascade_soft_delete_order',
        'audit_product_changes',
        'audit_user_changes',
        'audit_order_status_change',
        'audit_payment_changes',
        'audit_expense_changes',
        'audit_stock_movement',
        'audit_shift_changes',
        'auto_delete_old_notifications',
        'manual_cleanup_old_data'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_record.proname);
    RAISE NOTICE 'Fixed search_path for function: %', func_record.proname;
  END LOOP;
END $$;

-- ============================================================
-- 17. Grant permissions untuk service_role
-- ============================================================
GRANT EXECUTE ON FUNCTION handle_new_auth_user() TO service_role;
GRANT EXECUTE ON FUNCTION delete_auth_user() TO service_role;
GRANT EXECUTE ON FUNCTION manual_cleanup_old_data() TO service_role;