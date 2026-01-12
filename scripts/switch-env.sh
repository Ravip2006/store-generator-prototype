#!/bin/bash
# Environment Switcher Script
# Usage: ./scripts/switch-env.sh development|production

ENV="${1:-development}"

if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
    echo "❌ Invalid environment. Use 'development' or 'production'"
    echo "Usage: ./scripts/switch-env.sh development|production"
    exit 1
fi

echo "🔄 Switching to $ENV environment..."

# Web environment
if [ "$ENV" = "development" ]; then
    echo "📝 Setting up web/.env.local for development..."
    cat > web/.env.local << 'EOF'
# DEVELOPMENT ENVIRONMENT
# Update with your development Supabase credentials

NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_dev_key_here
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
EOF
    
    echo "📝 Setting up api/.env for development..."
    cat > api/.env << 'EOF'
# DEVELOPMENT ENVIRONMENT
# Update with your development database credentials

DATABASE_URL="postgresql://postgres.dev:password@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&statement_timeout=30000"
APP_DATABASE_URL="postgresql://app_user.dev:password@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_dev_key_here

HUGGINGFACE_API_TOKEN=hf_your_token_here
PG_TLS_INSECURE=1
NODE_ENV=development
EOF

else
    echo "📝 Setting up web/.env.local for production..."
    cat > web/.env.local << 'EOF'
# PRODUCTION ENVIRONMENT
# Using yiuhqthvxeaeoevtlmxc Supabase project

NEXT_PUBLIC_SUPABASE_URL=https://yiuhqthvxeaeoevtlmxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6m5CUEeIlwHr7ytB58UeoA_o2RrYJ7I
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
EOF
    
    echo "📝 Setting up api/.env for production..."
    cat > api/.env << 'EOF'
# PRODUCTION ENVIRONMENT
# Using yiuhqthvxeaeoevtlmxc Supabase project

DATABASE_URL="postgresql://postgres.yiuhqthvxeaeoevtlmxc:SvqxkC9TGIrdIQJV@aws-1-ap-southeast-2.pooler.supabase.co:6543/postgres?sslmode=require&statement_timeout=30000"
APP_DATABASE_URL="postgresql://app_user.yiuhqthvxeaeoevtlmxc:29June2009%21@aws-1-ap-southeast-2.pooler.supabase.co:6543/postgres?sslmode=require"

NEXT_PUBLIC_SUPABASE_URL=https://yiuhqthvxeaeoevtlmxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6m5CUEeIlwHr7ytB58UeoA_o2RrYJ7I

HUGGINGFACE_API_TOKEN=hf_your_token_here
PG_TLS_INSECURE=0
NODE_ENV=production
EOF
fi

echo "✅ Environment switched to: $ENV"
echo ""
echo "📝 Next steps:"
if [ "$ENV" = "development" ]; then
    echo "   1. Update web/.env.local with YOUR development Supabase credentials"
    echo "   2. Update api/.env with YOUR development database credentials"
    echo "   3. Run: cd web && npm run dev"
else
    echo "   1. Update NEXT_PUBLIC_API_BASE_URL in web/.env.local with your prod API URL"
    echo "   2. Verify database credentials in api/.env are correct"
    echo "   3. Run: npm run build && npm start"
fi
