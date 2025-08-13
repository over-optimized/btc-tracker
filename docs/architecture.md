# Architecture & Design Principles

## Core Design Philosophy

- **Error-First Design**: Comprehensive error handling throughout the application
- **User Experience Focus**: Progressive disclosure and recovery options for all failure scenarios
- **Data Integrity**: Zero data loss with automatic backup and migration systems
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Testing Excellence**: >80% overall coverage, >90% for critical business logic
- **Educational First**: Every user decision point becomes an opportunity for Bitcoin tax education

## Key Architectural Decisions

### Multi-User Production Architecture

- **Hybrid Client-Server**: Core logic client-side, user data and auth server-side
- **Supabase Backend**: PostgreSQL database with Row Level Security for user isolation
- **Progressive Migration**: localStorage → database migration preserving existing functionality
- **Modular Design**: Clear separation between data processing, UI components, and business logic

### Robust Data Processing

- **Multi-Stage Validation**: File → Structure → Row-level validation with specific error types
- **Stable ID Generation**: Content-based IDs that remain consistent across re-imports
- **Error Recovery**: Context-aware recovery options with user guidance and data export

### Performance Considerations

- **Streaming Processing**: Large CSV files processed with progress indication
- **Memory Efficiency**: Proper cleanup and resource management
- **Caching Strategy**: Intelligent data caching with versioning for fast retrieval

## Technology Choices Rationale

### Frontend Technologies

- **React 19**: Latest stable with concurrent features for smooth UX
- **TypeScript**: Strict typing prevents runtime errors and improves maintainability
- **Vite**: Fast development builds and optimized production bundles
- **Vitest**: Modern testing framework with excellent TypeScript integration
- **Tailwind CSS**: Utility-first CSS for rapid, consistent UI development

### Infrastructure Technologies (Production)

- **Supabase**: Open-source Firebase alternative with PostgreSQL, generous free tier, built-in auth
- **Vercel**: Zero-config deployments, excellent Vite/React integration, automatic CI/CD
- **GitHub Actions**: Free for public repos, seamless Vercel integration, automated testing
- **PostgreSQL**: ACID compliance crucial for financial data, JSON support for flexibility
- **Row Level Security**: Database-level user isolation, eliminates complex server-side auth logic

## Infrastructure Transition (Q2 2025)

### Current Status: Feature-Complete → Multi-User Production

The application includes all essential Bitcoin DCA tracking features and is transitioning from localhost-only to production-ready multi-user platform:

#### ✅ Completed (Q1 2025)

- All core features: transaction tracking, tax reporting, self-custody monitoring
- Comprehensive testing with >90% coverage for critical calculations
- Professional-grade error handling and data validation
- Advanced features: AI classification, security scoring, export capabilities

#### 🏗️ In Progress (Q2 2025) - Foundation Infrastructure

- **Phase 1 (March)**: Supabase + Vercel deployment with authentication
- **Phase 2 (April)**: Beta testing with trusted users, security hardening
- **Phase 3 (May)**: Production launch with professional monitoring
- **Phase 4 (Q3)**: Exchange API integrations (Strike, Coinbase, Kraken)

### Cost-Effective Scaling Strategy

#### Alpha Release: $0/month

- Supabase free tier (500MB DB, 50K requests)
- Vercel free tier (hobby projects)
- GitHub Actions free tier (2000 minutes)

#### Beta Release: ~$10-25/month

- Potential Supabase Pro upgrade ($25/month)
- Custom domain (~$15/year)
- Sentry error tracking (free tier)

#### Production Scale: Revenue-dependent

- Scale based on actual user growth and usage patterns
- Monitor unit economics and optimize before tier upgrades

This approach demonstrates modern full-stack development with React frontend and Supabase backend, emphasizing cost-effective scaling, security-first design, and user-focused financial data management.

## Security Architecture

### Current (Client-Side Only)

- **Client-side Only**: No server-side data transmission
- **Local Storage**: All data stays in browser localStorage
- **API Calls**: Only to public CoinGecko API (read-only)
- **No Authentication**: No user accounts or sensitive data handling

### Future (Multi-User Production)

- **Row Level Security**: Database-level user isolation
- **JWT Authentication**: Secure token-based authentication
- **Data Encryption**: Sensitive data encrypted at rest
- **API Security**: Rate limiting and request validation
- **Audit Logging**: Complete audit trail for financial data changes

## Performance Architecture

### Bundle Strategy

- **Code Splitting**: Separate bundles for different feature areas
- **Lazy Loading**: Heavy components loaded on demand
- **Tree Shaking**: Eliminate unused code from bundles
- **Caching**: Aggressive caching with cache busting

### Data Processing

- **Streaming**: Large file processing with progress indication
- **Web Workers**: CPU-intensive calculations off main thread (future)
- **Memoization**: Cache expensive calculations
- **Virtualization**: Handle large transaction lists efficiently (future)

## Browser Compatibility

- **Modern Browsers**: Requires ES2021+ features
- **Local Storage**: Requires localStorage support
- **ResizeObserver**: Mocked for testing, required for charts
- **Fetch API**: Required for Bitcoin price updates

## Performance Characteristics

- **Bundle Size**: Optimized with Vite for small bundles
- **Chart Rendering**: Recharts provides efficient canvas-based rendering
- **Data Processing**: In-memory processing suitable for thousands of transactions
- **Real-time Updates**: Efficient price polling with cleanup
