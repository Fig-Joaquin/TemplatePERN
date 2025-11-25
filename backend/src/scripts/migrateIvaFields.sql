-- Migración para agregar campos de IVA histórico
-- Ejecutar este script en la base de datos PostgreSQL

-- ========================================
-- 1. Modificar tabla 'taxes' para agregar campos de identificación
-- ========================================
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE taxes ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Actualizar el impuesto existente (IVA 19%) como el predeterminado
UPDATE taxes 
SET code = 'IVA', 
    name = 'Impuesto al Valor Agregado', 
    is_default = true 
WHERE tax_id = 1;

-- Si hay otros impuestos, asegurarse de que no sean default
UPDATE taxes 
SET is_default = false 
WHERE tax_id != 1 AND is_default IS NULL;

-- ========================================
-- 2. Modificar tabla 'quotations' para agregar campos de IVA histórico
-- ========================================
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2);

-- Poblar las cotizaciones existentes con IVA 19% (valor histórico asumido)
-- Subtotal = total_price / 1.19
-- Tax Amount = total_price - subtotal
UPDATE quotations 
SET tax_rate = 19,
    subtotal = ROUND(total_price / 1.19, 2),
    tax_amount = ROUND(total_price - (total_price / 1.19), 2)
WHERE tax_rate IS NULL AND total_price IS NOT NULL AND total_price > 0;

-- ========================================
-- 3. Modificar tabla 'work_orders' para agregar campos de IVA histórico
-- ========================================
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2);

-- Poblar las órdenes de trabajo existentes con IVA 19%
UPDATE work_orders 
SET tax_rate = 19,
    subtotal = ROUND(total_amount / 1.19, 2),
    tax_amount = ROUND(total_amount - (total_amount / 1.19), 2)
WHERE tax_rate IS NULL AND total_amount IS NOT NULL AND total_amount > 0;

-- ========================================
-- 4. Modificar tabla 'work_product_details' para agregar campo de tasa aplicada
-- ========================================
ALTER TABLE work_product_details ADD COLUMN IF NOT EXISTS applied_tax_rate DECIMAL(5,2);

-- Poblar los detalles existentes con IVA 19%
UPDATE work_product_details 
SET applied_tax_rate = 19
WHERE applied_tax_rate IS NULL;

-- ========================================
-- 5. Crear índices para mejorar rendimiento
-- ========================================
CREATE INDEX IF NOT EXISTS idx_taxes_is_default ON taxes(is_default);
CREATE INDEX IF NOT EXISTS idx_taxes_code ON taxes(code);

-- ========================================
-- Verificación de la migración
-- ========================================
-- SELECT 'taxes' as tabla, count(*) as registros, count(code) as con_code, count(is_default) as con_default FROM taxes
-- UNION ALL
-- SELECT 'quotations', count(*), count(tax_rate), count(subtotal) FROM quotations
-- UNION ALL  
-- SELECT 'work_orders', count(*), count(tax_rate), count(subtotal) FROM work_orders
-- UNION ALL
-- SELECT 'work_product_details', count(*), count(applied_tax_rate), 0 FROM work_product_details;

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración de campos IVA completada exitosamente';
END $$;
