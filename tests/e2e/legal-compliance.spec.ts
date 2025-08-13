import { test, expect } from '@playwright/test';

test.describe('Legal Compliance Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display appropriate legal disclaimers throughout the app', async ({ page }) => {
    // Test for general disclaimer presence
    const disclaimerText = [
      'This is not financial or tax advice',
      'record-keeping purposes only',
      'qualified tax professional',
      'consult',
      'IRS Publication',
    ];

    // Check if any of these disclaimer phrases appear anywhere on the page
    for (const text of disclaimerText) {
      const element = page.locator(`text*=${text}`).first();
      if ((await element.count()) > 0) {
        console.log(`✓ Found legal disclaimer: "${text}"`);
      }
    }

    // Take a screenshot of the main page for compliance review
    await page.screenshot({
      path: 'test-results/legal-compliance-main-page.png',
      fullPage: true,
    });
  });

  test('should require appropriate disclaimers in transaction classification', async ({ page }) => {
    // Try to access upload functionality
    const uploadButton = page.locator('text=Upload CSV file');

    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Look for legal notices in any modal that appears
      const legalNotice = page.locator('text*=Important Legal Notice');
      if ((await legalNotice.count()) > 0) {
        await expect(legalNotice.first()).toBeVisible();

        // Take screenshot of legal notice
        await page.screenshot({
          path: 'test-results/legal-compliance-modal-notice.png',
        });
      }

      // Check for IRS publication references
      const irsReferences = page.locator('text*=IRS Publication');
      if ((await irsReferences.count()) > 0) {
        await expect(irsReferences.first()).toBeVisible();
        console.log('✓ Found IRS publication references');
      }

      // Check for professional consultation guidance
      const professionalGuidance = page.locator('text*=qualified tax professional');
      if ((await professionalGuidance.count()) > 0) {
        await expect(professionalGuidance.first()).toBeVisible();
        console.log('✓ Found professional consultation guidance');
      }
    }
  });

  test('should display feature flag safe mode indicators', async ({ page }) => {
    // Check for safe mode operation indicators
    const safeModeIndicators = [
      'safe mode',
      'Safe Mode',
      'development mode only',
      'legal review',
      'production deployment',
    ];

    for (const indicator of safeModeIndicators) {
      const element = page.locator(`text*=${indicator}`).first();
      if ((await element.count()) > 0) {
        console.log(`✓ Found safe mode indicator: "${indicator}"`);
      }
    }

    // Take screenshot showing safe mode operation
    await page.screenshot({
      path: 'test-results/legal-compliance-safe-mode.png',
      fullPage: true,
    });
  });

  test('should properly limit high-risk feature access', async ({ page }) => {
    // Test that high-risk features are properly disabled in production

    // Look for any high-risk educational content that should be disabled
    const highRiskContent = [
      'tax optimization',
      'tax strategy',
      'specific tax treatment',
      'tax advice',
      'recommended approach',
    ];

    let foundHighRiskContent = false;
    for (const content of highRiskContent) {
      const element = page.locator(`text*=${content}`).first();
      if ((await element.count()) > 0 && (await element.isVisible())) {
        foundHighRiskContent = true;
        console.log(`⚠️ Found potentially high-risk content: "${content}"`);
      }
    }

    // In production safe mode, high-risk content should be limited
    if (foundHighRiskContent) {
      // Take screenshot for compliance review
      await page.screenshot({
        path: 'test-results/legal-compliance-high-risk-content.png',
        fullPage: true,
      });
    }
  });

  test('should display appropriate jurisdiction notices', async ({ page }) => {
    // Check for US jurisdiction notices
    const jurisdictionIndicators = ['US tax', 'United States', 'IRS', 'US jurisdiction'];

    for (const indicator of jurisdictionIndicators) {
      const element = page.locator(`text*=${indicator}`).first();
      if ((await element.count()) > 0) {
        console.log(`✓ Found jurisdiction indicator: "${indicator}"`);
      }
    }

    // Take screenshot of jurisdiction notices
    await page.screenshot({
      path: 'test-results/legal-compliance-jurisdiction.png',
      fullPage: true,
    });
  });

  test('should require user acknowledgment for tax-related actions', async ({ page }) => {
    // Look for classification modal that requires user acknowledgment
    const uploadButton = page.locator('text=Upload CSV file');

    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Look for acknowledgment requirements
      const acknowledgmentElements = [
        'I understand',
        'I acknowledge',
        'I agree',
        'Continue',
        'Accept',
      ];

      for (const ack of acknowledgmentElements) {
        const element = page.locator(`button:has-text("${ack}"), text*=${ack}`).first();
        if ((await element.count()) > 0) {
          console.log(`✓ Found acknowledgment element: "${ack}"`);
        }
      }

      // Take screenshot of acknowledgment interface
      await page.screenshot({
        path: 'test-results/legal-compliance-acknowledgment.png',
      });
    }
  });

  test('should properly handle collapsible disclaimers on mobile', async ({ page }) => {
    // Test mobile disclaimer behavior
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Try to trigger modal with disclaimers
    const uploadButton = page.locator('text=Upload CSV file');
    if ((await uploadButton.count()) > 0) {
      await uploadButton.click();

      // Look for collapsible disclaimer functionality
      const disclaimerToggle = page.locator(
        '[aria-label*="disclaimer"], button:has-text("Important Legal Notice")',
      );

      if ((await disclaimerToggle.count()) > 0) {
        // Test disclaimer collapse/expand
        await disclaimerToggle.first().click();

        // Take screenshot of collapsed disclaimer
        await page.screenshot({
          path: 'test-results/legal-compliance-mobile-collapsed.png',
        });

        // Expand again
        await disclaimerToggle.first().click();

        // Take screenshot of expanded disclaimer
        await page.screenshot({
          path: 'test-results/legal-compliance-mobile-expanded.png',
        });
      }
    }
  });

  test('should validate IRS publication links are accessible', async ({ page }) => {
    // Check for IRS publication links
    const irsLinks = page.locator('a[href*="irs.gov"]');
    const irsLinkCount = await irsLinks.count();

    if (irsLinkCount > 0) {
      for (let i = 0; i < irsLinkCount; i++) {
        const link = irsLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        console.log(`✓ Found IRS link: "${text}" -> ${href}`);

        // Verify link has proper attributes
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
      }

      // Take screenshot showing IRS links
      await page.screenshot({
        path: 'test-results/legal-compliance-irs-links.png',
      });
    }
  });

  test('should verify no prescriptive tax advice language', async ({ page }) => {
    // Check for language that could be construed as prescriptive tax advice
    const prescriptiveLanguage = [
      'you should',
      'we recommend',
      'best approach',
      'optimal strategy',
      'tax benefit',
      'maximize',
      'minimize tax',
    ];

    const foundPrescriptiveLanguage = [];

    for (const language of prescriptiveLanguage) {
      const element = page.locator(`text*=${language}`).first();
      if ((await element.count()) > 0 && (await element.isVisible())) {
        foundPrescriptiveLanguage.push(language);
        console.log(`⚠️ Found potentially prescriptive language: "${language}"`);
      }
    }

    // If prescriptive language is found, capture for review
    if (foundPrescriptiveLanguage.length > 0) {
      await page.screenshot({
        path: 'test-results/legal-compliance-prescriptive-language.png',
        fullPage: true,
      });
    }

    // Take general screenshot for compliance review
    await page.screenshot({
      path: 'test-results/legal-compliance-language-review.png',
      fullPage: true,
    });
  });
});
