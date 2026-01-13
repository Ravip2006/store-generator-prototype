# Next Steps & Configuration Guide

## 🚀 Getting Started

### 1. Supabase Project Setup

#### Create/Configure Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use existing one
3. Note your:
   - Project URL
   - Anon Public Key

#### Enable Auth Providers
1. Go to Authentication → Providers
2. Enable Email/Password provider
3. Configure email templates (optional but recommended)
4. Set up custom email if desired

#### Set Environment Variables
Create/update `.env.local` in web directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Database Setup

#### Tables Already Available
- ✅ `customers` - Customer records
- ✅ `orders` - Order records  
- ✅ `order_items` - Order items
- ✅ `stores` - Store information

#### Verify Relationships
The system uses:
- Customer.email ↔ User auth email
- Order.customerId ↔ Customer.id

No additional migrations needed!

### 3. Testing the Feature

#### Test 1: Sign Up Flow
```
1. Navigate to checkout page
2. Click "Sign in or create account" button
3. Fill in test details:
   - Name: "Test User"
   - Phone: "+91 9876543210"
   - Email: "test@example.com"
   - Password: "TestPass123!"
4. Click "Create Account"
5. Verify success message
```

#### Test 2: Place Authenticated Order
```
1. Sign in with test account
2. Add items to cart
3. Proceed to cart
4. Verify name and phone pre-filled
5. Fill address details
6. Click "Proceed to pay"
7. Verify order created with customerId
```

#### Test 3: View My Orders
```
1. Click 👤 Account button in header
2. Click "My Orders"
3. Verify order appears with status
4. Click "View Details" to see full order
5. Verify all items display correctly
```

#### Test 4: Buy Again
```
1. On My Orders page
2. Find a test order
3. Click "Buy Again"
4. Verify cart is populated with items
5. Modify quantities if needed
6. Proceed to checkout
```

#### Test 5: Sign Out
```
1. Click 👤 Account button
2. Click "Sign Out"
3. Verify redirected to store
4. Verify 👤 button no longer shows
```

## 📋 Feature Checklist

- [ ] Supabase credentials configured
- [ ] Environment variables set
- [ ] Sign up tested and working
- [ ] Sign in tested and working
- [ ] Auto-fill on cart tested
- [ ] Customer linking verified in database
- [ ] My Orders page loading orders
- [ ] Buy Again adding items to cart
- [ ] Sign out working properly
- [ ] Account menu responsive on mobile

## 🔧 Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: 
- Check `.env.local` file exists in `/web` directory
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Restart dev server: `npm run dev`

### Issue: "Failed to create account"
**Solution**:
- Check Supabase Email/Password provider is enabled
- Verify password meets requirements (8+ chars recommended)
- Check browser console for detailed error
- Verify Supabase project is active

### Issue: "My Orders page shows blank"
**Solution**:
- Verify user is authenticated
- Check browser DevTools Network tab for API errors
- Verify orders exist for the user email
- Check API response in Network tab

### Issue: "Buy Again not adding items"
**Solution**:
- Check browser localStorage permissions
- Verify items in order have productId
- Check browser console for JavaScript errors
- Try clearing cache and refreshing

### Issue: "Account menu not showing"
**Solution**:
- Verify user is authenticated (check browser console)
- Check useAuth() is properly imported
- Verify AuthProvider wraps app in layout.tsx
- Clear browser cache

## 📚 API Testing

### Test Customer Linking
```bash
curl -X POST http://localhost:3001/customers/link \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: your-store-slug" \
  -d '{
    "authUserId": "supabase-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+91 98765 43210"
  }'
```

### Test Get Orders by Email
```bash
curl http://localhost:3001/customers/by-email/user@example.com/orders \
  -H "x-tenant-id: your-store-slug"
```

## 🎨 UI Customization

### Change Auth Modal Styling
Edit `/web/components/AuthModal.tsx`:
- Colors: Search for gradient colors (blue-600, purple-600)
- Text: Update button labels and messages
- Layout: Modify input spacing and layout

### Change Account Menu Styling
Edit `/web/app/s/[slug]/StoreFront.tsx`:
- Button colors: Update `border-purple-200 bg-purple-50`
- Dropdown position: Modify `absolute right-0`
- Menu items: Update link styling

### Change Order Page Styling
Edit `/web/app/s/[slug]/orders/orders-page-client.tsx`:
- Background: Update gradient colors
- Cards: Modify border and shadow styles
- Badges: Update status badge colors

## 📊 Analytics & Monitoring

### Monitor Authentication
- **Supabase Dashboard** → Authentication → Users
- Track new signups
- Monitor active users
- Review login attempts

### Monitor Orders
- **API Logs** → POST /customers/link calls
- **API Logs** → GET /customers/.../orders calls
- Track customer linking success rate
- Monitor order history access

### Database Metrics
- Customer growth over time
- Orders per customer
- Repeat purchase rate
- Buy Again feature usage

## 🔐 Security Checklist

- [ ] Supabase CORS properly configured
- [ ] Rate limiting on /customers/link endpoint
- [ ] No sensitive data in localStorage
- [ ] HTTPS enabled in production
- [ ] Supabase RLS policies reviewed
- [ ] Password requirements communicated
- [ ] Data privacy policy updated
- [ ] Terms of service updated

## 🚀 Production Deployment

### 1. Pre-Deployment
```bash
# Test build locally
npm run build

# Test auth endpoints
# Verify all environment variables set
# Review security settings
# Backup database
```

### 2. Deploy Frontend
```bash
# Using Vercel (recommended)
vercel deploy --prod

# Or your hosting platform
npm run build && npm start
```

### 3. Deploy Backend
```bash
# Update API server
# Restart with new code
# Verify endpoints working
```

### 4. Post-Deployment
```bash
# Test signup/signin in production
# Verify customer linking
# Monitor error logs
# Review analytics
```

## 📞 Support & Troubleshooting

### For Development Questions
1. Check IMPLEMENTATION_AUTH_BUYAGAIN.md
2. Review component code comments
3. Check Supabase documentation
4. Test in browser DevTools

### For User Issues
1. Check USER_GUIDE_AUTH.md
2. Guide through signup process
3. Verify email address
4. Check password requirements

### For Store Owner Questions
1. Review CHANGES_SUMMARY.md
2. Check API endpoints documentation
3. Monitor API logs
4. Review customer data

## 📈 Next Phase Features

Suggested enhancements for future releases:

1. **Email Verification** (Priority: High)
   - Send verification email on signup
   - Block order until verified
   - Resend verification option

2. **Password Reset** (Priority: High)
   - Email-based recovery
   - Token expiration
   - New password validation

3. **Account Settings** (Priority: Medium)
   - Edit profile information
   - Manage saved addresses
   - Change password
   - Preferences

4. **Email Notifications** (Priority: Medium)
   - Order confirmation
   - Order status updates
   - Promotional messages
   - Newsletter

5. **Loyalty Program** (Priority: Low)
   - Points per purchase
   - Rewards redemption
   - Referral bonuses
   - Special offers

---

## Quick Reference

**Key Files**:
- Auth: `/web/lib/authContext.tsx`, `/web/lib/supabaseClient.ts`
- UI: `/web/components/AuthModal.tsx`
- Pages: `/web/app/s/[slug]/orders/`
- API: `/api/index.js` (new endpoints)

**Environment**: `.env.local` in `/web`

**Testing**: See test procedures above

**Documentation**: 
- IMPLEMENTATION_AUTH_BUYAGAIN.md (technical)
- USER_GUIDE_AUTH.md (user-facing)
- CHANGES_SUMMARY.md (overview)

---

**Last Updated**: January 12, 2025
**Status**: Ready for Integration Testing
**Next Milestone**: Production Deployment
