# Dream Harbour - Setup Guide

## 🚀 Quick Start

Your Dream Harbour application is deployed and ready to use! Follow these steps to get it working:

---

## 📋 STEP 1: Verify Supabase Project

1. Go to your Supabase dashboard: **https://supabase.com**
2. Find your project: **lqrewteclbexiknvhenk**
3. Note your credentials:
   - **URL:** `https://lqrewteclbexiknvhenk.supabase.co`
   - **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (check `.env.local`)

---

## 🗄️ STEP 2: Create Database Tables

You need 4 tables in your Supabase database:

### Table 1: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### Table 2: `invoices`
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  invoice_number TEXT UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  total_gst DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 3: `customers`
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 4: `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  sac_code TEXT,
  rate DECIMAL(10,2),
  gst_percent DECIMAL(5,2) DEFAULT 18,
  category TEXT,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 👤 STEP 3: Add Test User

Insert a test user in Supabase:

```sql
INSERT INTO users (phone_number, pin, full_name, role, is_active)
VALUES ('9876543210', '123456', 'Test User', 'admin', true);
```

**Login Credentials:**
- **Phone:** `9876543210`
- **PIN:** `123456`

---

## 🧪 STEP 4: Test the Application

1. **Open login page:** Navigate to your deployed app (or `index.html` locally)
2. **Check Debug Console:**
   - Scroll to bottom to see "Debug Console"
   - Should show green checkmarks for:
     - ✅ Initializing application
     - ✅ Supabase library loaded
     - ✅ Supabase client created

3. **Attempt Login:**
   - Phone: `9876543210`
   - PIN: `123456`
   - Click "Login"

4. **Monitor Debug Console:**
   - Should show:
     - ✅ Querying users table...
     - ✅ User found: Test User
     - ✅ Redirecting to dashboard

---

## 🔍 Troubleshooting

### ❌ Error: "Supabase not yet loaded"
- **Cause:** CDN not loading Supabase library
- **Fix:** Check internet connection, wait 2-3 seconds

### ❌ Error: "Database error: auth.invalid_grant"
- **Cause:** Supabase credentials invalid
- **Fix:** Verify URL and Anon Key in config.js and .env.local

### ❌ Error: "No user found"
- **Cause:** Test user doesn't exist or credentials wrong
- **Fix:**
  1. Go to Supabase dashboard
  2. SQL Editor → Run the INSERT query from STEP 3
  3. Verify users table has a record with phone `9876543210` and pin `123456`
  4. Check that `is_active` is `true`

### ❌ Error: "Invalid phone number or PIN"
- **Cause:** Phone/PIN format wrong
- **Fix:**
  - Phone must be exactly 10 digits
  - PIN must be exactly 6 digits
  - Use test credentials: `9876543210` and `123456`

### ❌ Dashboard shows empty stats
- **Cause:** No invoices/customers data yet (expected)
- **Fix:** This is normal. Create invoices to populate stats

### ❌ Charts not showing
- **Cause:** No data in database
- **Fix:** Create some invoices first

---

## 📝 File Checklist

- ✅ `index.html` - Login page with debug console
- ✅ `dashboard.html` - Dashboard with tabs, stats, charts
- ✅ `invoices.html` - Invoice generator with GST calculator
- ✅ `settings.html` - Business info & service management
- ✅ `config.js` - Supabase configuration
- ✅ `.env.local` - Environment variables
- ✅ `.gitignore` - Environment file protection

---

## 🎯 What's Working

✅ **Supabase Authentication** - Login with phone/PIN
✅ **Dashboard** - Overview with stats, invoices, customers tabs
✅ **Invoice Generator** - Create invoices with GST calculation
✅ **Settings** - Manage business info & services
✅ **Session Timer** - 5-minute session with extend option
✅ **Charts** - Revenue trend & invoice status (when data exists)
✅ **Responsive** - Works on mobile, tablet, desktop

---

## 🔧 What Needs Backend Integration

⚠️ **Save Functionality** - Currently saves to localStorage only
⚠️ **Real Database Persistence** - Need to implement Supabase inserts/updates
⚠️ **PDF Export** - Not yet implemented
⚠️ **Email Sending** - Not yet implemented
⚠️ **Bulk Operations** - Not yet implemented

---

## 📞 Support

**Issues?** Check the Debug Console at the bottom of the login page!

It will show you:
- ✅ What's working
- ❌ What's broken
- 💬 Detailed error messages

---

## 🚀 Next Steps

1. ✅ Create database tables (STEP 2)
2. ✅ Add test user (STEP 3)
3. ✅ Test login (STEP 4)
4. ❌ Implement data persistence (Supabase inserts)
5. ❌ Add real customer creation
6. ❌ Add real invoice saving
7. ❌ Add CSV/PDF export

---

**Created:** December 7, 2025
**Status:** ✅ Ready for Testing
**Version:** 1.0