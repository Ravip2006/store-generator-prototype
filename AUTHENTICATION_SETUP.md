# Authentication Setup Guide

This guide explains how to set up Supabase authentication for both **Development (Test)** and **Production** environments.

## Overview

Your application uses **Supabase Auth** for customer authentication. This enables:
- Customer sign-up and login
- Persistent user sessions
- Auto-fill checkout details
- Order history and "Buy Again" functionality
- Customer data for analytics and personalization

---

## Part 1: Create a Supabase Project

### Step 1: Sign Up on Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Sign Up"** and create an account (free tier available)
3. Verify your email

### Step 2: Create a New Project

1. Click **"New Project"** button
2. Enter project details:
   - **Project Name**: e.g., `store-generator-dev` (for development) or `store-generator-prod` (for production)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Select region closest to your customers
   - **Pricing Plan**: Choose "Free" for development, "Pro" for production

3. Click **"Create new project"**
4. Wait for project to initialize (2-3 minutes)

---

## Part 2: Get Your API Credentials

### Step 1: Access Project Settings

1. Once your project is ready, go to **Settings** (gear icon, bottom left)
2. Select **API** from the left sidebar

### Step 2: Copy Your Credentials

You'll see two important keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these securely** - you'll need them for both development and production.

---

## Part 3: Set Up Environment Variables

### For Development (Local Testing)

1. **Navigate to your web directory**:
   ```bash
   cd /Users/Akhandsingh/store-generator-prototype/web
   ```

2. **Create `.env.local` file** (if it doesn't exist):
   ```bash
   touch .env.local
   ```

3. **Add your development Supabase credentials**:
   ```env
   # Supabase Development
   NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key-here
   NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
   
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
   API_BASE_URL=http://127.0.0.1:3001
   ```

4. **Save the file**

5. **Restart your development server**:
   ```bash
   npm run dev
   ```

### For Production (Deployment)

**Set environment variables in your deployment platform**:

#### If Using Vercel:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add these variables for **Production**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key-here
   NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
   NEXT_PUBLIC_API_BASE_URL=https://your-prod-api-domain.com
   API_BASE_URL=https://your-prod-api-domain.com
   ```

#### If Using Other Platforms (Railway, Netlify, etc.):
Follow their documentation to set environment variables, then add the same values above.

---

## Part 4: Configure Email Authentication

### Enable Email Authentication (Required)

1. In Supabase Dashboard, go to **Authentication** (left sidebar)
2. Click **Providers**
3. Find **Email** and toggle it **ON**
4. Configure email settings:
   - **Confirm email**: Toggle ON (recommended)
   - **Enable PKCE**: Toggle ON (recommended for security)

### (Optional) Add Social Auth

You can also enable:
- Google
- GitHub
- Discord
- Apple
- Microsoft

To add these:
1. Go to **Authentication** → **Providers**
2. Click the provider you want to enable
3. Follow the prompts to configure OAuth credentials
4. Toggle it ON

---

## Part 5: Configure Database Schema (One-time)

### Create Users Table (if not auto-created)

Supabase automatically creates a `auth.users` table. For custom user data:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query to create a public users profile:

```sql
-- Create public users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read/write their own data
CREATE POLICY "Users can read own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);
```

---

## Part 6: Test Authentication

### Test in Development

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open your store**:
   ```
   http://localhost:3000/s/your-store-slug
   ```

3. **Add items to cart** and go to checkout
4. You should see the **"Sign in or create account"** button
5. Click it and test:
   - **Sign up** with a test email: `test@example.com`
   - **Sign in** with that email
   - Verify form auto-fills with your account data

### Common Test Cases

✅ Sign up with new email
✅ Sign in with existing email
✅ Verify email confirmation (check your email)
✅ Checkout as authenticated user
✅ Check "My Orders" page
✅ Test "Buy Again" functionality
✅ Sign out and verify

---

## Part 7: Configure CORS (Production Only)

### Allow Your Domain

1. Go to Supabase Dashboard
2. Settings → **API**
3. Under **Additional headers**, add your domain:
   ```
   Allowed origins: https://yourdomain.com
   ```

---

## Part 8: Deployment Checklist

### Before Going Live:

- [ ] Create separate Supabase project for production
- [ ] Set production environment variables in your deployment platform
- [ ] Test all authentication features on staging
- [ ] Enable email confirmation in production
- [ ] Set up email provider (SendGrid, Mailgun, etc.)
- [ ] Configure password reset emails
- [ ] Test sign-up and email verification flow
- [ ] Test login and session persistence
- [ ] Verify checkout works with authenticated users
- [ ] Test "My Orders" and "Buy Again" features
- [ ] Set up monitoring/logging for auth errors

---

## Troubleshooting

### "Authentication not configured. Please contact support."

**Cause**: Environment variables not set or server not restarted

**Solution**:
1. Check `.env.local` has correct values
2. Restart development server: `npm run dev`
3. Check browser console for specific errors

### "Invalid Supabase URL"

**Cause**: Wrong project URL format

**Solution**:
- Verify URL format: `https://projectref.supabase.co`
- Not: `https://projectref.supabase.com` (wrong TLD)

### "Anon Key Invalid"

**Cause**: Wrong API key copied

**Solution**:
- Go to Supabase → Settings → API
- Copy the **anon public key** (NOT the service_role key)

### Email Verification Not Working

**Cause**: Email provider not configured

**Solution**:
1. Go to Authentication → Email Templates
2. Configure your email provider:
   - Use Supabase's default (free, limited)
   - Or integrate SendGrid/Mailgun (recommended for production)

### Users Can't Sign Up

**Cause**: Email provider issue or RLS policy blocking

**Solution**:
1. Check Supabase Dashboard → Logs
2. Verify email provider is configured
3. Check RLS policies on public.users table

---

## Security Best Practices

✅ **Always use `.env.local`** - never commit credentials to Git
✅ **Use different projects** for development and production  
✅ **Enable email confirmation** in production
✅ **Use Row Level Security (RLS)** on all user data tables
✅ **Rotate API keys regularly** in production
✅ **Monitor authentication logs** for suspicious activity
✅ **Set up email rate limiting** to prevent abuse
✅ **Use HTTPS only** in production

---

## Testing with Multiple Stores

If you have multiple store slugs:

1. Authentication is **global** (Supabase account level)
2. Users can order from **any store** with same account
3. Check customer linking in each store's database

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Next.js Integration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## Quick Reference

### Development Setup (5 minutes)

```bash
# 1. Create Supabase project at supabase.com

# 2. Create .env.local in /web directory
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001" > .env.local

# 3. Restart dev server
npm run dev

# 4. Test at http://localhost:3000/s/your-store-slug
```

### Production Setup Checklist

```
☐ Create prod Supabase project
☐ Get prod URL + anon key
☐ Set env vars in deployment platform
☐ Enable email confirmation
☐ Configure email provider
☐ Test signup/signin/checkout flow
☐ Monitor authentication logs
☐ Set up alerts for failed auths
☐ Document credentials (secure vault)
☐ Plan key rotation schedule
```

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Set up environment variables
3. ✅ Test authentication locally
4. ✅ Deploy to staging
5. ✅ Deploy to production with prod credentials

Need help? Check the troubleshooting section or review Supabase docs linked above.
