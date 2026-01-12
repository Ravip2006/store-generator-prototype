/**
 * GS1 India Integration Service
 * Fetches branded FMCG product data including packshots from GS1 DataKart
 * 
 * GS1 India provides:
 * - Official brand images (packshots)
 * - Product metadata
 * - Barcode/GTIN verification
 * 
 * Note: This requires GS1 India API credentials
 * Get access at: https://www.gs1india.org/gs1-datakart/
 */

class GS1Service {
  constructor(apiKey, apiEndpoint) {
    this.apiKey = apiKey;
    // GS1 India DataKart API endpoint
    this.apiEndpoint = apiEndpoint || "https://api.gs1india.org/v1";
  }

  /**
   * Search GS1 database by GTIN/barcode
   * @param {string} gtin - EAN/UPC barcode (e.g., 8901001001234)
   * @returns {Promise<Object>} Product data including image URL
   */
  async searchByGTIN(gtin) {
    if (!gtin || !this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/product/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-API-Key": this.apiKey
        },
        body: JSON.stringify({
          gtin: gtin.toString(),
          format: "json"
        })
      });

      if (!response.ok) {
        console.warn(`[GS1] GTIN search failed for ${gtin}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      return this._mapGS1Response(data);
    } catch (error) {
      console.error("[GS1] Error searching GTIN:", error.message);
      return null;
    }
  }

  /**
   * Search GS1 database by product name and brand
   * @param {string} productName - Product name
   * @param {string} brand - Brand name (e.g., "Maggi", "Amul", "Surf Excel")
   * @returns {Promise<Array>} Array of matching products
   */
  async searchByBrand(productName, brand) {
    if (!productName || !brand || !this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/product/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-API-Key": this.apiKey
        },
        body: JSON.stringify({
          productName: productName,
          brand: brand,
          limit: 10
        })
      });

      if (!response.ok) {
        console.warn(`[GS1] Brand search failed:`, response.statusText);
        return [];
      }

      const data = await response.json();
      if (data.products && Array.isArray(data.products)) {
        return data.products.map(p => this._mapGS1Response(p));
      }
      return [];
    } catch (error) {
      console.error("[GS1] Error searching by brand:", error.message);
      return [];
    }
  }

  /**
   * Get high-quality packshot image URL from GS1
   * @param {string} gtin - Product GTIN
   * @returns {Promise<string|null>} Image URL or null
   */
  async getPackshotImage(gtin) {
    if (!gtin || !this.apiKey) {
      return null;
    }

    try {
      const productData = await this.searchByGTIN(gtin);
      if (productData && productData.imageUrl) {
        return productData.imageUrl;
      }
      return null;
    } catch (error) {
      console.error("[GS1] Error fetching packshot:", error.message);
      return null;
    }
  }

  /**
   * Map GS1 API response to our internal format
   * @private
   */
  _mapGS1Response(gs1Data) {
    if (!gs1Data) return null;

    // GS1 DataKart returns data in various formats
    // This mapping handles common responses
    return {
      gtin: gs1Data.gtin || gs1Data.barcode || gs1Data.ean,
      name: gs1Data.productName || gs1Data.name,
      brand: gs1Data.brand || gs1Data.brandName,
      imageUrl: gs1Data.packshot || gs1Data.imageUrl || gs1Data.productImage,
      description: gs1Data.description || gs1Data.productDescription,
      category: gs1Data.category || gs1Data.masterCategory,
      manufacturer: gs1Data.manufacturer || gs1Data.manufacturerName,
      // Additional metadata
      weight: gs1Data.weight,
      quantity: gs1Data.quantity,
      unit: gs1Data.unit,
      gs1SKU: gs1Data.sku || gs1Data.skuCode
    };
  }

  /**
   * Validate GTIN checksum (EAN-13 format)
   * @param {string} gtin - GTIN to validate
   * @returns {boolean}
   */
  validateGTIN(gtin) {
    if (!gtin || typeof gtin !== 'string') return false;
    
    const digits = gtin.replace(/\D/g, '');
    if (![8, 12, 13, 14].includes(digits.length)) return false;

    let sum = 0;
    const weight = digits.length === 13 ? 3 : 1;
    
    for (let i = 0; i < digits.length - 1; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? weight : weight === 3 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(digits[digits.length - 1]);
  }

  /**
   * Get common Indian FMCG brands (for autocomplete/suggestions)
   */
  getCommonBrands() {
    return [
      // Instant Noodles
      "Maggi", "Sunfeast Yippee", "Top Ramen", "Wai Wai",
      // Dairy
      "Amul", "Britannia", "Dairy Milk", "Nestlé",
      // Detergent
      "Surf Excel", "Tide", "Ariel", "Rin",
      // Oils
      "Fortune", "Saffola", "Refined Sunflower",
      // Snacks
      "Lay's", "Bingo", "Parle", "ITC",
      // Beverages
      "Nescafé", "Bru", "Lipton", "Tata Tea"
    ];
  }
}

module.exports = GS1Service;
