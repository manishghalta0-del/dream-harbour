-- SUPABASE SQL ENHANCEMENTS FOR DREAM HARBOUR
-- Fixed Version - Copy and paste directly into Supabase SQL Editor
-- Date: December 11, 2025

-- ========================================
-- 1. ALTER BUSINESS_SETTINGS TABLE
-- ========================================
-- Add bank details one by one

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100);

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);

-- ========================================
-- 2. ALTER INVOICES TABLE
-- ========================================
-- Add additional fields for enhanced invoice tracking

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_reverse_charge BOOLEAN DEFAULT FALSE;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_details JSONB;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- ========================================
-- 3. CREATE INVOICE_ITEMS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_items(id),
    sub_service_id UUID REFERENCES service_sub_items(id),
    description TEXT NOT NULL,
    hsn_sac_code VARCHAR(20),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    gst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(12, 2),
    line_total DECIMAL(12, 2),
    display_order INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items(service_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_sub_service_id ON invoice_items(sub_service_id);

-- ========================================
-- 4. ENHANCE SERVICE_ITEMS TABLE
-- ========================================

ALTER TABLE service_items ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) DEFAULT 'Nos';

ALTER TABLE service_items ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT TRUE;

ALTER TABLE service_items ADD COLUMN IF NOT EXISTS enable_hsn BOOLEAN DEFAULT FALSE;

ALTER TABLE service_items ADD COLUMN IF NOT EXISTS cumulative_total DECIMAL(12, 2);

-- ========================================
-- 5. CREATE COMPANY_LOGOS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS company_logos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_settings(id) ON DELETE CASCADE,
    logo_base64 TEXT,
    logo_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_logos_business_id ON company_logos(business_id);

-- ========================================
-- 6. CREATE PAYMENT_METHODS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_settings(id) ON DELETE CASCADE,
    method_name VARCHAR(50) NOT NULL,
    method_type VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_business_id ON payment_methods(business_id);

-- ========================================
-- 7. CREATE INVOICE_AUDIT_LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS invoice_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL,
    changed_fields JSONB,
    changed_by VARCHAR(255),
    change_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_invoice_id ON invoice_audit_log(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_timestamp ON invoice_audit_log(change_timestamp);

-- ========================================
-- 8. CREATE FUNCTION FOR UPDATED_AT TIMESTAMP
-- ========================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

DROP TRIGGER IF EXISTS trigger_update_invoice_items_timestamp ON invoice_items;

CREATE TRIGGER trigger_update_invoice_items_timestamp
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_company_logos_timestamp ON company_logos;

CREATE TRIGGER trigger_update_company_logos_timestamp
BEFORE UPDATE ON company_logos
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_payment_methods_timestamp ON payment_methods;

CREATE TRIGGER trigger_update_payment_methods_timestamp
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ========================================
-- 10. CREATE VIEWS FOR REPORTING
-- ========================================

CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    c.full_name AS customer_name,
    c.mobile_no,
    c.email,
    i.subtotal,
    i.total_gst,
    i.total_amount,
    i.payment_status,
    CASE 
        WHEN i.due_date < CURRENT_DATE AND i.payment_status != 'paid' THEN 'OVERDUE'
        WHEN i.payment_status = 'paid' THEN 'PAID'
        ELSE 'PENDING'
    END AS status_calculated,
    i.created_at,
    i.created_by
FROM invoices i
JOIN customers c ON i.customer_id = c.id
ORDER BY i.created_at DESC;

CREATE OR REPLACE VIEW v_payment_summary AS
SELECT 
    payment_status,
    COUNT(*) AS invoice_count,
    SUM(total_amount) AS total_amount,
    AVG(total_amount) AS avg_amount,
    MIN(total_amount) AS min_amount,
    MAX(total_amount) AS max_amount
FROM invoices
GROUP BY payment_status;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
    DATE_TRUNC('month', invoice_date)::DATE AS month,
    COUNT(*) AS invoice_count,
    SUM(subtotal) AS subtotal_total,
    SUM(total_gst) AS gst_total,
    SUM(total_amount) AS revenue_total
FROM invoices
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- ========================================
-- SUCCESS - All changes applied!
-- ========================================
-- You should see "Query executed successfully" message
-- If you see any errors, report them with the line number