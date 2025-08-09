# Development Tasks

This file tracks current development tasks and their status. 

## Task Management

Tasks are organized by priority and feature area. Each task includes:
- **Status**: `todo` | `in-progress` | `completed` | `blocked`
- **Priority**: `high` | `medium` | `low`
- **Estimate**: Story points or time estimate
- **Dependencies**: Other tasks that must be completed first

## Current Sprint

### Tax Reporting Implementation (Priority: High)

| Task | Status | Priority | Estimate | Notes |
|------|--------|----------|----------|-------|
| Design tax calculation engine | todo | high | 5 | Core FIFO/LIFO calculations |
| Create tax types and interfaces | todo | high | 2 | TypeScript definitions |
| Implement lot tracking system | todo | high | 8 | Track individual purchase lots |
| Build tax configuration UI | todo | medium | 5 | User settings for tax method |
| Create tax reports component | todo | medium | 8 | Generate and display reports |
| Add tax export functionality | todo | medium | 3 | CSV/JSON/PDF export |
| Write comprehensive tax tests | todo | high | 5 | Unit and integration tests |
| Add disposal transaction support | todo | low | 5 | Future enhancement |

**Total Estimate**: ~41 points

## Backlog

### Performance & Optimization (Priority: Medium)

| Task | Status | Priority | Estimate | Notes |
|------|--------|----------|----------|-------|
| Add data virtualization for large transaction lists | todo | medium | 3 | Handle 10k+ transactions |
| Implement service worker for offline support | todo | low | 8 | PWA capabilities |
| Add transaction search and filtering | todo | medium | 5 | User-requested feature |
| Optimize bundle size analysis | todo | low | 2 | Webpack bundle analyzer |

### User Experience Improvements (Priority: Medium)

| Task | Status | Priority | Estimate | Notes |
|------|--------|----------|----------|-------|
| Add dark mode toggle | todo | medium | 3 | Theme switching |
| Improve mobile responsiveness | todo | medium | 5 | Better mobile UX |
| Add keyboard shortcuts | todo | low | 2 | Power user features |
| Implement undo/redo functionality | todo | low | 8 | Complex state management |
| Add tutorial/onboarding flow | todo | medium | 5 | New user guidance |

### Data & Analytics (Priority: Low)

| Task | Status | Priority | Estimate | Notes |
|------|--------|----------|----------|-------|
| Add more exchange format support | todo | low | 3 per exchange | User requests |
| Implement data backup/restore | todo | medium | 5 | Cloud sync consideration |
| Add portfolio comparison features | todo | low | 8 | vs Bitcoin, vs S&P 500 |
| Create advanced analytics dashboard | todo | low | 13 | ROI, Sharpe ratio, etc. |

### Technical Debt & Quality (Priority: Medium)

| Task | Status | Priority | Estimate | Notes |
|------|--------|----------|----------|-------|
| Upgrade to React 19 stable | todo | medium | 2 | Current using RC |
| Add E2E testing with Playwright | todo | medium | 8 | End-to-end coverage |
| Implement proper error boundaries | todo | medium | 3 | React error handling |
| Add performance monitoring | todo | low | 5 | Analytics integration |
| Update dependencies to latest | todo | low | 2 | Regular maintenance |

## Completed This Quarter

### Q1 2025 (January)
- ✅ **Stable Transaction ID Generation** - Eliminated duplicate import issues
- ✅ **Enhanced Error Handling** - Comprehensive CSV import error handling
- ✅ **Documentation Updates** - CHANGELOG.md and task management system

## Notes

### Next Priority Decision Points
1. **Tax Reporting** is the clear next priority based on user requests
2. **Performance optimization** becomes important as user base grows
3. **Mobile experience** improvements needed for broader adoption

### Technical Considerations
- Tax reporting requires careful consideration of different tax jurisdictions
- Performance work should be data-driven (collect metrics first)
- UX improvements should be based on user feedback and analytics

### Definition of Done
Each task is considered complete when:
- ✅ Implementation meets acceptance criteria
- ✅ Unit tests written and passing (>80% coverage for new code)
- ✅ Integration tests for critical paths
- ✅ Code reviewed and approved
- ✅ Documentation updated
- ✅ User testing validated (for UI changes)
- ✅ Performance impact assessed