# Authentication Troubleshooting Guide

## Error Messages & Solutions

### Error: "Authentication not configured. Please contact support."

**Cause:** Supabase environment variables are missing or not loaded

**Solution:**

1. **Check `.env.local` exists:**
   ```bash
   ls -la /Users/Akhandsingh/store-generator-prototype/web/.env.local
   ```

2. **Verify content:**
   ```bash
   cat .env.local | grep SUPABASE
   ```
   
   Should show:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Restart dev server:**
   ```bash
   # Kill current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for: `"Missing Supabase environment variables"`
   - This confirms env vars aren't loaded

5. **Verify credentials:**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Settings → API
   - Copy exact URLs and keys
   - Paste into `.env.local` (no extra spaces!)

**Still not working?**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### Error: "Invalid Supabase URL"

**Cause:** Wrong URL format

**Solution:**

❌ **Wrong formats:**
```
https://projectref.supabase.com  (wrong TLD)
https://projectref.supabase.co/  (has trailing slash)
https://your-project.supabase.co (too generic)
```

✅ **Correct format:**
```
https://your-project-ref.supabase.co
```

**Where to find it:**
1. Supabase Dashboard → Select Project
2. Settings (gear icon) → API
3. Look for "Project URL" (NOT "API Gateway")
4. Copy exactly as shown

---

### Error: "Anon Key Invalid" or "Invalid JWT"

**Cause:** Wrong or expired API key

**Solution:**

1. **Verify you're using the ANON key (not service_role):**
   - Settings → API
   - You need the **"anon public"** key
   - NOT the "service_role secret" key

2. **Copy key exactly:**
   - No extra spaces
   - No special characters at end
   - Entire string including `eyJ...`

3. **Key expired?**
   - Supabase keys don't expire (unless manually rotated)
   - But if you suspect it's compromised:
   - Settings → API → Rotate Keys
   - Update `.env.local` with new key
   - Restart server

---

### Error: "Email/Password authentication not available"

**Cause:** Email provider not enabled in Supabase

**Solution:**

1. **Enable Email Auth:**
   - Supabase Dashboard
   - Authentication (left sidebar)
   - Providers
   - Find "Email"
   - Toggle **ON**

2. **Save settings:**
   - Click "Save"
   - Wait for reload

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

### Sign Up Works But Email Verification Fails

**Cause:** Email provider not configured

**Solution:**

1. **Configure Email Provider:**
   - Authentication → Email Templates
   - See section "Configure Email Sender"
   - Options:
     - **Option A: Use Supabase's Default** (free, limited)
     - **Option B: SendGrid** (recommended) - [setup guide](https://sendgrid.com)
     - **Option C: Mailgun** (alternative)

2. **Test Email:**
   - After configuration, try signing up with test email
   - Check inbox (and spam folder!)
   - Click confirmation link

3. **No email received?**
   - Check spam/junk folder
   - Verify sender email in templates
   - Check Supabase Logs for send errors

---

### "User Already Exists"

**Cause:** Account with that email already created

**Solution:**

1. **Sign in instead of signing up**
   - Use existing password
   - Or reset password if forgotten

2. **Check in Supabase:**
   - Authentication → Users
   - Search for email
   - Verify user exists

3. **Test with different email:**
   - Try: test+unique@example.com
   - Or: test2@example.com

---

### Sign In Works But User Not Persisting

**Cause:** Session not being saved properly

**Solution:**

1. **Check browser storage:**
   - Open DevTools (F12)
   - Application → Cookies
   - Should see `sb-[project]-auth-token`

2. **Verify RLS policies:**
   - If using custom tables, check RLS
   - Policy might be blocking session read

3. **Restart browser:**
   - Close and reopen browser
   - Sometimes session cache needs refresh

4. **Clear cache:**
   ```bash
   # In browser DevTools → Application → Clear site data
   ```

---

### "Insufficient privileges" on Orders/Customers

**Cause:** RLS policy blocking database access

**Solution:**

1. **Check RLS Policies:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_policies 
   WHERE tablename = 'orders';
   ```

2. **Verify policy logic:**
   - Should allow authenticated users to read their own data
   - Check `auth.uid()` matches user_id

3. **Temporarily disable RLS for testing:**
   ```sql
   ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
   ```
   
   ⚠️ **NOT for production!** Only for debugging

4. **Re-enable RLS:**
   ```sql
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ```

---

### CORS Error: "Access to XMLHttpRequest blocked"

**Cause:** API not allowing requests from your frontend

**Solution:**

1. **Check API CORS settings:**
   
   In `/api/index.js`:
   ```javascript
   const cors = require('cors');
   
   app.use(cors({
     origin: [
       'http://localhost:3000',        // dev
       'https://yourdomain.com'        // prod
     ],
     credentials: true
   }));
   ```

2. **In Supabase for Supabase API calls:**
   - Settings → API
   - Under "Additional Headers", verify CORS origin is set

3. **Check browser console:**
   - DevTools → Network tab
   - Click failed request
   - Look for "Access-Control-Allow-Origin" header

---

### Rate Limiting / Too Many Requests

**Cause:** Exceeded authentication attempts limit

**Solution:**

1. **Wait:**
   - Default: 1 request per second per email
   - Wait 60+ seconds before retrying

2. **Check logs:**
   - Supabase Dashboard → Logs
   - Look for rate limit entries

3. **Configure rate limiting:**
   - Authentication → Policies
   - Adjust rate limits for your use case

4. **For testing:**
   - Use different test emails
   - Or increase wait time between attempts

---

### "Redirect URL not allowed"

**Cause:** Social auth redirect misconfigured (if using Google/GitHub login)

**Solution:**

1. **Check Redirect URLs:**
   - Authentication → Providers → [Your Provider]
   - Look for "Redirect URL" field
   - Add both:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```

2. **In Google/GitHub Settings:**
   - Add same URLs to OAuth consent screen
   - Authorized redirect URIs

3. **Format:**
   ```
   https://yourdomain.com/auth/callback
   ```
   (Some providers require `/callback`)

---

### Password Reset Email Not Received

**Cause:** Email not configured or invalid email

**Solution:**

1. **Verify email configuration:**
   - Authentication → Email Templates
   - Check "Password Reset" template
   - Verify sender email is set

2. **Check email in system:**
   - Authentication → Users
   - Search for email
   - Verify email matches exactly

3. **Test with different email:**
   - Create new user
   - Try reset with that email

4. **Check logs:**
   - Supabase Logs
   - Search for email-related errors

---

## Development vs Production Issues

### Development Issues

| Issue | Solution |
|-------|----------|
| Auth not loading | Restart `npm run dev` |
| Env vars not picked up | Kill server, restart |
| .env.local not found | Create in web directory |
| Can't see Sign Up button | Check AuthModal import |
| Crypto errors | Update Node.js version |

### Production Issues

| Issue | Solution |
|-------|----------|
| Environment vars missing | Set in deployment platform |
| Different emails needed | Configure sendgrid/mailgun |
| CORS errors | Update CORS whitelist |
| Rate limiting too strict | Increase limits in Supabase |
| High latency | Check database region |

---

## Testing & Verification

### Manual Testing Checklist

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console
# DevTools → Console tab

# 3. Test Sign Up
- Go to /s/[store-slug]
- Add item to cart
- Click checkout
- Click "Sign in or create account"
- Enter: test@example.com, password123, TestUser, 9876543210
- Should see: Confirmation email sent
- Check email inbox
- Click confirmation link
- Should redirect to checkout

# 4. Test Sign In
- Add item to cart again
- Click checkout
- Use same email/password
- Should see form pre-filled

# 5. Test My Orders
- Complete order
- Click account menu
- Click "My Orders"
- Should see order list

# 6. Test Buy Again
- In My Orders
- Click "Buy Again" on an order
- Should add items to cart
```

### Common Test Accounts

```
Email: test1@example.com | Password: Test123!@#
Email: test2@example.com | Password: Test123!@#
Email: test3@example.com | Password: Test123!@#
```

### Browser Console Debugging

```javascript
// Check if Supabase is initialized
console.log(window.__SUPABASE__)

// Check auth state
fetch('/api/auth/me')
  .then(r => r.json())
  .then(console.log)

// Check environment
console.log({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
})
```

---

## Getting Help

### Check These First

1. **Supabase Logs:**
   - Dashboard → Logs
   - Filter by error/warning
   - Look for relevant errors

2. **Browser Console:**
   - DevTools (F12) → Console
   - Check for JavaScript errors
   - Check for network errors

3. **Network Tab:**
   - DevTools → Network
   - Look for failed requests
   - Check response status/messages

4. **This Guide:**
   - Search for error message above
   - Common issues covered here

### Get More Help

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
- Stack Overflow: [tag:supabase]

### Report a Bug

Include:
```
1. Error message (exact)
2. Steps to reproduce
3. Browser console errors
4. Supabase Logs screenshot
5. Environment (dev/prod)
6. Supabase project name (for support team)
```

---

## Quick Reference

### Essential Commands

```bash
# Check if server is running
curl http://localhost:3000

# Restart dev server
npm run dev

# Check environment variables
grep SUPABASE .env.local

# View Supabase logs
# Supabase Dashboard → Logs (web UI)

# Test auth endpoint
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer [your-token]"
```

### File Locations

```
Configuration:
  .env.local                          # Your credentials
  .env.example                        # Template

Auth Code:
  /web/lib/supabaseClient.ts         # Client initialization
  /web/lib/authContext.tsx           # Auth state management
  /web/components/AuthModal.tsx      # Auth UI component

Guides:
  AUTHENTICATION_SETUP.md            # This file
  PRODUCTION_DEPLOYMENT.md           # Production guide
```

### Useful Supabase URLs

```
Dashboard: https://supabase.com/dashboard
Project Settings: https://supabase.com/dashboard/project/[ref]/settings/api
Authentication: https://supabase.com/dashboard/project/[ref]/auth/users
Database: https://supabase.com/dashboard/project/[ref]/editor
Logs: https://supabase.com/dashboard/project/[ref]/logs/edge-logs
```

---

## Still Having Issues?

1. **Verify setup:**
   - `.env.local` file exists
   - Contains SUPABASE_URL and SUPABASE_ANON_KEY
   - Values match your Supabase project
   - No extra spaces or quotes

2. **Restart everything:**
   ```bash
   # Kill server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

3. **Check Supabase:**
   - Project still exists
   - Project not deleted
   - API keys haven't been rotated

4. **Browser cache:**
   - DevTools → Application → Clear site data
   - Close and reopen browser

5. **Ask for help:**
   - Check Supabase Discord
   - Reference AUTHENTICATION_SETUP.md
   - Include error message and steps to reproduce

---

**Last Updated:** January 2026  
**Tested With:** Supabase latest, Next.js 14, Node.js 18+
