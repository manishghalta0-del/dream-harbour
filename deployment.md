# DreamHarbour - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Supabase Configuration](#supabase-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Pipeline](#cicd-pipeline)

---

## Prerequisites

Before deploying DreamHarbour, ensure you have:

- **Supabase Account** - [Create free account](https://supabase.com)
- **Node.js 16+** (for development)
- **Git** - Version control
- **npm or yarn** - Package manager
- **Text Editor** - VS Code recommended
- **Hosting Platform** - Vercel, Netlify, GitHub Pages, or self-hosted server

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dreamharbour.git
cd dreamharbour
```

### 2. Create Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Application
APP_NAME=DreamHarbour
APP_ENV=development
API_URL=http://localhost:3000
```

**To get your Supabase keys:**

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy **Project URL** and **Anon/Public Key**

### 3. Start Local Development

```bash
# Open index.html in your browser (for static site)
# Or use a local server:

npx http-server .
# Server runs at http://localhost:8080

# Alternative: Use Python
python -m http.server 8000
# Server runs at http://localhost:8000
```

### 4. Test the Application

- Navigate to `http://localhost:8000`
- Open browser DevTools (F12)
- Check Console for errors
- Test login functionality
- Verify dashboard loads data from Supabase

---

## Production Deployment

### Option 1: Deploy to Vercel (Recommended)

**Vercel is ideal for static sites and provides free tier:**

#### Step 1: Connect Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### Step 2: Configure Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings → Environment Variables**
4. Add:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key

#### Step 3: Configure Production Domain

1. In Vercel dashboard, go to **Domains**
2. Add your custom domain
3. Update DNS records as instructed

---

### Option 2: Deploy to Netlify

**Netlify provides easy deployment with UI:**

#### Step 1: Connect Repository

1. Go to [Netlify](https://netlify.com)
2. Click **New site from Git**
3. Connect your GitHub/GitLab/Bitbucket repository
4. Select the branch to deploy (usually `main`)

#### Step 2: Build Settings

- **Build command:** `echo "Static site - no build needed"` (or leave blank)
- **Publish directory:** `.` (root directory)

#### Step 3: Add Environment Variables

1. Go to **Site settings → Build & deploy → Environment**
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

#### Step 4: Deploy

Netlify automatically deploys when you push to your branch.

---

### Option 3: Deploy to GitHub Pages

**Free hosting directly from GitHub:**

#### Step 1: Configure Repository

```bash
# Create gh-pages branch
git checkout -b gh-pages

# Push to GitHub
git push origin gh-pages
```

#### Step 2: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings → Pages**
3. Under "Source", select **gh-pages** branch
4. Click **Save**

#### Step 3: Custom Domain (Optional)

1. In **Settings → Pages → Custom domain**
2. Enter your domain name
3. Update DNS records with your registrar

**Note:** Static hosting won't automatically use your environment variables. You'll need to hardcode or use a build process.

---

### Option 4: Self-Hosted Server

**Deploy to your own server (VPS, dedicated, etc.):**

#### Step 1: Prepare Server

```bash
# SSH into your server
ssh user@your-server.com

# Install web server (Nginx example)
sudo apt-get update
sudo apt-get install nginx

# Install Node.js (if using Node.js backend)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 2: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/dreamharbour
cd /var/www/dreamharbour

# Clone repository
git clone https://github.com/your-username/dreamharbour.git .

# Create .env file
sudo nano .env
# Add your environment variables

# Set permissions
sudo chown -R www-data:www-data /var/www/dreamharbour
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/dreamharbour`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/dreamharbour;
    index dashboard.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/dreamharbour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Enable HTTPS (SSL/TLS)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Supabase Configuration

### 1. Create Database Tables

Log in to Supabase and create these tables:

#### Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  service_type VARCHAR(100),
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  gst_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Set Row Level Security (RLS)

In Supabase, enable RLS on all tables:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 3. Create Policies

```sql
-- Allow authenticated users to read their invoices
CREATE POLICY "Users can read invoices" ON invoices
FOR SELECT USING (auth.role() = 'authenticated_user');

-- Allow authenticated users to create invoices
CREATE POLICY "Users can create invoices" ON invoices
FOR INSERT WITH CHECK (auth.role() = 'authenticated_user');
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ **Never commit `.env` files** - Use `.env.example` instead
- ✅ **Use strong, unique keys** for production
- ✅ **Rotate keys periodically**
- ✅ **Use different keys for dev/staging/production**

### 2. Supabase Security
- ✅ **Enable Row Level Security (RLS)** on all tables
- ✅ **Use authenticated users** instead of anon key for sensitive operations
- ✅ **Implement proper access control policies**
- ✅ **Audit logs** - Monitor who accesses what data

### 3. HTTPS/SSL
- ✅ **Always use HTTPS** in production
- ✅ **Enable HSTS** (HTTP Strict Transport Security)
- ✅ **Use secure cookies** for session management

### 4. Content Security Policy (CSP)
Your CSP is already configured in `dashboard.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://cdn.jsdelivr.net
">
```

### 5. Data Protection
- ✅ **Encrypt sensitive data** at rest and in transit
- ✅ **Implement data backup** strategy
- ✅ **Comply with GDPR/privacy regulations**
- ✅ **Use HTTPS for all API calls**

---

## Troubleshooting

### Issue: "Supabase client not found"

**Solution:** Ensure `js/config.js` is loaded before `js/dashboard.js`:

```html
<script src="js/config.js"></script>
<script src="js/dashboard.js"></script>
```

### Issue: "CORS Error"

**Solution:** Update Supabase CORS settings:

1. Go to Supabase Dashboard → Settings → API
2. Add your domain to CORS allowed origins

### Issue: Environment variables not loading

**Solution:** Restart your build/server after adding new `.env` variables

```bash
# For local development
npm run dev
# or
vercel dev

# For production, redeploy
vercel --prod
```

### Issue: 404 Errors on Page Refresh (SPA)

**Solution:** Configure your web server to serve `index.html` for all routes:

**Netlify:** Create `netlify.toml`:

```toml
[[redirects]]
from = "/*"
to = "/dashboard.html"
status = 200
```

**Vercel:** Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/dashboard.html" }
  ]
}
```

**Nginx:**

```nginx
location / {
  try_files $uri $uri/ /dashboard.html;
}
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database tables created in Supabase
- [ ] RLS policies implemented
- [ ] HTTPS/SSL certificate installed
- [ ] DNS records updated (if custom domain)
- [ ] Backup strategy in place
- [ ] Monitoring/logging configured
- [ ] Error tracking (Sentry, etc.) set up
- [ ] Performance optimized
- [ ] Security audit completed

---

## Monitoring & Maintenance

### Set Up Error Tracking

**Sentry Example:**

```javascript
// In js/common.js
Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/project",
  environment: "production"
});
```

### Monitor Performance

- Use Vercel/Netlify built-in analytics
- Set up Google Analytics
- Monitor Core Web Vitals
- Check Supabase metrics

### Regular Maintenance

- ✅ Update dependencies monthly
- ✅ Review security logs weekly
- ✅ Backup database regularly
- ✅ Monitor uptime and performance
- ✅ Test disaster recovery procedures

---

## Support & Documentation

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **MDN Web Docs:** https://developer.mozilla.org

---

## Questions?

If you encounter any issues during deployment, check:

1. Browser console for JavaScript errors
2. Network tab for failed requests
3. Supabase dashboard for database errors
4. Hosting platform logs for deployment issues

Good luck with your deployment! 🚀
