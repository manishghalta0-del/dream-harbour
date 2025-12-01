-- Ensure numeric precision for money fields
ALTER TABLE IF EXISTS invoices
  ALTER COLUMN subtotal TYPE numeric(12,2) USING subtotal::numeric,
  ALTER COLUMN total_gst TYPE numeric(12,2) USING total_gst::numeric,
  ALTER COLUMN total_amount TYPE numeric(12,2) USING total_amount::numeric;

ALTER TABLE IF EXISTS invoice_items
  ALTER COLUMN rate TYPE numeric(12,2) USING rate::numeric,
  ALTER COLUMN amount TYPE numeric(12,2) USING amount::numeric;
