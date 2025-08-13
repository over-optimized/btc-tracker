# Deployment Guide

This guide covers deploying the Bitcoin DCA Tracker with Git-based automation through Vercel's GitHub integration.

## Git-Based Automation

The project uses **automatic Git-based deployments** through Vercel's GitHub integration. No manual CLI deployment is required.

### Automatic Deployment Triggers

```bash
# Staging deployment (automatic)
git push origin staging           # Triggers staging environment deployment

# Production deployment (automatic)
git push origin main              # Triggers production environment deployment

# Preview deployments (automatic)
# Every pull request gets its own preview deployment URL
```

### Deployment Status & Monitoring

```bash
# Check deployment status
gh run list                       # View GitHub Actions workflow status
gh run view <run-id>              # View specific workflow run details

# Monitor specific deployments
gh pr checks                      # Check PR deployment status
gh pr view --web                  # View PR with deployment links

# Repository status
gh repo view --web                # View repo with deployment status
```

### Environment Configuration

**Production Environment** (`.env.production`):

- ✅ **Safe Mode Enabled**: All high-risk features disabled
- ✅ **Legal Disclaimers**: Required compliance messaging enabled
- ✅ **Security Optimized**: Performance and security headers configured

**Staging Environment** (`.env.staging`):

- ✅ **Legal Review Mode**: Medium-risk features enabled for testing
- ✅ **Debug Tools**: Development tools available for testing
- ✅ **Feature Flag Testing**: Visual feature flag indicators enabled

### Deployment Verification

```bash
# Verify production compliance before deployment
TARGET_ENV=production ./scripts/verify-compliance.sh

# Test production build locally
cp .env.production .env.local && pnpm build && rm .env.local
```

### Emergency Procedures

```bash
# Roll back production deployment
git revert <commit-hash>          # Revert problematic commit
git push origin main              # Automatic rollback deployment

# Hotfix workflow
git checkout -b hotfix/urgent-fix # Create hotfix branch
# ... make fixes ...
gh pr create --base main          # Create PR to main
# Merge triggers automatic production deployment
```

**Key Benefits of Git-Based Deployment:**

- ✅ **Zero Manual Intervention**: Deployments happen automatically on merge
- ✅ **Quality Gates**: All tests must pass before deployment
- ✅ **Audit Trail**: Complete deployment history in Git
- ✅ **Branch Protection**: Code review required before production
- ✅ **Rollback Safety**: Easy rollbacks through Git revert

## Quick Deployment

### Prerequisites

- GitHub repository with the latest code
- Vercel account (free tier is sufficient)
- PNPM installed locally for testing

### 1. Test Local Production Build

```bash
# Ensure production build works
pnpm build

# Test production build locally
pnpm preview

# Verify app loads at http://localhost:4173
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from repository root
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: btc-tracker (or your preferred name)
# - Directory: ./ (current directory)
# - Modify settings? No (vercel.json handles configuration)
```

#### Option B: Vercel Dashboard

1. Visit [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
5. Click "Deploy"

### 3. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_APP_ENV=production
VITE_APP_VERSION=0.3.0-dev
VITE_DEV_TOOLS=false
```

### 4. Verify Deployment

- Check that routes work (/, /transactions, /upload, /charts, /tax)
- Verify charts load with skeleton placeholders
- Test CSV upload functionality
- Confirm no console errors

## Advanced Configuration

### Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., btc-tracker.com)
3. Configure DNS according to Vercel instructions

### Performance Monitoring

The deployment includes:

- **Bundle splitting**: Charts loaded lazily
- **Caching headers**: 1-year cache for assets
- **Security headers**: XSS protection, frame options
- **SPA routing**: All routes serve index.html

### Branch Deployments

- **Main branch**: Production deployment
- **Feature branches**: Preview deployments
- **Pull requests**: Automatic preview URLs

## Environment Variables

### Production Variables

Set these in Vercel Dashboard:

| Variable           | Value        | Description       |
| ------------------ | ------------ | ----------------- |
| `VITE_APP_ENV`     | `production` | Environment flag  |
| `VITE_APP_VERSION` | `0.3.0-dev`  | App version       |
| `VITE_DEV_TOOLS`   | `false`      | Disable dev tools |

### Future Variables (Multi-User Phase)

When implementing Supabase integration:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Build Failures

```bash
# Check build locally first
pnpm run build

# If build fails, check:
# 1. All imports are correct
# 2. TypeScript errors resolved
# 3. Bundle size under limits
```

### Deployment Issues

- **Routes return 404**: Check vercel.json rewrites configuration
- **Charts not loading**: Verify lazy loading and Suspense wrappers
- **Large bundle**: Run `pnpm run build:analyze` to check chunk sizes

### Performance Issues

- **Slow loading**: Check main bundle is <300KB
- **Charts slow**: Verify Recharts is in separate chunk
- **Caching issues**: Check asset file names include hashes

## Monitoring

### Bundle Size Monitoring

```bash
# Check bundle sizes after changes
pnpm build

# Expected sizes:
# - Main bundle (index-*.js): ~262KB
# - Charts bundle: ~347KB (lazy loaded)
# - Individual components: <5KB each
```

### Performance Baseline

- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Main bundle**: <300KB
- **Lazy chunks**: Load as needed

## Rollback Plan

### Quick Rollback

1. Vercel Dashboard → Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
git revert <commit-hash>
git push origin main
# Vercel auto-deploys the rollback
```

## Next Steps: Multi-User Deployment

This simple deployment serves the current localhost application with optimized performance. For the full Alpha release with multi-user support, see:

- [Supabase Integration Guide](supabase-setup.md) (future)
- [Authentication Setup](auth-setup.md) (future)
- [Database Migration](database-migration.md) (future)
