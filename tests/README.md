# Bitcoin DCA Tracker - End-to-End Testing

This directory contains comprehensive end-to-end tests using Microsoft Playwright for the Bitcoin DCA Tracker application.

## Test Structure

```
tests/
├── e2e/
│   ├── transaction-import.spec.ts     # Transaction upload flow testing
│   ├── mobile-responsiveness.spec.ts  # Mobile device testing
│   ├── legal-compliance.spec.ts       # Legal disclaimer and compliance
│   └── performance-errors.spec.ts     # Performance and error handling
└── README.md
```

## Running Tests

### Prerequisites

```bash
# Install dependencies (including Playwright)
pnpm install

# Install browser binaries
npx playwright install
```

### Test Commands

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI (interactive mode)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug

# Show test report
pnpm test:e2e:report
```

### Specific Test Files

```bash
# Run specific test file
npx playwright test tests/e2e/transaction-import.spec.ts

# Run specific test with pattern
npx playwright test --grep "mobile responsive"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

## Test Categories

### 1. Transaction Import Flow (`transaction-import.spec.ts`)

Tests the core functionality of uploading and processing CSV files:

- ✅ Upload button visibility and functionality
- ✅ CSV file upload handling
- ✅ Legal disclaimer presence in classification modals
- ✅ Mobile responsive design
- ✅ Transaction classification workflow
- ✅ Feature flag safe mode operation

### 2. Mobile Responsiveness (`mobile-responsiveness.spec.ts`)

Comprehensive testing across multiple mobile devices:

- ✅ iPhone SE, iPhone 12, iPhone 12 Pro Max
- ✅ Samsung Galaxy S20, iPad Mini
- ✅ Touch-friendly interface elements (44px minimum targets)
- ✅ Modal responsiveness on mobile
- ✅ Text readability and font size validation
- ✅ Overflow and scrolling behavior
- ✅ Landscape orientation support

### 3. Legal Compliance (`legal-compliance.spec.ts`)

Ensures proper legal disclaimers and compliance:

- ✅ Legal disclaimer presence throughout app
- ✅ Transaction classification disclaimer requirements
- ✅ Feature flag safe mode indicators
- ✅ High-risk feature access limitations
- ✅ US jurisdiction notices
- ✅ User acknowledgment requirements
- ✅ Collapsible disclaimers on mobile
- ✅ IRS publication link validation
- ✅ Prescriptive tax advice language detection

**Screenshots Generated:**

- `legal-compliance-main-page.png`
- `legal-compliance-modal-notice.png`
- `legal-compliance-safe-mode.png`
- `legal-compliance-jurisdiction.png`
- `legal-compliance-mobile-collapsed.png`
- `legal-compliance-mobile-expanded.png`

### 4. Performance and Error Handling (`performance-errors.spec.ts`)

Tests application performance and error resilience:

- ✅ Page load time validation (< 5 seconds)
- ✅ Network error graceful handling
- ✅ Large file upload scenarios
- ✅ Invalid CSV data handling
- ✅ Slow connection performance
- ✅ Memory constraint efficiency
- ✅ Component error boundaries
- ✅ Concurrent user interaction handling
- ✅ Accessibility for screen readers
- ✅ Browser compatibility

## Configuration

The tests are configured via `playwright.config.ts`:

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Screenshots**: On failure only
- **Video**: Retain on failure
- **Traces**: On first retry

## CI/CD Integration

Tests can be integrated into the CI/CD pipeline:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E Tests
  run: |
    pnpm test:e2e

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Data and Fixtures

### CSV Test Data

Sample CSV data for testing transaction import:

```csv
Date & Time (UTC),Transaction Type,Amount USD,Amount BTC,BTC Price,Reference
2024-01-15 10:30:00,Purchase,$100.00,0.00234567,$42650.00,REF123456
2024-01-16 15:45:00,Purchase,$50.00,0.00117283,$42650.00,REF123457
```

### Legal Compliance Expectations

The tests verify these compliance requirements:

1. **Disclaimer Requirements**: "This is not financial or tax advice"
2. **Professional Guidance**: References to "qualified tax professional"
3. **IRS Publications**: Links to IRS.gov publications
4. **Jurisdiction Notice**: US tax law focus
5. **Safe Mode Operation**: Production safety indicators

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout in test files if app takes longer to load
2. **Screenshot Failures**: Ensure `test-results/` directory exists
3. **Browser Installation**: Run `npx playwright install` if browsers missing
4. **Dev Server**: Tests expect dev server running on port 5173

### Debug Mode

Use debug mode to step through tests interactively:

```bash
npx playwright test --debug tests/e2e/transaction-import.spec.ts
```

### Headed Mode

See tests run in actual browser:

```bash
npx playwright test --headed --project=chromium
```

## Visual Testing (Future Enhancement)

The test infrastructure supports visual regression testing:

```typescript
// Example visual test
await expect(page).toHaveScreenshot('transaction-modal.png');
```

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on others
2. **Cleanup**: Tests clean up after themselves
3. **Assertions**: Use meaningful assertions with good error messages
4. **Selectors**: Prefer data-testid attributes for reliable element selection
5. **Screenshots**: Capture screenshots for compliance and debugging

## MCP Integration

These tests are designed to work with the Playwright MCP server for enhanced Claude Code integration:

- Automated test generation based on UI interactions
- Screenshot-based debugging and issue reporting
- Performance metrics collection
- Legal compliance verification
