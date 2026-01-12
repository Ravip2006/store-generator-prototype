# Setup RESEND Email Provider for Supabase

## Complete Setup Guide

### Step 1: Create RESEND Account (2 minutes)

1. Go to: **[resend.com](https://resend.com)**
2. Click **Sign up**
3. Enter email and password
4. Verify email
5. Done! ✅

---

### Step 2: Get RESEND API Key (1 minute)

1. In RESEND dashboard, go to **Settings**
2. Click **API Keys**
3. Copy the **default API key** (starts with `re_`)
4. Keep it safe - you'll need it shortly

Example format:
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Step 3: Add Domain (Optional but Recommended)

**For Testing (Skip this - use default):**
- Emails come from: `noreply@resend.dev`

**For Production (Do this later):**
1. In RESEND → **Settings → Domains**
2. Add your domain (e.g., notifications@yourstore.com)
3. Verify DNS records
4. Use in Supabase

---

### Step 4: Configure RESEND in Supabase

1. **Go to:** Supabase Dashboard → Your Project → **Settings**
2. **Click:** **Email**
3. **Find:** SMTP Settings section
4. **Select Provider:** Look for **RESEND** option

If RESEND isn't in dropdown:
1. **Select:** "Custom SMTP"
2. **Fill in:**

```
SMTP Host:        smtp.resend.com
SMTP Port:        587
SMTP User:        resend
SMTP Password:    [YOUR RESEND API KEY]
Sender Email:     noreply@resend.dev  (or your domain)
Sender Name:      [Your App Name]
```

---

### Step 5: Test Configuration

In Supabase → **Email**:
- Click: **"Send test email"**
- Enter: Your personal email
- Should receive test email in 10 seconds ✅

---

### Step 6: Try Signup Again

1. Go to your web app
2. Sign up with: `data@gmail.com`
3. Should work now! ✅

---

## Detailed SMTP Configuration

### For RESEND (Copy These Exact Values)

```
Provider:         RESEND
SMTP Host:        smtp.resend.com
SMTP Port:        587
SMTP User:        resend
SMTP Password:    re_xxxxxxxxxxxxxx (your API key)
Sender Email:     noreply@resend.dev
Sender Name:      Your Store Name
```

### Example Complete Setup:
```
SMTP Host:        smtp.resend.com
SMTP Port:        587
SMTP User:        resend
SMTP Password:    re_8xxxxxxxxxxxxxxxxxxxxxxxxxxx
Sender Email:     noreply@resend.dev
Sender Name:      Store Generator
Enable TLS:       ✅ (Usually default)
```

---

## Verify It's Working

### After Setup, Test Signup:

1. **Navigate to:** Your web app signup page
2. **Enter:**
   - Email: `test@gmail.com`
   - Password: `SecurePass123!`
   - Phone: `0123456789`
   - Name: `Test User`
3. **Click:** Create Account
4. **Should see:**
   - ✅ "Check your email to confirm"
   - 📧 Email arrives in inbox (check spam folder)
   - ✅ Click confirmation link
   - ✅ Account created successfully

---

## Troubleshooting

### Q: Got error "Invalid credentials"
**A:** 
- Double-check API key is correct (copy-paste from RESEND dashboard)
- Make sure it's not expired
- Try generating a new API key in RESEND

### Q: Emails not arriving
**A:**
- Check spam/promotions folder
- Wait 30 seconds (RESEND takes time)
- Check RESEND dashboard → Logs for errors
- Verify sender email is correct

### Q: RESEND option not in dropdown
**A:**
- Use "Custom SMTP" instead
- Fill in RESEND SMTP details manually (see above)

### Q: "Sender email not configured"
**A:**
- Make sure "Sender Email" field is filled
- Use: `noreply@resend.dev` (for testing)
- Or your custom domain if set up

---

## Pricing & Limits

### RESEND Free Tier:
- **100 emails/day** free
- Perfect for testing
- No credit card required for testing

### RESEND Paid:
- **$20/month** → 5,000 emails/month
- Pay-as-you-go options
- Email analytics included

---

## After Signup Works - Next Steps

### Keep Testing:
1. Create multiple test accounts
2. Test password reset
3. Test order confirmation emails
4. Check email templates

### Before Production:
1. Add your domain to RESEND
2. Update "Sender Email" to your domain
3. Verify DNS records
4. Test with real emails

---

## Quick Checklist

- [ ] Create RESEND account
- [ ] Get API key from RESEND
- [ ] Go to Supabase → Settings → Email
- [ ] Enter RESEND SMTP settings
- [ ] Set Sender Email: `noreply@resend.dev`
- [ ] Click "Save"
- [ ] Send test email
- [ ] Receive test email ✅
- [ ] Try signing up
- [ ] Check confirmation email arrives
- [ ] Click confirmation link
- [ ] Done! 🎉

---

## Configuration Screenshot Reference

When you see this in Supabase:

```
Email Configuration
├─ Provider:           [Select RESEND or Custom SMTP]
├─ SMTP Host:         smtp.resend.com
├─ SMTP Port:         587
├─ SMTP User:         resend
├─ SMTP Password:     [Your API Key]
├─ Sender Email:      noreply@resend.dev
├─ Sender Name:       Your App Name
└─ [Send test email] button
```

Fill it exactly like this ☝️

---

## Support

**RESEND Issues?** 
- Visit: [resend.com/docs](https://resend.com/docs)
- Check: RESEND dashboard → Logs
- Email: [support@resend.com](mailto:support@resend.com)

**Supabase Issues?**
- Visit: [supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)
- Community: Discord or GitHub

---

**Estimated time to complete: 5-10 minutes**

Let me know when you've set it up! 🚀
