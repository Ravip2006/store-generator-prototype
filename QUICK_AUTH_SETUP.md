# Quick Reference: Authentication Setup

## 5-Minute Setup

### 1. Create Supabase Project
- Go to https://supabase.com
- Click "New Project"
- Name: `store-generator-dev`
- Save password somewhere safe
- Wait 3 minutes for initialization

### 2. Get Your Credentials
- Click Settings (gear icon)
- Select "API"
- Copy these two values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (NOT service_role)

### 3. Create `.env.local`
```bash
cd /Users/Akhandsingh/store-generator-prototype/web
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
API_BASE_URL=http://127.0.0.1:3001
EOF
```

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Test
- Visit: http://localhost:3000/s/your-store-slug
- Add item to cart
- Go to checkout
- Click "Sign in or create account"
- Sign up works? ✅ You're done!

---

## Production Setup

### Before Deploying
```
☐ Create new Supabase project (prod separate from dev)
☐ Get prod URL + anon key
☐ Create Vercel/Railway account
☐ Set environment variables in deployment platform
☐ Enable email auth in Supabase
☐ Test signup/signin flow
☐ Set custom domain
```

### Environment Variables for Production

**In Vercel / Railway / Your hosting platform:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

---

## Verify Setup is Working

### In Browser Console (F12)

```javascript
// Should show project URL
process.env.NEXT_PUBLIC_SUPABASE_URL

// Should show anon key
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Should NOT be empty
```

### Check Server Logs

```bash
# Should see (NOT an error):
# "Supabase client initialized"

# Should NOT see:
# "Missing Supabase environment variables"
```

---

## Common Problems

| Problem | Quick Fix |
|---------|-----------|
| "Authentication not configured" | Restart: `npm run dev` |
| Env vars don't load | Kill server, wait 5s, restart |
| Sign up button missing | Check `AuthModal` import |
| Emails not sending | Enable email in Supabase |
| CORS errors | Update origin in API CORS |
| Rate limit error | Wait 60 seconds, try again |

---

## File Locations

```
Your credentials:   /web/.env.local
Template file:      /web/.env.example
Auth client:        /web/lib/supabaseClient.ts
Auth state:         /web/lib/authContext.tsx
Auth UI:            /web/components/AuthModal.tsx
Setup guide:        AUTHENTICATION_SETUP.md
Deployment guide:   PRODUCTION_DEPLOYMENT.md
Troubleshooting:    AUTH_TROUBLESHOOTING.md
```

---

## Key Credentials (Save These!)

```
Development:
  URL: https://...supabase.co
  Anon Key: eyJ...
  Project Name: store-generator-dev

Production:
  URL: https://...supabase.co
  Anon Key: eyJ...
  Project Name: store-generator-prod
```

Store in: **1Password / LastPass / Vault**

---

## Useful Links

```
Supabase Dashboard:    https://supabase.com/dashboard
Docs:                  https://supabase.com/docs
Community:             https://discord.supabase.com
Vercel Deploy:         https://vercel.com/new
Railway Deploy:        https://railway.app
```

---

## After Setup: Next Steps

1. ✅ Test sign up/sign in locally
2. ✅ Test checkout with authenticated user
3. ✅ Verify "My Orders" page works
4. ✅ Test "Buy Again" functionality
5. ✅ Deploy to staging
6. ✅ Deploy to production
7. ✅ Monitor logs for 24 hours

---

## Support

- **Setup Issues**: See AUTHENTICATION_SETUP.md
- **Deployment Issues**: See PRODUCTION_DEPLOYMENT.md
- **Error Messages**: See AUTH_TROUBLESHOOTING.md
- **Supabase Help**: https://supabase.com/docs
- **Live Chat**: Discord support on supabase.com

---

**Need help? Check AUTH_TROUBLESHOOTING.md for your specific error message.**
