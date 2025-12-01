-- Sequence for invoice numbers and generator function
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION next_invoice_number() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq bigint;
BEGIN
  seq := nextval('invoice_number_seq');
  RETURN to_char(current_date, 'YYYY') || '-' || lpad(seq::text, 6, '0');
END;
$$;
