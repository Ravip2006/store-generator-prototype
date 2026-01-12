#!/bin/bash

# ============================================
# Authentication Setup Quick Start
# ============================================
# This script helps you set up Supabase authentication
# for your store-generator application
#
# Usage: bash setup-auth.sh

set -e

echo "======================================"
echo "Store Generator - Auth Setup"
echo "======================================"
echo ""

# Check if we're in the web directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the web directory"
    echo "Run this script from: /Users/Akhandsingh/store-generator-prototype/web"
    exit 1
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "ℹ️  .env.local already exists"
    echo ""
    read -p "Do you want to (1) update it or (2) create a backup and start fresh? (1/2): " choice
    
    if [ "$choice" = "2" ]; then
        timestamp=$(date +%s)
        cp .env.local ".env.local.backup.$timestamp"
        echo "✅ Created backup: .env.local.backup.$timestamp"
    fi
fi

echo ""
echo "======================================"
echo "STEP 1: Create Supabase Project"
echo "======================================"
echo ""
echo "1. Go to: https://supabase.com"
echo "2. Sign up or log in"
echo "3. Click 'New Project'"
echo "4. Fill in project details:"
echo "   - Project Name: store-generator-dev (for development)"
echo "   - Database Password: (create a strong password)"
echo "   - Region: (closest to your users)"
echo "   - Pricing Plan: Free (for development)"
echo "5. Wait for project to initialize (2-3 minutes)"
echo ""
read -p "Press Enter when your Supabase project is ready..."

echo ""
echo "======================================"
echo "STEP 2: Get Your API Credentials"
echo "======================================"
echo ""
echo "1. In your Supabase project, click Settings (gear icon)"
echo "2. Select 'API' from the left sidebar"
echo "3. Copy your project URL and anon key:"
echo ""
echo "   Project URL: https://[your-project-ref].supabase.co"
echo "   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

# Get Supabase URL
read -p "Enter your NEXT_PUBLIC_SUPABASE_URL: " supabase_url

if [ -z "$supabase_url" ]; then
    echo "❌ Error: Supabase URL is required"
    exit 1
fi

# Get Supabase Anon Key
read -p "Enter your NEXT_PUBLIC_SUPABASE_ANON_KEY: " supabase_key

if [ -z "$supabase_key" ]; then
    echo "❌ Error: Supabase Anon Key is required"
    exit 1
fi

echo ""
echo "======================================"
echo "STEP 3: Configure Email (Optional)"
echo "======================================"
echo ""
echo "To enable email authentication:"
echo "1. In Supabase Dashboard, go to 'Authentication'"
echo "2. Click 'Providers'"
echo "3. Find 'Email' and toggle it ON"
echo ""
read -p "Press Enter once you've enabled email auth..."

echo ""
echo "======================================"
echo "Creating .env.local"
echo "======================================"
echo ""

# Create .env.local
cat > .env.local << EOF
# Supabase Authentication (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_key"
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET="product-images"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:3001"
API_BASE_URL="http://127.0.0.1:3001"
EOF

echo "✅ Created .env.local with your credentials"
echo ""

echo "======================================"
echo "STEP 4: Test Authentication"
echo "======================================"
echo ""
echo "1. Start your development server:"
echo "   npm run dev"
echo ""
echo "2. Open your browser and go to:"
echo "   http://localhost:3000/s/your-store-slug"
echo ""
echo "3. Add items to cart and go to checkout"
echo ""
echo "4. Click 'Sign in or create account'"
echo ""
echo "5. Test signing up with an email"
echo ""
echo "✅ If auth works, you're all set!"
echo ""

echo "======================================"
echo "Production Setup"
echo "======================================"
echo ""
echo "For production deployment:"
echo "1. Create a separate Supabase project"
echo "2. Set environment variables in your hosting platform:"
echo "   - Vercel: Settings → Environment Variables"
echo "   - Railway, Netlify, etc: Follow their docs"
echo ""
echo "Variables to set:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET"
echo "  - NEXT_PUBLIC_API_BASE_URL (production URL)"
echo "  - API_BASE_URL (production API URL)"
echo ""

echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Test authentication"
echo "3. Check AUTHENTICATION_SETUP.md for detailed guide"
echo ""
