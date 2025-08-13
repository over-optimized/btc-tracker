# Performance Guidelines

## Critical: Dashboard Performance Guidelines

**ALWAYS verify bundle impact before adding components to the main dashboard (app.tsx route "/"):**

### 1. Check Bundle Size Impact

```bash
# Before adding new component
pnpm build
# Note main bundle size (index-*.js)

# After adding component - verify bundle size change
pnpm build
# Main bundle should stay <300KB, warn if >250KB
```

### 2. Heavy Components MUST be Lazy Loaded

```tsx
// ❌ DON'T: Eager loading heavy libraries on main dashboard
import HeavyChartComponent from './components/HeavyChart';

// ✅ DO: Lazy load with Suspense + skeleton
const HeavyChartComponent = lazy(() => import('./components/HeavyChart'));
<Suspense fallback={<ChartSkeleton />}>
  <HeavyChartComponent />
</Suspense>;
```

### 3. Dashboard Component Checklist

- [ ] Does this component import large libraries (charts, rich text, complex UI)?
- [ ] Will this component be visible above the fold?
- [ ] Can this component be lazy-loaded with skeleton loader?
- [ ] Does the main bundle size increase by >50KB?

### 4. Bundle Analysis Command

```bash
# Generate detailed bundle analysis
pnpm run build:analyze  # Run this before major dashboard changes
open bundle-analysis.html  # Review what's in each chunk
```

## Current Performance Baseline (March 2025)

- Main bundle (index-\*.js): ~262KB ✅
- Charts bundle (lazy): ~347KB (only loads when needed) ✅
- Individual components: <5KB each ✅

## Performance Violations

- Main bundle >300KB = Performance review required
- Main bundle >400KB = Must lazy load components
- Any single component >100KB = Must be lazy loaded

## General Performance Standards

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

### Optimization Strategies

1. **Lazy Loading**: Use React.lazy() for heavy components
2. **Code Splitting**: Separate vendor libraries from app code
3. **Tree Shaking**: Eliminate unused code
4. **Compression**: Enable gzip/brotli compression
5. **Caching**: Leverage browser caching with hashed filenames

### Monitoring Tools

```bash
# Bundle analysis
pnpm run build:analyze

# Lighthouse performance audits
npx lighthouse http://localhost:4173 --chrome-flags="--headless"

# Bundle size tracking
npx bundlesize
```

### Performance Testing

- Run performance audits before major releases
- Monitor Core Web Vitals in production
- Test on slower devices and networks
- Verify lazy loading works correctly
