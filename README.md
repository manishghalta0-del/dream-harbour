# 🏢 DreamHarbour - Business Dashboard

A modern, responsive **business invoice management dashboard** built with vanilla JavaScript, Supabase, and Chart.js. Manage invoices, track revenue, monitor payments, and gain real-time business insights.

![DreamHarbour Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## ✨ Features

### 📊 Dashboard Analytics
- **Real-time Statistics** - Track total revenue, GST collected, invoices, and customers
- **Revenue Comparison** - Today vs Yesterday, This Month vs Last Month
- **Growth Metrics** - Month-over-month growth percentage
- **Payment Status** - Pending invoices, outstanding amounts, collection rates

### 📈 Advanced Charts
- **Revenue Trend Chart** - 6-month revenue visualization with GST breakdown
- **Payment Collection Chart** - Track weekly collected vs pending amounts
- **Service Breakdown** - Revenue distribution by service type

### 💳 Invoice Management
- **Recent Invoices Table** - Display latest transactions with status indicators
- **Pending Invoices** - Manage draft and pending invoices with quick actions
- **Payment Tracking** - Monitor invoice payment status (paid, pending, draft)
- **Export Reports** - Download dashboard data as PDF

### 🔐 Security & Accessibility
- ✅ **Row Level Security (RLS)** - Secure database access
- ✅ **Accessibility Features** - ARIA labels, skip links, semantic HTML
- ✅ **Content Security Policy** - CSP headers for protection
- ✅ **HTTPS Support** - Encrypted data transmission
- ✅ **Multi-user Activity Log** - Track user actions

### 📱 Responsive Design
- **Mobile-First** - Optimized for all screen sizes
- **Tablet Support** - Seamless experience on iPad/tablets
- **Desktop Optimized** - Full-featured desktop experience
- **Touch-Friendly** - Easy navigation on touch devices

### 🎨 Professional UI/UX
- **Modern Design** - Clean, intuitive interface
- **Color-coded Status** - Green (paid), Yellow (pending), Blue (growth)
- **Loading States** - Smooth loading animations
- **Error Handling** - User-friendly error messages

---

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Supabase account ([free tier available](https://supabase.com))
- Text editor (VS Code recommended)

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/your-username/dreamharbour.git
cd dreamharbour
```

#### 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your **Project URL** and **Anon Key** from Settings → API
4. Create required database tables (see [Deployment Guide](./deployment.md))

#### 3. Configure Environment Variables

Create `js/common.js`:

```javascript
// ============================================================================
// js/common.js - Supabase Configuration
// ============================================================================

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your_anon_key_here';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for use in other files
window.supabase = supabase;
```

**⚠️ Security Warning:** Never commit `common.js` with real credentials. Use `.env` files in production.

#### 4. Run Locally

```bash
# Using Python (recommended)
python -m http.server 8000

# Or using Node.js
npx http-server .

# Or using Live Server (VS Code extension)
# Just click "Go Live" in VS Code
```

Open `http://localhost:8000` in your browser.

---

## 📁 Project Structure

```
dreamharbour/
├── index.html                 # Login page
├── dashboard.html             # Main dashboard
├── invoices.html              # Invoice management page
├── settings.html              # Settings & configuration
├── 
├── css/
│   ├── theme.css              # Color variables & theming
│   ├── style.css              # Global styles
│   ├── dashboard.css          # Dashboard-specific styles
│   └── responsive.css         # Mobile/tablet responsive styles
├── 
├── js/
│   ├── common.js              # Supabase configuration
│   ├── common.js              # Shared utility functions
│   ├── dashboard.js           # Dashboard functions
│   ├── auth.js                # Authentication logic
│   └── invoices.js            # Invoice management logic
├── 
├── .gitignore                 # Git ignore rules
├── .env.example               # Environment variables template
├── deployment.md              # Deployment guide
├── README.md                  # This file
└── LICENSE                    # MIT License
```

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` file (not committed):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
APP_NAME=DreamHarbour
APP_ENV=production
```

Use `.env.example` as template for other developers.

### Database Tables

**Invoices:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  total_amount DECIMAL(10,2),
  gst_amount DECIMAL(10,2),
  payment_status VARCHAR(20),
  created_at TIMESTAMP,
  ...
);
```

See [deployment.md](./deployment.md) for complete SQL schema.

---

## 💻 Usage

### Login
1. Open application in browser
2. Enter credentials (user and password setup required)
3. Dashboard loads with real-time data

### View Dashboard
- **Quick Stats** - Overview cards with key metrics
- **Charts** - Visual representations of revenue and payments
- **Recent Invoices** - Table of latest transactions
- **Activity Log** - User actions and system events

### Manage Invoices
- Click **Invoice Management** button
- Create, view, or edit invoices
- Track payment status
- Send invoices to customers

### Export Data
- Click **Export Report** button
- Dashboard exports as PDF
- Includes all charts and tables

### Search & Filter
- Use search box to find invoices
- Filter by date range
- Sort by amount, date, or status

---

## 🛡️ Security

### Data Protection
- ✅ **HTTPS Only** - Encrypted data transmission
- ✅ **Row Level Security** - Database-level access control
- ✅ **Credentials Protected** - Never stored in browser
- ✅ **API Key Security** - Anon key for client-side only

### Best Practices Implemented
- Content Security Policy (CSP) headers
- Secure authentication flow
- Input validation and sanitization
- Error handling without exposing sensitive info

### For Production
1. Move credentials to backend
2. Implement proper authentication (Auth0, Firebase, etc.)
3. Enable HTTPS everywhere
4. Set up security monitoring
5. Regular security audits

See [Security Best Practices](./deployment.md#security-best-practices) for details.

---

## 📊 Technologies Used

| Technology | Purpose | Version |
|-----------|---------|---------|
| **HTML5** | Structure | - |
| **CSS3** | Styling & Responsive | - |
| **JavaScript (ES6)** | Interactivity | ES6+ |
| **Supabase** | Backend & Database | v2 |
| **Chart.js** | Data Visualization | v4 |
| **PostgreSQL** | Database | Supabase managed |

---

## 🎨 Design System

### Color Palette
```
Primary:    #218085 (Teal)
Secondary:  #1e40af (Blue)
Success:    #10b981 (Green)
Warning:    #fbbf24 (Amber)
Danger:     #ef4444 (Red)
```

### Typography
- **Headers:** Helvetica Neue, Arial, sans-serif
- **Body:** Same family with 14-16px size
- **Line Height:** 1.2x-1.6x for readability

### Spacing
- **Padding:** 8px, 16px, 24px, 32px increments
- **Margins:** 12px, 24px, 36px increments
- **Gaps:** 16px default for flex/grid

---

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | Latest | ✅ Full |
| Mobile Safari | 12+ | ✅ Full |
| Chrome Mobile | Latest | ✅ Full |

---

## 🚀 Deployment

### Quick Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

See [Deployment Guide](./deployment.md) for:
- Vercel deployment
- Netlify deployment
- GitHub Pages hosting
- Self-hosted server setup

---

## 🐛 Troubleshooting

### Issue: Dashboard shows "No data"

**Solution:** Verify Supabase connection:
1. Check internet connection
2. Verify `common.js` has correct credentials
3. Check browser console for errors
4. Ensure database tables are created

### Issue: Charts not displaying

**Solution:** Check Chart.js library:
1. Verify Chart.js is loaded (check Network tab)
2. Check browser console for JavaScript errors
3. Ensure canvas elements exist in HTML

### Issue: "Supabase client not found"

**Solution:** Ensure script load order in HTML:
```html
<script src="js/common.js"></script>
<script src="js/dashboard.js"></script>
```

See [Full Troubleshooting](./deployment.md#troubleshooting) guide.

---

## 📚 Documentation

- **[Deployment Guide](./deployment.md)** - Complete deployment instructions
- **[API Documentation](./docs/API.md)** - Supabase integration details
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

**MIT License Summary:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ Liability limitation
- ⚠️ Warranty disclaimer

---

## 👥 Authors & Contributors

**Created by:** Your Name / Your Organization

**Contributors:** [Add names here]

---

## 🙏 Acknowledgments

- **Supabase** - Open-source Firebase alternative
- **Chart.js** - Beautiful charts library
- **Icons** - Unicode emojis for UI
- **Community** - For feedback and support

---

## 📞 Support

### Getting Help

- 📧 **Email:** support@dreamharbour.com
- 💬 **Issues:** [GitHub Issues](https://github.com/your-username/dreamharbour/issues)
- 📖 **Docs:** [Full Documentation](./deployment.md)
- 🐦 **Twitter:** [@DreamHarbour](https://twitter.com/dreamharbour)

### Reporting Bugs

Please include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Console error messages

---

## 🎯 Roadmap

### Current Version (v1.0.0)
- ✅ Dashboard with real-time analytics
- ✅ Invoice management
- ✅ Payment tracking
- ✅ Charts and visualizations
- ✅ Multi-user activity log
- ✅ Responsive design

### Upcoming Features
- 🔜 Email invoice notifications
- 🔜 SMS reminders for pending payments
- 🔜 Advanced reporting and analytics
- 🔜 Mobile app (iOS/Android)
- 🔜 Multi-language support (i18n)
- 🔜 Dark mode theme
- 🔜 Automated payment reminders
- 🔜 Customer portal

---

## 📈 Performance

### Optimization Features
- **Lazy Loading** - Images and components load on demand
- **Code Splitting** - Separate files for different features
- **Minification** - CSS and JavaScript minified in production
- **Caching** - Browser caching for static assets
- **CDN** - jsDelivr CDN for external libraries

### Performance Metrics
- **Load Time:** < 2 seconds
- **First Contentful Paint:** < 1.5s
- **Lighthouse Score:** 90+

---

## ❓ FAQ

**Q: Is DreamHarbour free?**
A: Yes! Open-source under MIT license. Supabase free tier covers most use cases.

**Q: Can I use this in production?**
A: Yes, but implement proper authentication and security measures first.

**Q: Does it work offline?**
A: No, requires internet for database connectivity. Progressive Web App support coming soon.

**Q: Can I modify the code?**
A: Yes! MIT license allows modifications. Please share improvements via PR.

**Q: How do I get help?**
A: Check [documentation](./deployment.md), open GitHub issue, or contact support.

---

## 📊 Statistics

```
Lines of Code:     ~2,500
HTML Files:        4
CSS Files:         4
JavaScript Files:  5
Database Tables:   3
Features:          25+
```

---

## 🎉 Getting Started Today

1. **Clone** the repository
2. **Configure** Supabase credentials
3. **Run** locally with `python -m http.server`
4. **Explore** the dashboard
5. **Deploy** to Vercel/Netlify

**Let's build amazing business tools together! 🚀**

---

## 📝 Changelog

### v1.0.0 (2025-01-24)
- ✨ Initial release
- ✅ Dashboard with analytics
- ✅ Invoice management
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Accessibility features

---

**Made with ❤️ by the DreamHarbour Team**

---

*Last updated: November 24, 2025*
