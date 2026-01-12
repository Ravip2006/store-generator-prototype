# Login, Sign Up & "Buy Again" Functionality - Implementation Guide

## Overview
This document outlines the complete implementation of authentication, customer account management, and order history features for the Store Generator platform.

## Architecture

### 1. **Authentication System**

#### Supabase Integration
- **File**: `/web/lib/supabaseClient.ts`
- **Purpose**: Initialize Supabase client and provide core authentication functions
- **Key Functions**:
  - `getCurrentUser()`: Get authenticated user from session
  - `signUp(email, password, phone?, name?)`: Create new account
  - `signIn(email, password)`: Sign in existing user
  - `signOut()`: Sign out user
  - `resetPassword(email)`: Send password reset email
  - `updatePassword(newPassword)`: Update user password

#### Auth Context Provider
- **File**: `/web/lib/authContext.tsx`
- **Purpose**: Global state management for user authentication
- **Features**:
  - Real-time authentication state tracking
  - User metadata persistence
  - Session subscription handling
  - Automatic user data population from Supabase Auth

**Usage**:
```tsx
const { user, isAuthenticated, signUp, signIn, signOut, loading } = useAuth();
```

#### Root Layout Integration
- **File**: `/web/app/layout.tsx`
- Updated to wrap app with `<AuthProvider>` for global auth state

### 2. **Authentication UI Components**

#### Auth Modal
- **File**: `/web/components/AuthModal.tsx`
- **Features**:
  - Professional modal with toggle between Sign In/Sign Up
  - Form validation for email, password, phone, and name
  - Loading states and error handling
  - Benefits callout highlighting account advantages
  - Smooth animations and glassmorphism styling

**Usage**:
```tsx
<AuthModal 
  isOpen={showAuthModal} 
  onClose={() => setShowAuthModal(false)}
  onSuccess={() => console.log("Authenticated!")}
  tenant={tenant}
/>
```

### 3. **Cart/Checkout Integration**

#### Auto-fill from Auth
- **File**: `/web/app/s/[slug]/cart/cart-page-client.tsx`
- Pre-fills customer name and phone from authenticated user
- Shows authentication status card
- Links customer with auth user when placing order

#### Key Features**:
- Auth modal button for guest checkout conversion
- Customer linking endpoint call on order placement
- Auto-fill form fields from user metadata
- Beautiful auth status indicators

### 4. **Backend API Endpoints**

#### Customer Linking
**Endpoint**: `POST /customers/link`
- Links authenticated user with customer record
- Creates new customer if email doesn't exist
- Updates existing customer with new data
- Returns customer details

**Request Body**:
```json
{
  "authUserId": "user-id-from-supabase",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91..."
}
```

#### Order History
**Endpoint**: `GET /customers/by-email/:email/orders`
- Fetches all orders for authenticated customer
- Filters by email address
- Returns detailed order information with items
- Scalable for future analytics

**Response**:
```json
[
  {
    "id": "order-id",
    "status": "CONFIRMED|DELIVERED|NEW",
    "total": 1250.50,
    "createdAt": "2025-01-12T10:30:00Z",
    "customerName": "John Doe",
    "items": [...]
  }
]
```

### 5. **Order History Page**

#### My Orders Page
- **File**: `/web/app/s/[slug]/orders/orders-page-client.tsx`
- **Features**:
  - Protected route (redirects if not authenticated)
  - Displays all customer orders with status
  - Shows order items, total, location, delivery slot
  - "View Details" link to full order page
  - "Buy Again" functionality for quick reordering
  - Professional card-based layout with status badges

#### Buy Again Implementation
- Extracts items from previous order
- Adds to current cart (merges quantities if items already exist)
- Redirects to cart page
- Persists cart to localStorage

### 6. **Storefront Navigation**

#### Account Menu
- **File**: `/web/app/s/[slug]/StoreFront.tsx`
- **Features**:
  - Displays only when user authenticated
  - Shows user name/email in header
  - Dropdown menu with:
    - User greeting with email
    - "My Orders" link
    - "Sign Out" button
  - Auto-closes when clicking outside
  - Auto-closes when cart opens

**Visual Features**:
- Purple gradient styling
- Smooth transitions and hover states
- Responsive (icon-only on mobile)
- Click-outside detection

## Data Flow

### Authentication Flow
```
User Signup/Login
        ↓
[AuthModal Component]
        ↓
useAuth() → Supabase Auth
        ↓
AuthContext stores user state
        ↓
Components access via useAuth() hook
```

### Order Linking Flow
```
Customer places order (authenticated)
        ↓
placeOrder() function
        ↓
POST /customers/link API call
        ↓
Backend creates/updates Customer record
        ↓
POST /orders API call with order data
        ↓
Order associated with customerId
```

### Order History Flow
```
User navigates to /s/[slug]/orders
        ↓
Check isAuthenticated (redirect if false)
        ↓
GET /customers/by-email/:email/orders
        ↓
Display orders with status and items
        ↓
User clicks "Buy Again"
        ↓
Add items to cart localStorage
        ↓
Redirect to cart page
```

## Environment Configuration

Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

The existing Customer model is utilized:
```prisma
model Customer {
  id        String   @id @default(cuid())
  storeId   String
  name      String
  phone     String?
  email     String?
  createdAt DateTime @default(now())
  
  store     Store    @relation(fields: [storeId], references: [id])
  orders    Order[]
  
  @@index([storeId])
}
```

Order model links to customers:
```prisma
model Order {
  id         String    @id @default(cuid())
  storeId    String
  customerId String?    // Links to authenticated customer
  
  // ... other fields
  
  customer   Customer? @relation(fields: [customerId], references: [id])
  
  @@index([customerId])
}
```

## Features Summary

### ✅ Completed Features

1. **Supabase Auth Integration**
   - Email/password authentication
   - Session management
   - User metadata storage

2. **Professional Auth Modal**
   - Sign up with name, phone, email, password
   - Sign in with email and password
   - Toggle between modes
   - Form validation
   - Error handling

3. **Cart/Checkout Integration**
   - Auth modal in cart
   - Auto-fill customer details
   - Link authenticated user to customer record
   - Professional UI indicators

4. **Order History**
   - My Orders page with full order list
   - Order status badges (New/Confirmed/Delivered)
   - Order details with items, totals, location
   - Protected route (auth required)

5. **Buy Again Feature**
   - One-click reorder from previous orders
   - Merges with existing cart items
   - Maintains quantities
   - Redirects to cart

6. **Account Navigation**
   - User account dropdown in header
   - "My Orders" link
   - "Sign Out" button
   - Responsive design
   - Auto-close on click-outside

## Scalability Considerations

### Analytics & Future Enhancements
The customer linking system is designed for future analytics:

- **Purchase History**: Full order tracking per user
- **Reorder Analytics**: Track "Buy Again" usage
- **Customer Segments**: Group by purchase frequency
- **Personalization**: Recommend based on order history
- **Retention**: Track customer lifetime value

### Database Indexing
- `Customer.storeId`: Indexed for store filtering
- `Order.customerId`: Indexed for customer order lookup
- `Order.email`: Consider adding index for email-based queries

## Security Considerations

1. **Supabase RLS**: Leverage Row Level Security if needed
2. **Email Verification**: Consider adding email verification before order
3. **Rate Limiting**: Implement on /customers/link endpoint
4. **CORS**: Ensure Supabase CORS policies are configured
5. **Data Privacy**: Customer data is scoped to tenant store

## Testing Checklist

- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Auto-fill form from authenticated user
- [ ] Place order while authenticated
- [ ] View My Orders page
- [ ] Click "Buy Again" to repopulate cart
- [ ] Sign out and verify redirect
- [ ] Guest checkout still works
- [ ] Customer linking on order placement
- [ ] Account menu opens/closes correctly
- [ ] Mobile responsive functionality

## Future Enhancements

1. **Password Reset Flow**: Email-based password recovery
2. **Account Settings**: Edit profile, manage addresses
3. **Order Tracking**: Real-time delivery status
4. **Payment History**: Saved payment methods
5. **Wishlists**: Save items for later
6. **Referrals**: Invite friends program
7. **Loyalty Program**: Points and rewards
8. **Email Notifications**: Order updates via email

## File Locations

**Authentication**:
- `/web/lib/supabaseClient.ts` - Supabase client
- `/web/lib/authContext.tsx` - Auth provider

**Components**:
- `/web/components/AuthModal.tsx` - Auth modal
- `/web/app/s/[slug]/StoreFront.tsx` - Store navigation with account menu

**Pages**:
- `/web/app/s/[slug]/cart/cart-page-client.tsx` - Cart with auth
- `/web/app/s/[slug]/orders/page.tsx` - Orders page wrapper
- `/web/app/s/[slug]/orders/orders-page-client.tsx` - Orders client component

**Backend**:
- `/api/index.js` - New endpoints:
  - `POST /customers/link`
  - `GET /customers/by-email/:email/orders`

## Deployment Notes

1. Set Supabase environment variables in production
2. Configure Supabase project with email provider
3. Update Supabase CORS settings if needed
4. Test email authentication flow before production
5. Monitor /customers/link endpoint for abuse
6. Consider implementing rate limiting

---

**Implementation Date**: January 12, 2025
**Status**: Complete and Ready for Testing
