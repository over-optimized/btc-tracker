export type TransactionType = 
  | 'Purchase' | 'Buy' | 'Trade'  // Acquisition transactions
  | 'Withdrawal' | 'Transfer'      // Self-custody movements
  | 'Sale' | 'Sell';               // Disposal transactions

export interface Transaction {
  id: string;
  date: Date;
  exchange: string;
  type: string; // Will gradually migrate to TransactionType
  usdAmount: number;
  btcAmount: number;
  price: number;
  
  // Extended fields for withdrawal tracking (optional for backward compatibility)
  destinationWallet?: string;     // Wallet name or address where Bitcoin was sent
  networkFee?: number;           // Network fee in BTC for withdrawals
  networkFeeUsd?: number;        // Network fee in USD at time of transaction
  isSelfCustody?: boolean;       // Flag indicating this is a self-custody movement
  notes?: string;                // User notes about the transaction
  
  // Tax treatment flags
  isTaxable?: boolean;           // Whether this creates a taxable event (defaults based on type)
}

export interface WithdrawalTransaction extends Transaction {
  type: 'Withdrawal' | 'Transfer';
  destinationWallet: string;
  isSelfCustody: true;
  isTaxable: false;
}
