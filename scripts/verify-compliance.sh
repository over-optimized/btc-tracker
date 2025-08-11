#!/bin/bash
# Feature Flag Compliance Verification Script
# Ensures production deployments meet legal compliance requirements

set -e

echo "🔍 Production Compliance Verification"
echo "======================================"

# Environment check
if [ "$NODE_ENV" != "production" ]; then
  echo "⚠️  Warning: NODE_ENV is not set to 'production' (current: $NODE_ENV)"
fi

# Check for .env.production file
if [ ! -f ".env.production" ]; then
  echo "❌ .env.production file not found"
  exit 1
fi

echo "📋 Checking .env.production configuration..."

# Safe mode verification
if grep -q "VITE_SAFE_MODE=true" .env.production; then
  echo "✅ Safe mode enabled"
else
  echo "❌ Safe mode not enabled in production"
  exit 1
fi

# Legal disclaimers verification
if grep -q "VITE_SHOW_LEGAL_DISCLAIMERS=true" .env.production; then
  echo "✅ Legal disclaimers enabled"
else
  echo "❌ Legal disclaimers not enabled in production"
  exit 1
fi

# High-risk features verification
echo "🚨 Verifying high-risk features are disabled..."

high_risk_features=(
  "VITE_ENABLE_EDUCATIONAL_COMPONENTS"
  "VITE_ENABLE_EXPANDED_CLASSIFICATIONS" 
  "VITE_ENABLE_TAX_EDUCATION_HUB"
  "VITE_ENABLE_DETAILED_TAX_GUIDANCE"
  "VITE_ENABLE_LIGHTNING_TAX_SCENARIOS"
)

for feature in "${high_risk_features[@]}"; do
  if grep -q "${feature}=false" .env.production; then
    echo "✅ ${feature} properly disabled"
  else
    echo "❌ ${feature} not properly disabled in production"
    exit 1
  fi
done

# Medium-risk features verification  
echo "⚠️  Verifying medium-risk features are disabled..."

medium_risk_features=(
  "VITE_ENABLE_ADVANCED_TAX_TOOLTIPS"
  "VITE_ENABLE_TAX_OPTIMIZATION" 
  "VITE_ENABLE_IRS_REFERENCES"
)

for feature in "${medium_risk_features[@]}"; do
  if grep -q "${feature}=false" .env.production; then
    echo "✅ ${feature} properly disabled"
  else
    echo "❌ ${feature} not properly disabled in production"
    exit 1
  fi
done

# Development features verification
echo "🔧 Verifying development features are disabled..."

dev_features=(
  "VITE_DEBUG_MODE"
  "VITE_SHOW_FEATURE_FLAGS"
  "VITE_ENABLE_EXPERIMENTAL"
)

for feature in "${dev_features[@]}"; do
  if grep -q "${feature}=false" .env.production; then
    echo "✅ ${feature} properly disabled"
  else
    echo "❌ ${feature} not properly disabled in production"
    exit 1
  fi
done

echo ""
echo "🎉 Production compliance verification PASSED"
echo "✅ All high-risk features disabled"
echo "✅ Safe mode enabled" 
echo "✅ Legal disclaimers enabled"
echo "✅ Development features disabled"
echo ""
echo "🚀 Safe for production deployment!"