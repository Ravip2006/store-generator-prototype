# Authentication Flow Diagrams

## 1. Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION SETUP FLOW                   │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Create Supabase Project
  │   └─→ Go to supabase.com
  │   └─→ Create new project
  │   └─→ Get credentials
  │
  ├─→ Create .env.local File
  │   └─→ Add NEXT_PUBLIC_SUPABASE_URL
  │   └─→ Add NEXT_PUBLIC_SUPABASE_ANON_KEY
  │   └─→ Save file
  │
  ├─→ Restart Dev Server
  │   └─→ Kill: Ctrl+C
  │   └─→ Start: npm run dev
  │   └─→ Wait for build
  │
  ├─→ Enable Email Auth (Optional)
  │   └─→ Supabase → Authentication → Providers
  │   └─→ Toggle "Email" ON
  │   └─→ Save
  │
  ├─→ Test Auth
  │   └─→ Go to http://localhost:3000/s/store-slug
  │   └─→ Add item to cart
  │   └─→ Go to checkout
  │   └─→ Click "Sign in or create account"
  │
  └─→ SUCCESS ✅
      Auth is working!
```

---

## 2. Sign Up Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SIGN UP FLOW                        │
└─────────────────────────────────────────────────────────────┘

User enters checkout page
          │
          ▼
    [Sign in/Create Account Button]
          │
          ▼
    AuthModal Opens
          │
          ▼
    User fills form:
    ├─ Email: test@example.com
    ├─ Password: SecurePass123
    ├─ Name: John Doe
    └─ Phone: +1234567890
          │
          ▼
    User clicks "Sign Up"
          │
          ▼
    ┌─────────────────────────────────┐
    │ authContext.signUp() called     │
    │ 1. Check supabase initialized   │
    │ 2. Call supabase.auth.signUp()  │
    │ 3. User created in auth.users   │
    │ 4. Metadata stored (name, phone)│
    └─────────────────────────────────┘
          │
          ▼
    Confirmation email sent (if email auth enabled)
          │
          ├─→ [User checks email]
          │       │
          │       ▼
          │   [Clicks confirmation link]
          │       │
          │       ▼
          │   Email verified ✅
          │
          └─→ [Email skipped for now]
                  │
                  ▼
         Session created
         Auth state updated
                  │
                  ▼
    Form auto-fills with user data:
    ├─ Name: John Doe
    └─ Phone: +1234567890
                  │
                  ▼
    User completes checkout
                  │
                  ▼
    Order created + customer linked
                  │
                  ▼
         SUCCESS ✅
    User signed up and checked out!
```

---

## 3. Sign In Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER SIGN IN FLOW                       │
└─────────────────────────────────────────────────────────────┘

Returning user visits checkout
          │
          ▼
    [Sign in/Create Account Button]
          │
          ▼
    AuthModal Opens (default to Sign In tab)
          │
          ▼
    User enters:
    ├─ Email: test@example.com
    └─ Password: SecurePass123
          │
          ▼
    User clicks "Sign In"
          │
          ▼
    ┌─────────────────────────────────┐
    │ authContext.signIn() called     │
    │ 1. Check supabase initialized   │
    │ 2. Call supabase.auth.signIn()  │
    │ 3. Verify credentials           │
    │ 4. Session created              │
    └─────────────────────────────────┘
          │
          ▼
    onAuthStateChange triggered
          │
          ▼
    ┌─────────────────────────────────┐
    │ AuthContext updates with:       │
    │ - user.id                       │
    │ - user.email                    │
    │ - user.name (from metadata)     │
    │ - user.phone (from metadata)    │
    │ - isAuthenticated = true        │
    └─────────────────────────────────┘
          │
          ▼
    AuthModal closes
    useEffect triggers in cart page
          │
          ▼
    Form auto-fills:
    ├─ Name: John Doe (from user.name)
    └─ Phone: +1234567890 (from user.phone)
          │
          ▼
    User sees "You're signed in" badge
    (green banner with checkmark)
          │
          ▼
    User can proceed to checkout
          │
          ▼
         SUCCESS ✅
    User signed in, details pre-filled!
```

---

## 4. Checkout with Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                CHECKOUT WITH AUTHENTICATION                 │
└─────────────────────────────────────────────────────────────┘

[Cart Page]
    │
    ├─→ User adds items
    │
    ├─→ User clicks "Proceed to Checkout"
    │
    ▼
[Checkout Page]
    │
    ├─→ Is user authenticated?
    │   │
    │   ├─→ YES
    │   │   └─→ Show green "You're signed in" banner
    │   │   └─→ Form pre-filled with user data
    │   │
    │   └─→ NO
    │       └─→ Show "Sign in or create account" button
    │       └─→ User can authenticate
    │
    ├─→ User fills delivery details
    │   ├─ Name (pre-filled if authenticated)
    │   ├─ Phone (pre-filled if authenticated)
    │   ├─ Address
    │   ├─ City
    │   └─ Postal Code
    │
    ├─→ User clicks "Proceed to Payment"
    │
    ▼
[Order Placement]
    │
    ├─→ Check required fields
    │   └─→ If missing: show yellow warning banner
    │
    ├─→ Create order
    │
    ├─→ Is user authenticated?
    │   │
    │   ├─→ YES
    │   │   └─→ Link customer to auth user
    │   │   └─→ Call POST /customers/link
    │   │   └─→ Customer linked to order
    │   │
    │   └─→ NO
    │       └─→ Create anonymous customer
    │
    ├─→ Reserve stock
    │
    ▼
[Payment Page]
    │
    ├─→ Process payment
    │
    ▼
[Order Confirmation]
    │
    └─→ SUCCESS ✅
```

---

## 5. My Orders Flow (Authenticated Only)

```
┌─────────────────────────────────────────────────────────────┐
│                    MY ORDERS FLOW                           │
└─────────────────────────────────────────────────────────────┘

User in storefront
          │
          ▼
    User clicks account menu
    (top right, shows user name/email)
          │
          ▼
    Account dropdown appears
    ├─ User greeting
    ├─ "My Orders" link
    └─ "Sign Out" button
          │
          ▼
    User clicks "My Orders"
          │
          ▼
    Router checks authentication
          │
          ├─→ User authenticated?
          │   │
          │   ├─→ YES
          │   │   └─→ Load /orders page
          │   │
          │   └─→ NO
          │       └─→ Redirect to storefront
          │       └─→ Show error toast
          │
          ▼
    [Orders Page Loads]
          │
          ├─→ Fetch orders for customer
          │   ├─ Call: GET /customers/by-email/:email/orders
          │   ├─ Pass: user.email
          │   └─→ Get back: [order1, order2, ...]
          │
          ├─→ Display orders
          │   ├─ Order ID
          │   ├─ Status badge (New/Confirmed/Delivered)
          │   ├─ Items in order
          │   ├─ Total amount
          │   ├─ Delivery address
          │   └─ Delivery slot
          │
          ├─→ For each order, show buttons:
          │   ├─ "View Details" - opens order page
          │   └─ "Buy Again" - adds items to cart
          │
          ▼
    User can:
    ├─ View full order details
    ├─ Buy same items again
    └─ Track delivery
          │
          ▼
         SUCCESS ✅
    User sees order history!
```

---

## 6. Buy Again Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   BUY AGAIN FLOW                            │
└─────────────────────────────────────────────────────────────┘

User in My Orders page
          │
          ▼
    Viewing previous order
    ├─ 2x Milk (₹80)
    ├─ 3x Bread (₹45)
    └─ 1x Eggs (₹120)
          │
          ▼
    User clicks "Buy Again"
          │
          ▼
    ┌──────────────────────────────────┐
    │ buyAgain() function executes     │
    │ 1. Extract items from order     │
    │ 2. Get current cart from storage│
    │ 3. Merge quantities:            │
    │    - If item exists: add qty    │
    │    - If new: add to cart        │
    │ 4. Save merged cart to storage  │
    │ 5. Update cart state            │
    │ 6. Navigate to cart page        │
    └──────────────────────────────────┘
          │
          ▼
    User redirected to cart page
          │
          ▼
    Cart displays:
    ├─ Previous cart items (if any)
    │   Example: 1x Apple (₹30)
    │
    ├─ Items from "Buy Again" merged in
    │   ├─ 2x Milk (₹80)
    │   ├─ 3x Bread (₹45)
    │   └─ 1x Eggs (₹120)
    │
    └─ Total cart now has all items
          │
          ▼
    User can:
    ├─ Adjust quantities
    ├─ Remove items
    ├─ Add more items
    └─ Proceed to checkout
          │
          ▼
    User completes checkout
          │
          ▼
         SUCCESS ✅
    Items from previous order re-ordered!
```

---

## 7. Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│              COMPONENT DEPENDENCY TREE                      │
└─────────────────────────────────────────────────────────────┘

layout.tsx
    │
    └─→ AuthProvider
            │
            ├─→ StoreFront.tsx
            │   │
            │   └─→ useAuth()
            │       └─→ Account menu with "My Orders"
            │
            ├─→ Cart Page
            │   │
            │   ├─→ useAuth()
            │   ├─→ AuthModal
            │   └─→ Pre-fill customer details
            │
            ├─→ Orders Page (Protected Route)
            │   │
            │   └─→ useAuth()
            │       └─→ Fetch orders by email
            │       └─→ Show "Buy Again" button
            │
            └─→ All other pages
                │
                └─→ Can access useAuth() hook
                    ├─ Check if authenticated
                    ├─ Get user data
                    └─ Sign out

Dependencies:
  supabaseClient.ts
    │
    └─→ authContext.tsx
        │
        └─→ All components via useAuth()
```

---

## 8. Database Relationships

```
┌─────────────────────────────────────────────────────────────┐
│               DATABASE SCHEMA RELATIONSHIPS                 │
└─────────────────────────────────────────────────────────────┘

Supabase Auth
    │
    └─→ auth.users (Built-in)
        ├─ id (UUID)
        ├─ email
        ├─ encrypted_password
        ├─ user_metadata
        │  ├─ name
        │  └─ phone
        └─ session tokens
            │
            ├─→ uses: NEXT_PUBLIC_SUPABASE_ANON_KEY
            │         (public access to auth)
            │
            └─→ creates: JWT tokens
                        (used in API requests)

API Database
    │
    ├─→ customers
    │   ├─ id (UUID)
    │   ├─ auth_user_id → links to auth.users.id
    │   ├─ email
    │   ├─ name
    │   ├─ phone
    │   └─ store_id
    │
    ├─→ orders
    │   ├─ id (TEXT)
    │   ├─ customer_id → links to customers.id
    │   ├─ store_id
    │   ├─ total
    │   ├─ status
    │   └─ items
    │
    └─→ order_items
        ├─ order_id → links to orders.id
        ├─ product_id
        ├─ quantity
        └─ price

Flow:
  1. User signs up → Created in auth.users
  2. User checks out → Customer created, linked to auth.users.id
  3. Order created → Linked to customer.id
  4. "My Orders" → Queries by auth user email
  5. Order history → Shows all orders for that auth user
```

---

## 9. Environment Setup Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              ENVIRONMENT SETUP ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Supabase Cloud     │
│   ├─ Auth Service    │
│   ├─ Database        │
│   ├─ Storage         │
│   └─ Logs            │
└──────┬───────────────┘
       │
       ├─→ NEXT_PUBLIC_SUPABASE_URL
       └─→ NEXT_PUBLIC_SUPABASE_ANON_KEY
               │
               ▼
┌──────────────────────┐           ┌──────────────────────┐
│   .env.local (Dev)   │           │ Vercel/Railway (Prod)│
│  ├─ URL              │           │ ├─ Environment Vars  │
│  └─ Anon Key         │           │ └─ Secret Config     │
└──────┬───────────────┘           └──────┬───────────────┘
       │                                   │
       ▼                                   ▼
┌──────────────────────────────────────────────┐
│         supabaseClient.ts                    │
│  ├─ Read env vars                           │
│  ├─ Initialize Supabase client              │
│  └─ Export for use in authContext           │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│         authContext.tsx                      │
│  ├─ Manage auth state                       │
│  ├─ signUp(), signIn(), signOut()           │
│  └─ Provide useAuth() hook                  │
└──────┬───────────────────────────────────────┘
       │
       ├─→ StoreFront.tsx ─→ Account menu
       ├─→ CartPage.tsx ─→ AuthModal, pre-fill form
       ├─→ OrdersPage.tsx ─→ Fetch user orders
       └─→ All other components ─→ useAuth() hook
```

---

## 10. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING FLOW                        │
└─────────────────────────────────────────────────────────────┘

User Action (Sign Up/In)
          │
          ▼
    supabase.auth.signUp/In()
          │
          ├─→ Success
          │   └─→ Session created ✅
          │       └─→ User redirected
          │
          └─→ Error
              │
              ├─→ Network Error
              │   └─→ "Check internet connection"
              │
              ├─→ Invalid Email
              │   └─→ "Please enter valid email"
              │
              ├─→ Wrong Password
              │   └─→ "Invalid credentials"
              │
              ├─→ User Doesn't Exist
              │   └─→ "Account not found. Sign up instead."
              │
              ├─→ User Already Exists
              │   └─→ "Email already registered. Sign in instead."
              │
              ├─→ Rate Limited
              │   └─→ "Too many attempts. Wait 60 seconds."
              │
              ├─→ Email Not Confirmed
              │   └─→ "Check email to confirm account"
              │
              └─→ Supabase Not Configured
                  └─→ "Authentication not configured. 
                      Please contact support."

All errors displayed:
  1. Browser console (for debugging)
  2. UI toast/modal (for user)
  3. Supabase Logs (for admin)
```

---

## Quick Navigation

- **Setup Diagram**: Start here for first-time setup
- **Sign Up Flow**: How users create accounts
- **Sign In Flow**: How users log back in
- **Checkout Flow**: How auth integrates with checkout
- **My Orders Flow**: How users view order history
- **Buy Again Flow**: How quick reordering works
- **Component Tree**: How code is organized
- **Database Schema**: How data is stored
- **Environment Setup**: How config flows through app
- **Error Handling**: What happens when something breaks

**For detailed setup instructions, see: QUICK_AUTH_SETUP.md**
