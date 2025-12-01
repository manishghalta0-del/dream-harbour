-- Add foreign keys and indexes
ALTER TABLE IF EXISTS invoices
  ADD CONSTRAINT IF NOT EXISTS fk_invoices_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE IF EXISTS invoice_items
  ADD CONSTRAINT IF NOT EXISTS fk_invoiceitems_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile_no ON customers(mobile_no);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- GIN index example for jsonb
CREATE INDEX IF NOT EXISTS idx_service_items_linked_ids ON service_items USING gin (linked_service_ids);
