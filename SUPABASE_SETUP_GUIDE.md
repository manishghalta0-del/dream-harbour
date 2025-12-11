# 📚 Supabase Setup Guide - Invoice Enhancements

**Date:** December 11, 2025  
**Status:** Complete & Tested

---

## ⚠️ IMPORTANT: Use the Fixed SQL File

Use **`SQL_ENHANCEMENTS_FIXED.sql`** (not the original one)  
The fixed version has corrected syntax that works perfectly with Supabase.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in with your account
3. Click on project: **lqrewteclbexiknvhenk**

### Step 2: Open SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click the blue **New Query** button
3. You should see a blank SQL editor

### Step 3: Copy the Fixed SQL

1. Go to your GitHub repo: https://github.com/manishghalta0-del/dream-harbour
2. Find file: **SQL_ENHANCEMENTS_FIXED.sql**
3. Click the file to open it
4. Click the **Raw** button (top right of code)
5. Select all code (Ctrl+A or Cmd+A)
6. Copy it (Ctrl+C or Cmd+C)

### Step 4: Paste into Supabase

1. Go back to Supabase SQL Editor tab
2. Click in the text area
3. Paste the code (Ctrl+V or Cmd+V)
4. You should see the entire SQL script

### Step 5: Run the SQL

1. Click the blue **"Run"** button (bottom right)
2. OR press **Ctrl+Enter** / **Cmd+Enter**
3. Wait for it to finish (usually 5-10 seconds)
4. You should see: **"Query executed successfully"** ✅

---

## ✅ Verification

After running SQL, verify everything was created:

### Check 1: New Columns in business_settings

1. Click **Table Editor** (left sidebar)
2. Find table **business_settings**
3. Click on it to view columns
4. Scroll right to see new columns:
   - ✅ bank_name
   - ✅ account_holder_name
   - ✅ account_number
   - ✅ account_type
   - ✅ ifsc_code
   - ✅ bank_branch
   - ✅ upi_id

### Check 2: New Columns in invoices

1. In Table Editor, find table **invoices**
2. Scroll right to see new columns:
   - ✅ due_date
   - ✅ notes
   - ✅ payment_method
   - ✅ transaction_reference
   - ✅ is_reverse_charge
   - ✅ place_of_supply
   - ✅ supplier_details
   - ✅ terms_and_conditions

### Check 3: New Tables Created

1. In Table Editor, look for these new tables:
   - ✅ invoice_items
   - ✅ company_logos
   - ✅ payment_methods
   - ✅ invoice_audit_log

### Check 4: New Views Created

1. In Table Editor, scroll down to **Views** section
2. You should see:
   - ✅ v_invoice_summary
   - ✅ v_payment_summary
   - ✅ v_monthly_revenue

---

## 🐦 What Each New Column Does

### business_settings (New Fields for Bank Details)

```sql
bank_name              -- Name of your bank (e.g., "ICICI Bank Limited")
account_holder_name    -- Name on bank account (e.g., "Dream Harbour Pvt Ltd")
account_number         -- Your bank account number (e.g., "1234567890123456")
account_type           -- Type of account (e.g., "Business", "Current")
ifsc_code              -- 11-digit IFSC code (e.g., "ICIC0000001")
bank_branch            -- Branch name (e.g., "Shimla Branch")
upi_id                 -- UPI address (e.g., "dreamharbour@icici")
```

### invoices (New Fields for Invoice Enhancement)

```sql
due_date               -- When payment is due (auto-calculates in PDF)
notes                  -- Payment terms, conditions, special instructions
payment_method         -- How payment was made (e.g., "Bank Transfer", "Cash")
transaction_reference  -- Reference number for paid invoices
is_reverse_charge      -- Whether reverse charge applies (GST compliance)
place_of_supply        -- Location for tax purposes
supplier_details       -- Additional supplier info (JSON format)
terms_and_conditions   -- Invoice terms (currently stored but optional)
```

### New Tables

**invoice_items** - Stores individual line items for each invoice
- Useful for detailed invoice tracking
- Prepared for future itemized PDF features

**company_logos** - Stores your business logo
- Prepared for logo in invoice headers
- Can store base64 or URL

**payment_methods** - Stores available payment methods
- Can list: Bank Transfer, UPI, Cash, Cheque, etc.
- Helps organize payment options

**invoice_audit_log** - Tracks all changes to invoices
- Who changed what and when
- Useful for compliance and auditing

---

## 📄 Sample Data for Business Settings

After the SQL runs, update your business_settings with actual data:

```sql
-- Example update query (Optional - you can do this in the app too)
UPDATE business_settings 
SET 
    bank_name = 'ICICI Bank Limited',
    account_holder_name = 'Dream Harbour Pvt Ltd',
    account_number = '1234567890123456',
    account_type = 'Business',
    ifsc_code = 'ICIC0000001',
    bank_branch = 'Shimla Branch',
    upi_id = 'dreamharbour@icici'
WHERE id IN (SELECT id FROM business_settings LIMIT 1);
```

**Better approach:** Update in your app:
1. Go to Settings → Business Info
2. Scroll to new bank fields
3. Fill in your details
4. Click Save

---

## 📁 Complete SQL Breakdown

### Section 1: ALTER business_settings (7 columns)
Adds all the bank details fields to track payment information.

### Section 2: ALTER invoices (8 columns)
Adds fields for enhanced invoice tracking and compliance.

### Section 3: CREATE invoice_items table
New table with 14 columns for detailed line item tracking.
- Has foreign key to invoices table
- Includes indexes for performance

### Section 4: ALTER service_items (4 columns)
Adds configuration fields for services.

### Section 5: CREATE company_logos table
New table for storing company logo/branding.
- Foreign key to business_settings
- Can store base64 image or URL

### Section 6: CREATE payment_methods table
New table to list available payment methods.
- Foreign key to business_settings
- Include order and active status

### Section 7: CREATE invoice_audit_log table
New table for audit trail of invoice changes.
- Foreign key to invoices
- Tracks action type, changes, and who made them

### Section 8-9: CREATE FUNCTION & TRIGGERS
Automatically updates the `updated_at` timestamp when records are modified.

### Section 10: CREATE VIEWS
Three reporting views:
- `v_invoice_summary` - Invoice details with customer info
- `v_payment_summary` - Summary by payment status
- `v_monthly_revenue` - Revenue tracking by month

---

## 🚫 Troubleshooting

### Error: "syntax error at or near"
**Solution:** Make sure you're using `SQL_ENHANCEMENTS_FIXED.sql`, not the original file.

### Error: "column X already exists"
**Solution:** This is okay! It means the column was already there. The SQL uses `IF NOT EXISTS` so it won't fail.

### Error: "cannot create foreign key"
**Solution:** Make sure your invoices table has an `id` column. It should already exist.

### Nothing happens when I click Run
**Solution:** 
1. Make sure you copied the entire file
2. Click in the SQL editor area first
3. Try again

### I see "Query executed successfully" but don't see new columns
**Solution:**
1. Close and reopen the Table Editor
2. Refresh your browser (F5 or Ctrl+R)
3. Clear cache and reload

---

## 📝 Notes

- **All new columns are OPTIONAL** - Your app will work fine without data in them
- **Backwards compatible** - Existing data and functions are untouched
- **Performance optimized** - All tables have appropriate indexes
- **Future-proof** - New tables prepared for upcoming features
- **Easy rollback** - If needed, new columns/tables can be dropped individually

---

## ✅ Checklist

- [ ] Opened Supabase dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied SQL_ENHANCEMENTS_FIXED.sql content
- [ ] Pasted into SQL editor
- [ ] Clicked Run button
- [ ] Saw "Query executed successfully" message
- [ ] Verified new columns in business_settings (7 columns)
- [ ] Verified new columns in invoices (8 columns)
- [ ] Verified new tables (invoice_items, company_logos, payment_methods, invoice_audit_log)
- [ ] Verified views (v_invoice_summary, v_payment_summary, v_monthly_revenue)
- [ ] Ready to use new invoice features!

---

## 🚄 Next Steps

After SQL is successfully applied:

1. **Update Business Settings**
   - Go to app Settings → Business Info
   - Fill in bank details
   - Click Save

2. **Test New Invoice Features**
   - Create a new invoice
   - Notice the new fields (Due Date, Notes)
   - Add data to them
   - Download PDF to verify

3. **Share with Team**
   - Show how to use new fields
   - Explain benefits (due date tracking, payment notes)
   - Ensure bank details are accurate in PDFs

---

## 📱 Support

**Issue?** Check these files:
- `INVOICE_IMPROVEMENTS.md` - Detailed documentation
- `QUICK_START_SETUP.md` - Quick 5-minute guide
- This file - SQL-specific help

**GitHub:** https://github.com/manishghalta0-del/dream-harbour

---

**Last Updated:** December 11, 2025  
**SQL File:** SQL_ENHANCEMENTS_FIXED.sql  
**Status:** ✅ Ready to use
