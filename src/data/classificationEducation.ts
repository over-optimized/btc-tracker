import { 
  TransactionClassification, 
  TaxEventType,
  getTaxEventType 
} from '../types/TransactionClassification';
import { TaxEducationContent } from '../components/educational';

// Classification option with educational content
export interface ClassificationOption {
  classification: TransactionClassification;
  label: string;
  shortLabel: string;
  description: string;
  taxEventType: TaxEventType;
  icon: string;
  color: string;
  examples: string[];
  whenToUse: string;
  taxImplication: string;
  educationalContent: TaxEducationContent;
  commonMistakes?: string[];
}

export const CLASSIFICATION_OPTIONS: ClassificationOption[] = [
  {
    classification: TransactionClassification.PURCHASE,
    label: 'Purchase',
    shortLabel: 'Purchase',
    description: 'Bitcoin bought with your own money',
    taxEventType: TaxEventType.INCOME,
    icon: '💰',
    color: 'green',
    examples: [
      'Strike DCA purchase',
      'Coinbase buy order',
      'Direct Bitcoin purchase'
    ],
    whenToUse: 'When you exchanged USD or other currency to buy Bitcoin',
    taxImplication: 'Creates cost basis for future sales - not immediately taxable',
    educationalContent: {
      title: 'Bitcoin Purchases',
      summary: 'Standard Bitcoin acquisitions with your own money',
      details: `When you purchase Bitcoin with USD or other currency, you're creating a cost basis that will be used to calculate capital gains or losses when you later sell, spend, or gift the Bitcoin. The purchase itself is not a taxable event, but it establishes your tax foundation.`,
      examples: [
        {
          scenario: 'You buy 0.01 BTC for $500 on Strike',
          explanation: 'You exchanged $500 of your money for Bitcoin',
          outcome: 'Cost basis: $500. No immediate tax due. Future sales calculated against this basis.'
        }
      ],
      warnings: [
        'Keep records of purchase price and date for tax calculations',
        'Include exchange fees in your cost basis'
      ]
    }
  },
  
  {
    classification: TransactionClassification.GIFT_RECEIVED,
    label: 'Gift Received',
    shortLabel: 'Gift In',
    description: 'Bitcoin received as a gift from someone else',
    taxEventType: TaxEventType.INCOME,
    icon: '🎁',
    color: 'green',
    examples: [
      'Birthday gift from family',
      'Friend sends Bitcoin as present',
      'Inheritance of Bitcoin'
    ],
    whenToUse: 'When someone gave you Bitcoin without expecting payment',
    taxImplication: 'Taxable income at fair market value when received',
    educationalContent: {
      title: 'Bitcoin Gifts Received',
      summary: 'Bitcoin received as gifts creates taxable income',
      details: `When you receive Bitcoin as a gift, the fair market value at the time of receipt becomes taxable income to you. This amount also becomes your cost basis for future sales. The gift giver may owe gift tax if the value exceeds annual exclusion limits.`,
      examples: [
        {
          scenario: 'Friend sends you 0.005 BTC worth $250 as birthday gift',
          explanation: 'You received value without providing goods/services/payment',
          outcome: 'Taxable income: $250. Cost basis for future sales: $250.'
        }
      ],
      warnings: [
        'Report as "Other Income" on tax return',
        'Gift giver may owe gift tax if over $18,000 annual exclusion (2024)',
        'Keep records of fair market value at time received'
      ]
    },
    commonMistakes: [
      'Thinking gifts are not taxable to recipient',
      'Using giver\'s cost basis instead of fair market value'
    ]
  },
  
  {
    classification: TransactionClassification.PAYMENT_RECEIVED,
    label: 'Payment Received',
    shortLabel: 'Payment In',
    description: 'Bitcoin received for work, goods, or services you provided',
    taxEventType: TaxEventType.INCOME,
    icon: '💼',
    color: 'green',
    examples: [
      'Freelance payment in Bitcoin',
      'Business accepts Bitcoin payment',
      'Tips received in Bitcoin'
    ],
    whenToUse: 'When you received Bitcoin as payment for something you provided',
    taxImplication: 'Business income taxable at fair market value when received',
    educationalContent: {
      title: 'Bitcoin Payments Received',
      summary: 'Bitcoin received as payment for goods or services',
      details: `Bitcoin received as payment for goods or services is taxable income at the fair market value when received. This applies to both business income and casual transactions. The received amount becomes your cost basis for future disposal calculations.`,
      examples: [
        {
          scenario: 'You complete freelance work and receive 0.008 BTC worth $400',
          explanation: 'You provided services and were paid in Bitcoin',
          outcome: 'Business income: $400. Cost basis for future sales: $400.'
        }
      ],
      warnings: [
        'Report as business income or other income as appropriate',
        'May be subject to self-employment taxes',
        'Keep records of fair market value and nature of services'
      ]
    }
  },
  
  {
    classification: TransactionClassification.REIMBURSEMENT_RECEIVED,
    label: 'Reimbursement Received',
    shortLabel: 'Reimbursement',
    description: 'Bitcoin received to repay expenses you covered',
    taxEventType: TaxEventType.INCOME,
    icon: '🔄',
    color: 'green',
    examples: [
      'Friend repays lunch cost via Lightning',
      'Roommate pays utilities in Bitcoin',
      'Shared expense settlement'
    ],
    whenToUse: 'When someone paid you back in Bitcoin for money you spent',
    taxImplication: 'Taxable gain/loss: Bitcoin value received vs cash amount spent',
    educationalContent: {
      title: 'Bitcoin Reimbursements',
      summary: 'Bitcoin received to repay your expenses',
      details: `When you receive Bitcoin to reimburse expenses you paid in cash, you have a taxable event. The difference between the fair market value of Bitcoin received and the cash amount you originally spent creates taxable income or loss.`,
      examples: [
        {
          scenario: 'You pay $25 for lunch, friend sends 0.0005 BTC worth $27 to reimburse',
          explanation: 'You received Bitcoin worth more than the cash you spent',
          outcome: 'Taxable income: $2 ($27 - $25). Cost basis for Bitcoin: $27.'
        }
      ],
      warnings: [
        'Track the original cash amount spent for accurate calculations',
        'This is different from pure gifts - involves exchange of value',
        'Keep records of both cash spent and Bitcoin value received'
      ]
    }
  },
  
  {
    classification: TransactionClassification.SALE,
    label: 'Sale',
    shortLabel: 'Sale',
    description: 'Bitcoin sold for cash or fiat currency',
    taxEventType: TaxEventType.DISPOSAL,
    icon: '💵',
    color: 'red',
    examples: [
      'Exchange sale for USD',
      'P2P cash transaction',
      'Conversion to fiat currency'
    ],
    whenToUse: 'When you sold Bitcoin and received cash or fiat currency',
    taxImplication: 'Capital gains/losses: Sale price minus your cost basis',
    educationalContent: {
      title: 'Bitcoin Sales',
      summary: 'Selling Bitcoin creates taxable capital gains or losses',
      details: `When you sell Bitcoin for fiat currency, you realize capital gains or losses. The gain or loss is calculated as the sale price minus your cost basis (original purchase price). Gains are taxable, losses may be deductible.`,
      examples: [
        {
          scenario: 'You sell 0.01 BTC for $600 that you bought for $500',
          explanation: 'Sale price exceeds your original cost basis',
          outcome: 'Capital gain: $100 ($600 - $500). Taxable depending on holding period.'
        }
      ],
      warnings: [
        'Gains are taxable income, losses may offset other gains',
        'Holding period affects tax rate (short vs long-term)',
        'Accurate cost basis records are essential'
      ]
    }
  },
  
  {
    classification: TransactionClassification.PAYMENT_SENT,
    label: 'Payment Sent',
    shortLabel: 'Payment Out',
    description: 'Bitcoin spent on goods, services, or bills',
    taxEventType: TaxEventType.DISPOSAL,
    icon: '🛒',
    color: 'red',
    examples: [
      'Lightning payment for coffee',
      'Online purchase with Bitcoin',
      'Bill payment in Bitcoin'
    ],
    whenToUse: 'When you spent Bitcoin to buy something or pay for services',
    taxImplication: 'Capital gains/losses: Fair market value spent minus your cost basis',
    educationalContent: {
      title: 'Bitcoin Payments Sent',
      summary: 'Spending Bitcoin creates taxable capital gains or losses',
      details: `Spending Bitcoin on goods or services is a taxable disposal. You calculate capital gains or losses based on the fair market value of what you purchased compared to your original cost basis for that Bitcoin.`,
      examples: [
        {
          scenario: 'You buy $20 coffee with Bitcoin that you originally bought for $15',
          explanation: 'You disposed of Bitcoin worth $20 that cost you $15',
          outcome: 'Capital gain: $5 ($20 - $15). Taxable regardless of small amount.'
        }
      ],
      warnings: [
        'Every purchase with Bitcoin is a taxable event',
        'Small amounts still create tax liability',
        'Track fair market value at time of purchase and original cost basis'
      ]
    }
  },
  
  {
    classification: TransactionClassification.GIFT_SENT,
    label: 'Gift Sent',
    shortLabel: 'Gift Out',
    description: 'Bitcoin given as a gift to someone else',
    taxEventType: TaxEventType.DISPOSAL,
    icon: '🎁',
    color: 'red',
    examples: [
      'Birthday gift to family member',
      'Charitable donation',
      'Gift to friend'
    ],
    whenToUse: 'When you gave Bitcoin to someone as a gift',
    taxImplication: 'Capital gains/losses: Fair market value gifted minus your cost basis',
    educationalContent: {
      title: 'Bitcoin Gifts Sent',
      summary: 'Giving Bitcoin as gifts creates taxable disposals',
      details: `When you give Bitcoin as a gift, you have a taxable disposal based on the fair market value at the time of the gift. You calculate capital gains or losses against your original cost basis. The recipient's cost basis becomes the fair market value at time of gift.`,
      examples: [
        {
          scenario: 'You gift 0.002 BTC worth $100 that you bought for $80',
          explanation: 'You disposed of Bitcoin at fair market value',
          outcome: 'Your capital gain: $20. Recipient\'s cost basis: $100. You may owe gift tax if over annual exclusion.'
        }
      ],
      warnings: [
        'You owe capital gains tax on appreciation',
        'Gift tax may apply if over annual exclusion ($18,000 in 2024)',
        'Recipient gets "stepped-up" basis at fair market value'
      ]
    }
  },
  
  {
    classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
    label: 'Self-Custody Withdrawal',
    shortLabel: 'Self-Custody',
    description: 'Bitcoin moved to your own wallet or hardware device',
    taxEventType: TaxEventType.NON_TAXABLE,
    icon: '🔒',
    color: 'blue',
    examples: [
      'Exchange to hardware wallet',
      'Hot wallet to cold storage',
      'Moving to personal wallet'
    ],
    whenToUse: 'When you moved Bitcoin from exchange to your own wallet/address',
    taxImplication: 'No tax implications - you still own the Bitcoin',
    educationalContent: {
      title: 'Self-Custody Withdrawals',
      summary: 'Moving Bitcoin to your own wallet is not taxable',
      details: `Transferring Bitcoin from an exchange to your own wallet, hardware device, or any address you control is not a taxable event. You still own the Bitcoin, just in a different location. This is recommended for security and to maintain true ownership.`,
      examples: [
        {
          scenario: 'You move 0.1 BTC from Coinbase to your hardware wallet',
          explanation: 'You transferred Bitcoin between your own accounts',
          outcome: 'No tax implications. Same cost basis, same ownership, better security.'
        }
      ],
      warnings: [
        'Keep records for security milestone tracking',
        'Network fees may be deductible expenses',
        'Ensure you control the destination address'
      ]
    }
  },
  
  {
    classification: TransactionClassification.EXCHANGE_TRANSFER,
    label: 'Exchange Transfer',
    shortLabel: 'Exchange Transfer',
    description: 'Bitcoin transferred between different exchanges',
    taxEventType: TaxEventType.NON_TAXABLE,
    icon: '↔️',
    color: 'blue',
    examples: [
      'Coinbase to Kraken transfer',
      'Moving Bitcoin for arbitrage',
      'Consolidating exchange accounts'
    ],
    whenToUse: 'When you moved Bitcoin from one exchange to another exchange',
    taxImplication: 'No tax implications - you still own the Bitcoin',
    educationalContent: {
      title: 'Exchange Transfers',
      summary: 'Moving Bitcoin between exchanges is not taxable',
      details: `Transferring Bitcoin between exchanges that you control accounts on is not a taxable event. You maintain ownership of the Bitcoin throughout the transfer. This is commonly done for trading, arbitrage, or account consolidation.`,
      examples: [
        {
          scenario: 'You transfer 0.05 BTC from Coinbase to Kraken for trading',
          explanation: 'You moved Bitcoin between your own exchange accounts',
          outcome: 'No tax implications. Same ownership, different exchange.'
        }
      ]
    }
  },
  
  {
    classification: TransactionClassification.SKIP,
    label: 'Skip This Transaction',
    shortLabel: 'Skip',
    description: 'Don\'t import this transaction (deposits, fees, etc.)',
    taxEventType: TaxEventType.NON_TAXABLE,
    icon: '⏭️',
    color: 'gray',
    examples: [
      'USD deposits to exchange',
      'Fee-only transactions',
      'Duplicate entries'
    ],
    whenToUse: 'For non-Bitcoin transactions or entries that shouldn\'t be tracked',
    taxImplication: 'No tax tracking - transaction will be ignored',
    educationalContent: {
      title: 'Skipping Transactions',
      summary: 'Some CSV entries should not be tracked as Bitcoin transactions',
      details: `Use this option for entries that are not actual Bitcoin transactions, such as USD deposits, standalone fees, or duplicate entries. Skipped transactions will not appear in your portfolio or tax calculations.`,
      examples: [
        {
          scenario: 'CSV contains a "$100 USD deposit" entry with no Bitcoin amount',
          explanation: 'This is a cash deposit, not a Bitcoin transaction',
          outcome: 'Skip this entry. It doesn\'t affect your Bitcoin holdings or tax calculations.'
        }
      ],
      warnings: [
        'Only skip entries that truly don\'t involve Bitcoin',
        'Be careful not to skip actual Bitcoin transactions',
        'Review skipped items to ensure accuracy'
      ]
    }
  }
];

// Get classification option by enum value
export const getClassificationOption = (classification: TransactionClassification): ClassificationOption | undefined => {
  return CLASSIFICATION_OPTIONS.find(option => option.classification === classification);
};

// Get options grouped by tax event type
export const getClassificationsByTaxEvent = () => {
  return {
    [TaxEventType.INCOME]: CLASSIFICATION_OPTIONS.filter(opt => opt.taxEventType === TaxEventType.INCOME),
    [TaxEventType.DISPOSAL]: CLASSIFICATION_OPTIONS.filter(opt => opt.taxEventType === TaxEventType.DISPOSAL),
    [TaxEventType.NON_TAXABLE]: CLASSIFICATION_OPTIONS.filter(opt => opt.taxEventType === TaxEventType.NON_TAXABLE),
  };
};

// Common scenario examples for Lightning Network transactions
export const LIGHTNING_SCENARIOS = [
  {
    title: 'Coffee Payment',
    description: 'You buy coffee using Lightning Network',
    classification: TransactionClassification.PAYMENT_SENT,
    explanation: 'Spending Bitcoin for goods creates a taxable disposal'
  },
  {
    title: 'Bill Split Reimbursement',
    description: 'Friend sends Bitcoin via Lightning to cover their share of dinner',
    classification: TransactionClassification.REIMBURSEMENT_RECEIVED,
    explanation: 'Receiving Bitcoin as reimbursement creates taxable income'
  },
  {
    title: 'Lightning Gift',
    description: 'You send Bitcoin via Lightning as a birthday gift',
    classification: TransactionClassification.GIFT_SENT,
    explanation: 'Giving Bitcoin creates taxable disposal at fair market value'
  },
  {
    title: 'Freelance Payment',
    description: 'Client pays you in Bitcoin via Lightning for work completed',
    classification: TransactionClassification.PAYMENT_RECEIVED,
    explanation: 'Business income taxable at fair market value when received'
  }
];