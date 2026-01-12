# GS1 India Integration for Branded FMCG Products

## Overview

This implementation adds support for high-quality branded FMCG (Fast-Moving Consumer Goods) product images and metadata from GS1 India's DataKart database.

**Supported Brands**: Maggi, Surf Excel, Amul, Lay's, Bingo, Parle, and many more.

## What It Does

1. **GTIN/Barcode Lookup**: Search GS1 database by EAN/UPC barcode
2. **Brand Lookup**: Search products by brand name and product name
3. **Packshot Images**: Automatically fetches official brand packshot images
4. **Product Metadata**: Gets brand, category, and description from GS1
5. **Auto-Update**: Automatically updates product with image, brand, and GTIN data

## Setup

### 1. Get GS1 India API Credentials

Visit: https://www.gs1india.org/gs1-datakart/

- Sign up for a business account
- Request API access to "DataKart" or "Smart Consumer" API
- Obtain your `API_KEY` and API endpoint

Common Endpoints:
- **DataKart API**: `https://api.gs1india.org/v1`
- **Smart Consumer API**: Check your dashboard for exact endpoint

### 2. Configure Environment Variables

In `api/.env`, add:

```bash
# GS1 India API Configuration
GS1_API_KEY=your_gs1_api_key_here
GS1_API_ENDPOINT=https://api.gs1india.org/v1  # or your provided endpoint
```

### 3. Run Database Migration

```bash
cd api
npx prisma migrate deploy
# or for development:
npx prisma migrate dev --name add_gs1_fields
```

### 4. Regenerate Prisma Client

```bash
npx prisma generate
```

## API Endpoints

### GET /gs1/search/gtin
Search GS1 database by barcode/GTIN

**Query Parameters:**
- `gtin` (required): EAN/UPC code (8, 12, 13, or 14 digits)

**Example:**
```bash
curl "http://localhost:3001/gs1/search/gtin?gtin=8901001001234"
```

**Response:**
```json
{
  "success": true,
  "product": {
    "gtin": "8901001001234",
    "name": "Maggi 2-Minute Noodles",
    "brand": "Maggi",
    "imageUrl": "https://gs1.com/products/...",
    "description": "Instant noodles",
    "manufacturer": "Nestlé",
    "category": "Instant Noodles"
  }
}
```

### GET /gs1/search/brand
Search GS1 database by brand and product name

**Query Parameters:**
- `productName` (required): Product name (e.g., "Noodles")
- `brand` (required): Brand name (e.g., "Maggi")

**Example:**
```bash
curl "http://localhost:3001/gs1/search/brand?brand=Maggi&productName=Noodles"
```

### GET /gs1/brands
Get list of common Indian FMCG brands for autocomplete

**Response:**
```json
{
  "success": true,
  "brands": ["Maggi", "Amul", "Surf Excel", ...]
}
```

### POST /products/:id/gs1-lookup
Link a product to GS1 database (fetches and updates product data)

**Request Body:**
```json
{
  "gtin": "8901001001234"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "prod_123",
    "name": "Maggi 2-Minute Noodles",
    "brand": "Maggi",
    "gtin": "8901001001234",
    "imageUrl": "https://...",
    "isBrandedFMCG": true
  },
  "gs1Data": { ... }
}
```

## Admin UI Usage

### Via Barcode (GTIN)

1. Go to Admin → Products
2. For a product, enter its GTIN/barcode in the new "GS1 Lookup" section
3. Click "🔍 Lookup on GS1"
4. The system will:
   - Validate the barcode format
   - Fetch data from GS1 India
   - Update product with brand, image, and metadata
   - Mark as "Branded FMCG"

### Via Brand Search

1. Use the API endpoint: `GET /gs1/search/brand?brand=Maggi&productName=Noodles`
2. Returns multiple matching products
3. Select one and manually copy the GTIN
4. Use barcode lookup to link

## Database Schema

### New Fields on CatalogProduct

```prisma
model CatalogProduct {
  // ... existing fields ...
  
  gtin         String?   @unique  // EAN/UPC barcode
  brand        String?            // Brand name (e.g., "Maggi")
  gs1SKU       String?            // GS1 database reference
  isBrandedFMCG Boolean  @default(false)  // Flag for FMCG products
}
```

### Indexes for Performance

- `gtin` (unique): Fast GTIN lookup
- `brand`: Brand filtering
- `isBrandedFMCG`: Filter by product type

## Common Indian FMCG Brands Supported

**Instant Noodles**: Maggi, Sunfeast Yippee, Top Ramen, Wai Wai

**Dairy**: Amul, Britannia, Dairy Milk, Nestlé

**Detergents**: Surf Excel, Tide, Ariel, Rin

**Oils**: Fortune, Saffola, Refined Sunflower

**Snacks**: Lay's, Bingo, Parle, ITC

**Beverages**: Nescafé, Bru, Lipton, Tata Tea

## GTIN Format

Valid GTIN lengths:
- **EAN-8**: 8 digits (e.g., `96385074`)
- **UPC-A**: 12 digits (e.g., `012000005264`)
- **EAN-13**: 13 digits (e.g., `5901001001231`)
- **GTIN-14**: 14 digits (e.g., `10012000005264`)

The system includes checksum validation for all formats.

## Example: Adding Maggi Noodles

1. **Product Data**:
   - Name: "Maggi 2-Minute Noodles"
   - Price: ₹20
   - Barcode: `8901001001234`

2. **Lookup**:
   ```bash
   curl -X POST "http://localhost:3001/products/prod_123/gs1-lookup" \
     -H "Content-Type: application/json" \
     -H "x-tenant-id: green-mart" \
     -d '{"gtin":"8901001001234"}'
   ```

3. **Result**:
   - Brand: "Maggi" (auto-filled)
   - Image: Official packshot from GS1
   - Description: Product description from GS1
   - isBrandedFMCG: `true`

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `GS1 lookup not configured` | Missing `GS1_API_KEY` | Add to `api/.env` |
| `Invalid GTIN format` | Wrong barcode format | Use 8, 12, 13, or 14 digits |
| `Product not found in GS1 database` | GTIN not in database | Check GTIN is correct, try brand search |
| `Invalid GTIN checksum` | Barcode digit is wrong | Verify barcode is correct |

## Cost Considerations

GS1 India API pricing:
- **API Access**: Usually free or minimal cost
- **Per-request**: Typically ₹0-1 per lookup (varies by plan)
- **Batch operations**: Lower rates for bulk lookups

**Tip**: Cache results locally after first lookup to minimize API calls.

## Future Enhancements

- [ ] Batch GTIN import from CSV
- [ ] Automatic brand categorization
- [ ] Nutri-Score/health rating integration
- [ ] Supply chain/manufacturer data
- [ ] Price comparison with other retailers
- [ ] Sustainability/eco certification badges

## References

- [GS1 India Official](https://www.gs1india.org)
- [DataKart API Documentation](https://www.gs1india.org/gs1-datakart/)
- [GTIN Wikipedia](https://en.wikipedia.org/wiki/Global_Trade_Item_Number)
- [EAN Barcode Info](https://www.gs1.org/services/how-calculate-check-digit-manually)
