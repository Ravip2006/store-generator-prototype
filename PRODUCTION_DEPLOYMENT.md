# Production Deployment & Authentication Guide

## Overview

This guide covers deploying your store-generator application to production with proper authentication setup for both the web frontend and API backend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Your Domain                        │
│  (e.g., store.example.com)                          │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
    ┌─────────┐         ┌──────────┐
    │  Web    │         │   API    │
    │  (Next) │         │(Express) │
    │ Vercel  │         │ Railway  │
    └────┬────┘         └────┬─────┘
         │                   │
         └──────────┬────────┘
                    ▼
            ┌──────────────────┐
            │  Supabase Auth   │
            │  & Database      │
            └──────────────────┘
```

---

## Production Deployment Steps

### Phase 1: Prepare Your Code

```bash
# 1. Create a separate branch for production
git checkout -b production

# 2. Verify all auth checks are in place
# Already implemented in:
# - /web/lib/authContext.tsx
# - /web/lib/supabaseClient.ts
# - /web/app/s/[slug]/cart/cart-page-client.tsx

# 3. Commit any final changes
git add .
git commit -m "Production ready: auth setup complete"
```

### Phase 2: Set Up Supabase for Production

#### 2.1 Create Production Project

1. **Log into Supabase Dashboard**
2. **Create new project** (separate from development):
   - Project Name: `store-generator-prod`
   - Database Password: Strong, unique password
   - Region: Production region (closest to customers)
   - Pricing Plan: **Pro** (production needs better SLA)
3. **Save credentials** in a secure location (1Password, LastPass, etc.)

#### 2.2 Configure Production Settings

1. **Authentication:**
   - Go to Authentication → Providers
   - Enable **Email** (required)
   - Optionally enable: Google, GitHub, etc.
   
2. **Email Configuration:**
   - Go to Authentication → Email Templates
   - Configure email provider:
     - Option A: Use Supabase's default (free, limited volume)
     - Option B: Integrate SendGrid (recommended) - [docs](https://supabase.com/docs/guides/auth/auth-email-templates)
     - Option C: Integrate Mailgun

3. **Row Level Security (RLS):**
   - Go to SQL Editor
   - Run auth schema setup (see below)
   - Enable RLS on all user tables

#### 2.3 Initialize Production Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Production Database Schema

-- Create users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table (linked to auth users)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, email)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  status TEXT DEFAULT 'pending',
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: Customers (read by authenticated users who own them)
CREATE POLICY "customers_read_own" ON public.customers
  FOR SELECT USING (auth_user_id = auth.uid());

-- RLS Policies: Orders (read by authenticated users)
CREATE POLICY "orders_read_own" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = orders.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX customers_email_idx ON public.customers(email);
CREATE INDEX customers_auth_user_idx ON public.customers(auth_user_id);
CREATE INDEX orders_customer_idx ON public.orders(customer_id);
```

### Phase 3: Deploy Web Frontend

#### 3.1 Deploy to Vercel (Recommended)

1. **Connect your Git repository:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables:**
   - Go to Vercel Dashboard → Your Project → Settings
   - Environment Variables
   - Add for **Production**:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
     NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
     NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
     API_BASE_URL=https://api.yourdomain.com
     ```

3. **Deploy:**
   ```bash
   # Auto-deploys on git push to main
   # Or manual: vercel --prod
   ```

4. **Set custom domain:**
   - Settings → Domains
   - Add your domain (e.g., `store.example.com`)
   - Follow DNS configuration steps

#### 3.2 Alternative: Deploy to Railway/Netlify

**Railway:**
```bash
npm install -g @railway/cli
railway link
railway env -e production
railway up
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Then configure environment variables in platform UI.

### Phase 4: Deploy API Backend

#### 4.1 Set Up API Server

The API needs these environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Supabase
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=production
```

#### 4.2 Deploy to Railway

```bash
cd api
railway link
railway env -e production
# Add environment variables in Railway dashboard
railway up
```

#### 4.3 Deploy to Other Platforms

**Heroku:**
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set SUPABASE_URL=...
```

**DigitalOcean, AWS, etc:**
- Follow your platform's deployment docs
- Set all required environment variables
- Ensure Node.js version compatible

### Phase 5: Configure CORS

#### 5.1 Supabase CORS Settings

1. Go to Supabase Dashboard → Settings → API
2. Under "Additional headers", add:
   ```json
   {
     "Access-Control-Allow-Origin": "https://yourdomain.com"
   }
   ```

#### 5.2 API CORS Settings

In your Express API (`/api/index.js`):

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://admin.yourdomain.com'  // if you have admin subdomain
  ],
  credentials: true
}));
```

### Phase 6: Connect Frontend to Backend

#### 6.1 Update API URLs

Make sure your `.env.local` (or Vercel env vars) has:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

#### 6.2 Test API Connectivity

```bash
# From your browser console:
fetch('https://api.yourdomain.com/store', {
  headers: { 'x-tenant-id': 'your-store-slug' }
})
.then(r => r.json())
.then(console.log)
```

---

## Monitoring & Maintenance

### Set Up Monitoring

1. **Supabase Logs:**
   - Supabase Dashboard → Logs
   - Check for auth failures, database errors
   - Set up alerts for critical errors

2. **Email Delivery:**
   - Monitor confirmation emails
   - Check spam folder in testing
   - Set up bounce handling

3. **Frontend Errors:**
   - Vercel Analytics
   - Sentry.io (recommended)
   - Error tracking for auth issues

### Configure Error Alerts

Set up alerts for:
- Failed sign-ups
- Failed logins
- Database errors
- API downtime

### Scaling Considerations

**When to upgrade:**
- Users: Current Supabase free tier → Pro at 50k users
- API: Current tier → paid at consistent high traffic
- Database: Monitor query performance, add indexes

---

## Testing Checklist

### Before Going Live

- [ ] Sign up with test email works
- [ ] Verify email confirmation sends and works
- [ ] Sign in with existing email works
- [ ] Checkout as authenticated user works
- [ ] "My Orders" page loads
- [ ] "Buy Again" functionality works
- [ ] Order confirmation emails send
- [ ] Password reset flow works
- [ ] Sign out works
- [ ] Session persists across page loads
- [ ] Mobile responsive auth flow works
- [ ] Social login works (if enabled)
- [ ] Error messages are helpful
- [ ] Rate limiting works (no spam signups)
- [ ] Database backups are automatic (Supabase does this)

### Load Testing

```bash
# Simple load test with Artillery
npm install -g artillery

# Create artillery-config.yml
# Run: artillery run artillery-config.yml
```

---

## Troubleshooting Production Issues

### "Supabase connection refused"

**Cause:** Firewall blocking IP
**Solution:**
1. Check Supabase IP whitelist
2. Ensure API server is in same region
3. Test database connectivity

### Emails not sending

**Cause:** Email provider not configured
**Solution:**
1. Go to Supabase → Authentication → Email Templates
2. Configure SendGrid or Mailgun
3. Check spam folder
4. Monitor email logs

### High API Latency

**Cause:** Database queries or API server location
**Solution:**
1. Add database indexes
2. Move API server closer to users
3. Set up caching
4. Monitor slow queries

### Auth tokens expiring

**Cause:** Token lifetime too short
**Solution:**
1. Supabase Dashboard → Settings → Auth
2. Adjust "JWT expiry limit"
3. Implement refresh token handling

---

## Security Hardening

### Before Production Launch

- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set strong database password
- [ ] Rotate API keys monthly
- [ ] Enable 2FA in Supabase
- [ ] Review RLS policies
- [ ] Set up WAF rules
- [ ] Enable rate limiting
- [ ] Audit logs enabled
- [ ] Backup strategy documented

### Ongoing Security

1. **Monitor Supabase Security Advisories:**
   - Subscribe to security emails
   - Update dependencies monthly

2. **Rotate Credentials:**
   - API keys: Every 3 months
   - Database password: Every 6 months
   - Service keys: Only when needed

3. **Regular Audits:**
   - Review user permissions
   - Check RLS policies
   - Monitor access logs
   - Verify email configurations

---

## Rollback Plan

If something goes wrong in production:

```bash
# 1. Immediate: Scale down API servers
# 2. Redirect traffic to previous version
# 3. Investigate issue in staging
# 4. Create fix and test thoroughly
# 5. Deploy to production
# 6. Monitor for 24 hours
```

---

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Auth Issues: Check logs in Supabase Dashboard
- Community: https://supabase.com/community

---

## Summary

```
✅ Created separate Supabase project for production
✅ Configured authentication and email
✅ Set up RLS policies
✅ Deployed web frontend
✅ Deployed API backend
✅ Configured CORS
✅ Set up monitoring
✅ Tested all auth flows
✅ Ready for launch!
```

Your application is now production-ready with enterprise-grade authentication!
