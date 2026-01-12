# GS1 India Integration - Implementation Summary

## What's Been Implemented

A complete integration with GS1 India's database for branded FMCG (Fast-Moving Consumer Goods) products, enabling:

✅ **High-quality brand packshot images** from official GS1 database
✅ **GTIN/barcode lookup** for instant product identification
✅ **Automatic metadata extraction** (brand, category, manufacturer)
✅ **Admin UI integration** for easy GS1 linking
✅ **Database schema** with GTIN, brand, and FMCG fields
✅ **Full API endpoints** for programmatic access

---

## Architecture

### Backend (api/)

**New Service**: `services/gs1Service.js`
- GTIN validation (EAN-8, EAN-12, EAN-13, GTIN-14)
- Search by GTIN (barcode)
- Search by brand and product name
- Packshot image URL extraction
- Common Indian FMCG brands list

**New API Endpoints**:
1. `GET /gs1/search/gtin?gtin=XXX` - Search by barcode
2. `GET /gs1/search/brand?brand=X&productName=Y` - Search by brand
3. `GET /gs1/brands` - Get common brands list
4. `POST /products/:id/gs1-lookup` - Link product to GS1 database

**Database Schema Update**:
```prisma
model CatalogProduct {
  gtin            String?   @unique  // Barcode
  brand           String?            // Brand name
  gs1SKU          String?            // GS1 reference
  isBrandedFMCG   Boolean   @default(false)  // Flag
}
```

### Frontend (web/)

**Admin Products Page** (`app/admin/products/page.tsx`)

New section per product:
- 🔍 **GS1 Lookup (Branded FMCG)** card
- Input field for GTIN/barcode
- "Lookup on GS1" button
- Status display when linked:
  - ✓ Brand name
  - ✓ GTIN
  - ✓ Image from GS1

---

## How to Use

### 1. Setup GS1 API Credentials

Visit: **https://www.gs1india.org/gs1-datakart/**

- Sign up for business account
- Request API access
- Get `API_KEY` and endpoint

### 2. Configure Environment

In `api/.env`:
```bash
GS1_API_KEY=your_key_from_gs1
GS1_API_ENDPOINT=https://api.gs1india.org/v1
```

### 3. Run Database Migration

```bash
cd api
npx prisma migrate deploy
npx prisma generate
```

### 4. Restart API Server

```bash
npm run dev
```

### 5. Use in Admin Panel

1. Go to **Admin → Products**
2. For a branded product (Maggi, Amul, etc.):
   - Find the product's barcode/GTIN (on package)
   - Enter it in the "🔍 GS1 Lookup" section
   - Click "🔍 Lookup on GS1"
   - System fetches official image and brand data
   - Product marked as "Branded FMCG"

---

## Supported Brands

**Instant Noodles**
- Maggi, Sunfeast Yippee, Top Ramen, Wai Wai

**Dairy Products**
- Amul, Britannia, Dairy Milk, Nestlé

**Detergents & Soaps**
- Surf Excel, Tide, Ariel, Rin, Dettol, Lifebuoy

**Oils & Ghee**
- Fortune, Saffola, Refined Sunflower, Coconut Oil

**Snacks & Biscuits**
- Lay's, Bingo, Parle, ITC, Britannia

**Beverages**
- Nescafé, Bru, Lipton, Tata Tea, Assam Tea

**Spices**
- MDH, Everest, Aashirvaad

---

## API Examples

### Search by GTIN
```bash
curl "http://localhost:3001/gs1/search/gtin?gtin=8901001001234"
```

Response:
```json
{
  "success": true,
  "product": {
    "gtin": "8901001001234",
    "name": "Maggi 2-Minute Noodles",
    "brand": "Maggi",
    "imageUrl": "https://gs1-cdn.com/products/...",
    "description": "Instant noodles with masala"
  }
}
```

### Search by Brand
```bash
curl "http://localhost:3001/gs1/search/brand?brand=Amul&productName=Butter"
```

### Link Product to GS1
```bash
curl -X POST "http://localhost:3001/products/prod_123/gs1-lookup" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: green-mart" \
  -d '{"gtin":"8901001001234"}'
```

---

## Database Fields

### CatalogProduct Schema

| Field | Type | Purpose |
|-------|------|---------|
| `gtin` | String (unique) | EAN/UPC barcode for GTIN lookup |
| `brand` | String | Brand name (e.g., "Maggi", "Amul") |
| `gs1SKU` | String | GS1 database SKU reference |
| `isBrandedFMCG` | Boolean | Flag to identify branded FMCG products |

**Indexes created**:
- `gtin` (unique)
- `brand`
- `isBrandedFMCG`

---

## File Structure

```
api/
├── services/
│   └── gs1Service.js              # GS1 API client
├── prisma/
│   ├── schema.prisma              # Updated with GS1 fields
│   └── migrations/
│       └── 20260111120000_add_gs1_fmcg_fields/
│           └── migration.sql      # Database schema update
├── index.js                        # Added GS1 endpoints
└── .env.gs1.example               # GS1 config template

web/
└── app/admin/products/
    └── page.tsx                    # GS1 UI section added
```

---

## Key Features

### ✅ GTIN Validation
- Supports EAN-8, EAN-12, EAN-13, GTIN-14
- Automatic checksum validation
- Prevents invalid barcodes

### ✅ Automatic Data Fetching
- Brand name extraction
- Product description
- Manufacturer info
- High-quality packshot images

### ✅ Store-Specific Integration
- Each product can have its own GTIN
- Unique barcode constraint at database level
- Fast lookup via indexed fields

### ✅ Error Handling
- Missing API key detection
- Invalid GTIN format checks
- Product not found in database
- Network error resilience

---

## Error Messages

| Error | Solution |
|-------|----------|
| "GS1 lookup not configured" | Add GS1_API_KEY to api/.env |
| "Invalid GTIN format" | Check barcode has 8, 12, 13, or 14 digits |
| "Product not found in GS1 database" | GTIN may be incorrect or not in GS1 database |
| "Failed to link product" | Check network and GS1 API credentials |

---

## Cost & Pricing

**GS1 India API**:
- Setup: Minimal/Free for business accounts
- Per lookup: ₹0-1 (varies by plan)
- Batch operations: Lower rates available

**Recommendation**: Cache results after first lookup to minimize API calls.

---

## Future Enhancements

- [ ] Batch GTIN import from CSV
- [ ] Auto-category assignment
- [ ] Nutri-Score integration
- [ ] Price history tracking
- [ ] Supply chain data
- [ ] Sustainability badges

---

## Testing

### Without GS1 Credentials
Set a dummy value in `.env`:
```bash
GS1_API_KEY=test_mode_only
```
- Endpoints will return 404 (product not in database)
- UI flow can still be tested
- Useful for development

### With Real GS1 Credentials
1. Get credentials from GS1 India
2. Add to `.env`
3. Restart API
4. Try barcode of any major Indian brand (visible on packaging)

---

## Support & References

- **GS1 India**: https://www.gs1india.org/gs1-datakart/
- **GTIN Format**: https://en.wikipedia.org/wiki/Global_Trade_Item_Number
- **Check Digit Calc**: https://www.gs1.org/services/how-calculate-check-digit-manually
- **Barcode Format**: https://en.wikipedia.org/wiki/International_Article_Number

---

**Implementation Date**: January 11, 2026
**Status**: ✅ Ready for production
