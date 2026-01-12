# 🔍 GS1 India Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Get GS1 Credentials (2 min)
1. Visit: https://www.gs1india.org/gs1-datakart/
2. Sign up or login to your business account
3. Navigate to "API Access" or "Developer Portal"
4. Generate API key and copy the endpoint URL
5. Write them down

### Step 2: Configure Environment (1 min)
Edit `api/.env`:
```bash
GS1_API_KEY=YOUR_API_KEY_HERE
GS1_API_ENDPOINT=https://api.gs1india.org/v1
```

### Step 3: Update Database (1 min)
```bash
cd api
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Step 4: Test in Admin (1 min)
1. Go to http://localhost:3000/admin
2. Click "Products"
3. Create or select a product
4. Find the "🔍 GS1 Lookup" section
5. Enter a GTIN from any product packaging:
   - Maggi Noodles: `8901001001234`
   - Amul Butter: `6281000100154`
   - Surf Excel: `8901001001050`
6. Click "🔍 Lookup on GS1"
7. Watch as brand, image, and metadata load automatically!

---

## Testing Without GS1 Credentials

If you don't have credentials yet:

1. Set a dummy key in `api/.env`:
   ```bash
   GS1_API_KEY=test_mode
   ```

2. Endpoints will be available but return "not found" for real GTINs

3. This is perfect for testing the UI flow

---

## Common GTINs to Try

### Format
All should be 13 digits: `XXXXXXXXXXX`

### Popular Products
| Product | GTIN | Brand |
|---------|------|-------|
| Maggi 2-Minute | `8901001001234` | Maggi |
| Amul Butter | `6281000100154` | Amul |
| Surf Excel | `8901001001050` | Surf Excel |
| Lipton Tea | `8901030031239` | Lipton |
| Lay's Chips | `8901085110024` | Lay's |
| Bingo | `8901001006246` | Bingo |

*Note: Actual GTINs may vary. Check product packaging.*

---

## API Endpoints

### Quick Test
```bash
# Is GS1 configured?
curl "http://localhost:3001/gs1/search/gtin?gtin=8901001001234"

# Get brand suggestions
curl "http://localhost:3001/gs1/brands"

# Search by brand
curl "http://localhost:3001/gs1/search/brand?brand=Maggi&productName=Noodles"
```

---

## What Happens When You Lookup?

1. **You enter**: GTIN/barcode
2. **API validates**: Checks if GTIN format is correct
3. **GS1 search**: Queries GS1 India database
4. **Auto-extract**: Brand, image, description
5. **Update product**: 
   - Sets `isBrandedFMCG = true`
   - Adds brand name
   - Adds high-quality packshot image
   - Stores GTIN for future reference

---

## Troubleshooting

### "GS1 lookup not configured"
**Solution**: Add `GS1_API_KEY` to `api/.env` and restart

### "Product not found in GS1"
**Solutions**:
- Check GTIN is correct (on product packaging)
- Try a different product
- Some regional products may not be in GS1 database

### "Invalid GTIN format"
**Solution**: GTIN must be 8, 12, 13, or 14 digits. Check the barcode.

### Button shows "Searching..." but never finishes
**Solution**: 
- Check internet connection
- Verify GS1_API_KEY is valid
- Check server logs for errors
- Restart API: `npm run dev`

---

## Using Linked Products

Once a product is linked to GS1:

✅ **Storefront**: Customers see official brand image
✅ **Admin**: Shows brand badge and GTIN
✅ **Stock**: Keep normal inventory management
✅ **Pricing**: Set discounts as usual
✅ **Multi-store**: Each store can use the same GS1 data

---

## Next Steps

### Batch Import
To import many products at once:
1. Create CSV with GTINs
2. Use batch API endpoint (coming soon)
3. Auto-link all products

### Brand Management
- Filter products by brand
- See all Maggi products in one view
- Set brand-wide discounts

### Analytics
- Track which brands sell best
- See GS1-linked vs generic products
- Brand performance dashboard

---

## Support

**Need GS1 API?**
→ https://www.gs1india.org/gs1-datakart/

**Issues?**
→ Check `GS1_INTEGRATION.md` for detailed docs

**Questions?**
→ Review `GS1_IMPLEMENTATION_SUMMARY.md` for architecture

---

**You're all set! 🎉 Start adding branded products with official images.**
