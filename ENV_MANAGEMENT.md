# Environment Management: Development vs Production

This guide explains how to manage separate development and production Supabase projects.

## Current Setup

Your current setup is using a **production Supabase project** for development, which works but is not ideal for real production deployment.

```
Current: yiuhqthvxeaeoevtlmxc.supabase.co (Production Project)
```

## Best Practice: Separate Dev & Prod Projects

### Step 1: Create a Development Supabase Project

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Create a **new project** for development (e.g., "store-generator-dev")
3. Copy the project credentials:
   - **URL:** `https://your-dev-project-ref.supabase.co`
   - **ANON_KEY:** `sb_publishable_xxxxx...`

### Step 2: Use Your Current Project as Production

Your current project will be your **production** environment:
- **URL:** `https://yiuhqthvxeaeoevtlmxc.supabase.co`
- **ANON_KEY:** `sb_publishable_6m5CUEeIlwHr7ytB58UeoA_o2RrYJ7I`

---

## File Structure for Environment Management

### Web (.env files)

#### `.env.development.local` (Development - NEW)
```dotenv
# Development Environment
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dev_key_xxx
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
```

#### `.env.production.local` (Production - CREATE THIS LATER)
```dotenv
# Production Environment
NEXT_PUBLIC_SUPABASE_URL=https://yiuhqthvxeaeoevtlmxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6m5CUEeIlwHr7ytB58UeoA_o2RrYJ7I
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

#### `.env.local` (Current - NOW FOR DEVELOPMENT)
```dotenv
# This is your DEVELOPMENT environment
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dev_key_xxx
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
```

### API (.env files)

#### `.env` (Development - UPDATE THIS)
```dotenv
# Development environment
DATABASE_URL="postgresql://user:pass@dev-pooler.supabase.com:6543/postgres?sslmode=require"
APP_DATABASE_URL="postgresql://app_user:pass@dev-pooler.supabase.com:6543/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dev_key_xxx
```

#### `.env.production` (Production - CREATE THIS LATER)
```dotenv
# Production environment
DATABASE_URL="postgresql://postgres.yiuhqthvxeaeoevtlmxc:password@aws-1-ap-southeast-2.pooler.supabase.co:6543/postgres?sslmode=require"
APP_DATABASE_URL="postgresql://app_user.yiuhqthvxeaeoevtlmxc:password@aws-1-ap-southeast-2.pooler.supabase.co:6543/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL=https://yiuhqthvxeaeoevtlmxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6m5CUEeIlwHr7ytB58UeoA_o2RrYJ7I
```

---

## How to Switch Environments

### For Local Development
No action needed! Your current `.env.local` files are for development.

```bash
# Just run normally
cd web
npm run dev

cd api
npm run dev
```

### For Production Deployment (When Ready)

#### Step 1: Update package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "build:prod": "NODE_ENV=production next build",
    "start:prod": "NODE_ENV=production next start"
  }
}
```

#### Step 2: Use environment-specific env files
Next.js automatically loads env files in this order:
1. `.env.{NODE_ENV}.local` (most specific)
2. `.env.{NODE_ENV}`
3. `.env.local`
4. `.env`

#### Step 3: Deploy with production env
```bash
# When deploying to production (e.g., Vercel)
NODE_ENV=production npm run build

# Or set in deployment platform:
# - Vercel: Settings → Environment Variables → Add .env.production.local values
# - Docker: Copy .env.production during build
# - Railway/Render: Set env vars in dashboard
```

---

## Quick Reference

| Phase | Supabase Project | URL | When |
|-------|-----------------|-----|------|
| **Development** | New (Dev Project) | `your-dev-project.supabase.co` | Now (Setup first) |
| **Production** | Current Project | `yiuhqthvxeaeoevtlmxc.supabase.co` | When going live |

---

## Environment Variables Checklist

### For Development
- [ ] Create a new Supabase project (development)
- [ ] Update `.env.development.local` with dev credentials
- [ ] Update `api/.env` with dev database URLs
- [ ] Test locally with dev environment

### For Production (When Ready)
- [ ] Create `.env.production.local` file
- [ ] Create `api/.env.production` file
- [ ] Add credentials for yiuhqthvxeaeoevtlmxc project
- [ ] Set up production API server
- [ ] Configure deployment platform env vars
- [ ] Test in staging first

---

## .gitignore (Already configured)

Make sure these files are in `.gitignore`:
```
.env.local
.env.development.local
.env.production.local
.env
```

**Never commit actual credentials to git!**

---

## Common Issues

### Q: How do I know which environment I'm using?
Add a console log to verify:

**web/lib/supabaseClient.ts:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
console.log("Using Supabase:", supabaseUrl); // Will show dev or prod URL
```

### Q: Can I use the same Supabase project for dev and prod?
Not recommended. Reasons:
- Can't test without affecting production
- Analytics are mixed
- Data separation is important
- Pricing may be affected

### Q: How to backup prod data before testing?
1. Use Supabase's backup feature
2. Export database from prod project
3. Keep test account separate from real users

---

## Next Steps

1. **Now:** Update `.env` files to mark current setup as development
2. **Soon:** Create a new Supabase project for production
3. **Before Launch:** Set up production environment files
4. **Deployment:** Configure platform-specific env vars

---

For help, see:
- [Supabase Environment Variables](https://supabase.com/docs/guides/environments)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
