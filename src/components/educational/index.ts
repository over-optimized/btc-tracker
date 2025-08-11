// Educational Components System
// Reusable components for providing user guidance and tax education throughout the app

export { default as InfoTooltip } from './InfoTooltip';
export type { InfoTooltipProps } from './InfoTooltip';

export { default as TaxImplicationIndicator, TaxEventType } from './TaxImplicationIndicator';
export type { TaxImplicationProps } from './TaxImplicationIndicator';

export { default as TaxEducationPanel } from './TaxEducationPanel';
export type { TaxEducationPanelProps, TaxEducationContent } from './TaxEducationPanel';

export { default as ScenarioExample } from './ScenarioExample';
export type { ScenarioExampleProps, ScenarioStep } from './ScenarioExample';

export { default as USJurisdictionNotice } from './USJurisdictionNotice';
export type { USJurisdictionNoticeProps } from './USJurisdictionNotice';

// Utility functions for common educational patterns
export const createTaxScenario = (
  title: string,
  description: string,
  steps: Array<{ description: string; amount?: string; value?: string; note?: string }>,
  taxImplication: TaxEventType,
  outcome: string,
) => ({
  title,
  description,
  steps,
  taxImplication,
  outcome,
});

// Common tax education content
export const COMMON_TAX_CONTENT = {
  COST_BASIS: {
    title: 'Cost Basis Explained',
    summary: 'Understanding how your Bitcoin purchase price affects future tax calculations',
    details: `Cost basis is the original purchase price of your Bitcoin, plus any fees paid. This amount is used to calculate capital gains or losses when you sell, spend, or gift your Bitcoin. Accurate cost basis tracking is essential for proper tax reporting.`,
    examples: [
      {
        scenario: 'You buy 0.01 BTC for $500 including $5 in fees',
        explanation: 'Your cost basis is $505 ($500 + $5 fees)',
        outcome:
          "When you later sell this Bitcoin, you'll calculate gains/losses against this $505 basis",
      },
    ],
  },

  HOLDING_PERIOD: {
    title: 'Holding Period Rules',
    summary: 'How long you hold Bitcoin affects your tax rate',
    details: `Bitcoin held for more than one year qualifies for long-term capital gains treatment, which typically has more favorable tax rates. Bitcoin held for one year or less is subject to short-term capital gains, taxed as ordinary income.`,
    examples: [
      {
        scenario: 'You buy Bitcoin on January 1st and sell on December 31st',
        explanation: 'You held for exactly 365 days (not more than one year)',
        outcome: 'This is short-term capital gains, taxed as ordinary income',
      },
      {
        scenario: 'You buy Bitcoin on January 1st and sell on January 2nd the following year',
        explanation: 'You held for 366 days (more than one year)',
        outcome: 'This qualifies for long-term capital gains rates',
      },
    ],
    warnings: [
      'The holding period starts the day after purchase and includes the day of sale',
      'Each Bitcoin lot has its own holding period - FIFO/LIFO affects which lots are used',
    ],
  },

  LIGHTNING_PAYMENTS: {
    title: 'Lightning Network Tax Treatment',
    summary: 'How Bitcoin Lightning transactions are taxed',
    details: `Lightning Network transactions are treated the same as regular Bitcoin transactions for tax purposes. Spending Bitcoin via Lightning creates a taxable disposal, while receiving Bitcoin via Lightning may create taxable income depending on the circumstances.`,
    examples: [
      {
        scenario: 'You pay for coffee using Lightning Network',
        explanation: 'This is spending Bitcoin for goods/services',
        outcome: 'Taxable disposal - calculate capital gains on the Bitcoin spent',
      },
      {
        scenario: 'Friend sends you Bitcoin via Lightning to split a bill',
        explanation: 'You received Bitcoin in exchange for cash you spent',
        outcome: 'Taxable income at fair market value when received',
      },
    ],
    warnings: [
      'Lightning transactions are still Bitcoin transactions for tax purposes',
      'Keep records of all Lightning payments and receipts',
      "Small amounts still create tax events - consider de minimis rules don't apply to crypto",
    ],
  },
};
