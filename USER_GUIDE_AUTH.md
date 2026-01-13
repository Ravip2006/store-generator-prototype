# User Guide: Login, Sign Up & Order Management

## For Customers

### Creating an Account

1. **On the Cart Page**:
   - Click the "Sign in or create account" button
   - Select "Sign Up" if you don't have an account
   - Fill in:
     - Full Name (e.g., "John Doe")
     - Phone Number (e.g., "+91 98765 43210")
     - Email Address (e.g., "you@example.com")
     - Password (8+ characters recommended)
   - Click "Create Account"

2. **Benefits of Signing Up**:
   ✓ Faster checkout - your details are pre-filled
   ✓ Track your orders anytime
   ✓ Reorder your favorites instantly with "Buy Again"
   ✓ Get better recommendations based on your purchases

### Signing In

1. **During Checkout**:
   - If you already have an account, click "Sign in or create account"
   - Click "Sign In"
   - Enter your email and password
   - Click "Sign In"

2. **From Store Header**:
   - Look for the 👤 Account button in the top-right
   - Click to open account menu
   - Select "My Orders" to view your history

### Viewing Your Orders

1. **From Account Menu**:
   - Click the 👤 Account button in header
   - Click "My Orders"
   - You'll see all your past orders with:
     - Order number and date
     - Status (Pending/Confirmed/Delivered)
     - Items and quantities
     - Total amount
     - Delivery location and slot

2. **Order Actions**:
   - **View Details**: See full order information
   - **Buy Again**: Instantly repopulate cart with same items

### Using "Buy Again"

1. **Quick Reorder**:
   - Go to "My Orders" page
   - Find the order you want to reorder
   - Click "Buy Again" button
   - Items are added to your cart (quantities combined if items already there)
   - You'll be redirected to the cart page
   - Modify quantities if needed
   - Proceed to checkout

### Signing Out

1. **From Account Menu**:
   - Click 👤 Account button in header
   - Click "Sign Out"
   - You'll be signed out immediately

### Checkout with Your Account

1. **Pre-filled Information**:
   - Your name and phone are automatically filled
   - You only need to add/update:
     - Delivery address
     - City and postal code
     - Delivery slot preference

2. **Placing Order**:
   - Review your items
   - Fill in delivery details
   - Click "Proceed to pay" or "Place order & WhatsApp"
   - Your order is linked to your account automatically

## Frequently Asked Questions

**Q: Can I place orders without an account?**
A: Yes! You can checkout as a guest. But creating an account gives you benefits like order history and "Buy Again".

**Q: How do I reset my password?**
A: Currently, you can contact the store directly. Future versions will have password reset via email.

**Q: Will my details be pre-filled next time?**
A: Yes! Your name and phone will auto-populate when you visit the cart (if you're signed in).

**Q: Can I edit an order after placing it?**
A: No, but you can contact the store via WhatsApp or phone to request changes.

**Q: Is my personal information secure?**
A: Yes! We use industry-standard Supabase authentication to protect your data.

**Q: Can I use "Buy Again" with modified quantities?**
A: "Buy Again" adds the exact quantities from your previous order, but you can adjust in the cart before checkout.

## For Store Owners

### Customer Management

The authentication system automatically:
- Links authenticated users to customer records
- Tracks orders per customer email
- Maintains order history for analytics
- Enables customer segmentation in future updates

### View Customer Orders

**Via API**:
```bash
GET /customers/by-email/{email}/orders
Header: x-tenant-id: your-store-slug
```

### Understanding the Flow

1. **Customer Signs Up**: Creates auth account with email/password
2. **Places Order**: Order automatically linked to customer
3. **Returns Later**: Clicks "My Orders" to see purchase history
4. **Reorders**: Uses "Buy Again" for quick repeat purchases
5. **Analytics Ready**: Customer data prepared for future insights

### Future Enhancements (Coming Soon)

- Customer dashboard with analytics
- Email notifications for order updates
- Payment history and invoice downloads
- Loyalty program integration
- Customer segmentation reports
- Personalized recommendations

---

**Last Updated**: January 12, 2025
