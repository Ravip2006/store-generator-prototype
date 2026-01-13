# Quick Start: Dev/Prod Environment Setup

## Your Current Status
✅ **Production Supabase Project:** `yiuhqthvxeaeoevtlmxc.supabase.co`  
⏳ **Development Project:** Not yet created

---

## Step 1: Mark Current Setup as Production (For Later)

Your current `.env` files are fine for now. They contain production credentials.

```
Current State:
├── web/.env.local           ← Production (yiuhqthvxeaeoevtlmxc)
└── api/.env                 ← Production (yiuhqthvxeaeoevtlmxc)
```

---

## Step 2: When You're Ready for Proper Dev/Prod Setup

### Option A: Using the Helper Script (Easiest)

```bash
# Switch to development environment
./scripts/switch-env.sh development

# Then update the env files with your dev Supabase credentials

# Later, switch to production
./scripts/switch-env.sh production
```

### Option B: Manual Setup

1. **For Development:** Create a new Supabase project
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Create project "store-generator-dev"
   - Copy credentials
   - Update `web/.env.local` and `api/.env`

2. **For Production:** Keep using current project
   - Already have all credentials
   - Use when deploying to live server

---

## Environment File Quick Reference

| File | Use Case |
|------|----------|
| `web/.env.local` | Web development (read by Next.js) |
| `web/.env.development.local` | Web dev (Next.js loads if NODE_ENV=development) |
| `web/.env.production.local` | Web prod (Next.js loads if NODE_ENV=production) |
| `api/.env` | API development |
| `api/.env.development` | API dev template |
| `api/.env.production` | API prod template |

---

## How Environment Files Are Loaded

### Next.js (Web)
```
Priority (highest to lowest):
1. .env.{NODE_ENV}.local     ← Most specific
2. .env.{NODE_ENV}
3. .env.local
4. .env                      ← Least specific
```

### Example:
```bash
# Development (default)
NODE_ENV=development npm run dev
# Loads: .env.development.local → .env.development → .env.local → .env

# Production
NODE_ENV=production npm run build
# Loads: .env.production.local → .env.production → .env.local → .env
```

---

## Setup Timeline

### NOW (Development Phase)
```
✅ Using production Supabase project for dev
   - This is OK for prototyping
   - Just use test accounts
```

### SOON (Before Launch)
```
⏳ Create development Supabase project
   - Keeps dev/prod data separate
   - Allows safe testing
   - Use example files to configure
```

### LATER (Production Launch)
```
⏳ Deploy with production credentials
   - Set NEXT_PUBLIC_API_BASE_URL to prod domain
   - Switch to production Supabase project
   - Enable proper RLS policies
```

---

## Testing Environment Switch

### Check Current Environment

**Web:**
```typescript
// In web/lib/supabaseClient.ts, add:
console.log("Environment:", process.env.NEXT_PUBLIC_SUPABASE_URL);
```

**API:**
```javascript
// In api/index.js, add:
console.log("API Environment:", process.env.DATABASE_URL.includes("dev-project") ? "DEV" : "PROD");
```

### Verify After Switching
```bash
# Check which Supabase project is active
cd web
npm run dev
# Look at console output
```

---

## Common Tasks

### Create a New Development Project
1. Visit [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Click **New Project**
3. Fill in:
   - **Name:** store-generator-dev
   - **Region:** ap-southeast-2 (same as production)
   - **Password:** Generate strong password
4. Wait for project creation
5. Go to **Settings → API**
6. Copy:
   - **Project URL**
   - **Anon public key**
7. Update `.env` files

### Deploy to Production
```bash
# 1. Build with production env
NODE_ENV=production npm run build

# 2. Deploy (example: Vercel)
# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_API_BASE_URL

# 3. Verify it's using production Supabase
```

---

## Files Created for You

📁 **Documentation:**
- `ENV_MANAGEMENT.md` - Detailed environment management guide

📁 **Scripts:**
- `scripts/switch-env.sh` - Quick environment switcher

📁 **Examples:**
- `web/.env.development.example` - Template for dev web env
- `web/.env.production.example` - Template for prod web env
- `api/.env.development` - Dev API env template
- `api/.env.production` - Prod API env template

---

## Key Takeaways

✅ **Current Setup:** Production Supabase, fine for development  
✅ **Later Setup:** Create dev project, keep prod separate  
✅ **Switching:** Use `./scripts/switch-env.sh` or manually update files  
✅ **Deployment:** Set env vars in your hosting platform  

---

## Need Help?

1. **Read:** `ENV_MANAGEMENT.md` for detailed guide
2. **Ask:** Check Supabase docs for environment setup
3. **Test:** Use test accounts in development
4. **Monitor:** Track which env is active via console logs
