import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  Wallet,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  UnclassifiedTransaction,
  TransactionClassification,
  ClassificationDecision,
  ClassificationPrompt,
} from '../types/TransactionClassification';
import { formatBTC } from '../utils/formatBTC';
import { formatCurrency } from '../utils/formatCurrency';
import { TransactionClassifier } from '../utils/transactionClassifier';
import { useFeature } from '../hooks/useFeatureFlags';

// Utility functions for transaction display
const getTransactionIdSnippet = (id: string): string => {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
};

const getDirectionIndicator = (btcAmount: number): { icon: string; label: string } => {
  if (btcAmount > 0) return { icon: '⬆️', label: 'Incoming' };
  if (btcAmount < 0) return { icon: '⬇️', label: 'Outgoing' };
  return { icon: '↔️', label: 'Transfer' };
};

const truncateAddress = (
  address: string,
  maxLength: number = 80,
): { truncated: string; needsTruncation: boolean } => {
  if (address.length <= maxLength) {
    return { truncated: address, needsTruncation: false };
  }

  // For Lightning invoices, show first 20 and last 20 characters
  if (address.startsWith('lnbc')) {
    return {
      truncated: `${address.slice(0, 20)}...${address.slice(-20)}`,
      needsTruncation: true,
    };
  }

  // For other addresses, show first part + ellipsis
  return {
    truncated: `${address.slice(0, maxLength)}...`,
    needsTruncation: true,
  };
};

interface TransactionClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: ClassificationPrompt[];
  onClassify: (decisions: ClassificationDecision[]) => void;
}

interface TransactionDecision extends ClassificationDecision {
  processed?: boolean;
}

const TransactionClassificationModal: React.FC<TransactionClassificationModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onClassify,
}) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [decisions, setDecisions] = useState<Map<string, TransactionDecision>>(new Map());
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [isDisclaimerCollapsed, setIsDisclaimerCollapsed] = useState(false);
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());

  // Feature flag for expanded classification system
  const expandedClassifications = useFeature('expandedClassifications');

  // Create classifier instance for smart UI logic
  const classifier = new TransactionClassifier();

  // Function to render smart classification buttons based on transaction data
  const renderClassificationButtons = (tx: UnclassifiedTransaction) => {
    const decision = decisions.get(tx.id);
    const { available, disabled } = classifier.getAvailableClassifications(tx, {
      expandedClassifications,
    });

    // Debug logging for feature flag verification
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('🔧 Classification Debug:', {
        transactionId: tx.id,
        expandedClassifications,
        available,
        disabled,
        btcAmount: tx.btcAmount,
        usdAmount: tx.usdAmount,
        price: tx.price,
      });
    }

    // Define all possible classifications with their UI properties
    const getAllClassificationOptions = () => [
      // INCOME EVENTS (Acquisition/Income)
      {
        classification: TransactionClassification.PURCHASE,
        label: 'Buy Bitcoin',
        icon: '💰',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.GIFT_RECEIVED,
        label: 'Gift Received',
        icon: '🎁',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.PAYMENT_RECEIVED,
        label: 'Payment Received',
        icon: '💸',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.REIMBURSEMENT_RECEIVED,
        label: 'Reimbursement',
        icon: '💼',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.MINING_INCOME,
        label: 'Mining Reward',
        icon: '⛏️',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.STAKING_INCOME,
        label: 'Staking Reward',
        icon: '🏦',
        category: 'income',
        colors: {
          active: 'bg-green-100 border-green-300 text-green-800',
          enabled:
            'bg-white border-gray-400 text-gray-900 hover:bg-green-50 hover:border-green-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },

      // DISPOSAL EVENTS (Capital Gains/Loss)
      {
        classification: TransactionClassification.SALE,
        label: 'Sell Bitcoin',
        icon: '💵',
        category: 'disposal',
        colors: {
          active: 'bg-red-100 border-red-300 text-red-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-red-50 hover:border-red-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.GIFT_SENT,
        label: 'Gift Sent',
        icon: '🎁',
        category: 'disposal',
        colors: {
          active: 'bg-red-100 border-red-300 text-red-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-red-50 hover:border-red-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
      {
        classification: TransactionClassification.PAYMENT_SENT,
        label: 'Payment Sent',
        icon: '💳',
        category: 'disposal',
        colors: {
          active: 'bg-red-100 border-red-300 text-red-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-red-50 hover:border-red-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },

      // NON-TAXABLE MOVEMENTS
      {
        classification: TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
        label: 'Move to Wallet',
        icon: '🔒',
        category: 'non-taxable',
        colors: {
          active: 'bg-blue-100 border-blue-300 text-blue-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-blue-50 hover:border-blue-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
        additionalData: { destinationWallet: 'Self-Custody Wallet' },
      },
      {
        classification: TransactionClassification.EXCHANGE_TRANSFER,
        label: 'Exchange Transfer',
        icon: '🔄',
        category: 'non-taxable',
        colors: {
          active: 'bg-blue-100 border-blue-300 text-blue-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-blue-50 hover:border-blue-300',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },

      // SYSTEM OPTIONS
      {
        classification: TransactionClassification.SKIP,
        label: 'Skip',
        icon: '⏭️',
        category: 'system',
        colors: {
          active: 'bg-gray-100 border-gray-300 text-gray-800',
          enabled: 'bg-white border-gray-400 text-gray-900 hover:bg-gray-50 hover:border-gray-500',
          disabled: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
        },
      },
    ];

    const allOptions = getAllClassificationOptions();

    // Filter options to only show available + suggested disabled ones
    const optionsToShow = allOptions.filter((option) => {
      const isAvailable = available.includes(option.classification);
      const isRecommended = tx.suggestedClassification === option.classification;
      // Show if available OR if it's the recommended option (for context)
      return isAvailable || isRecommended;
    });

    return optionsToShow.map((option) => {
      const isSelected = decision?.classification === option.classification;
      const isAvailable = available.includes(option.classification);
      const disabledInfo = disabled.find((d) => d.classification === option.classification);
      const isRecommended = tx.suggestedClassification === option.classification;

      const buttonClass = isSelected
        ? `px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all ${option.colors.active} min-h-[44px]`
        : isAvailable
          ? `px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all ${option.colors.enabled} min-h-[44px] ${
              isRecommended ? 'ring-2 ring-green-400 ring-opacity-50' : ''
            }`
          : `px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500 min-h-[44px]`;

      return (
        <button
          key={option.classification}
          onClick={() => {
            if (isAvailable) {
              handleClassificationChange(tx.id, option.classification, option.additionalData);
            }
          }}
          disabled={!isAvailable}
          className={buttonClass}
          title={disabledInfo ? disabledInfo.reason : undefined}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <span>{option.icon}</span>
            <span>{option.label}</span>
            {isRecommended && isAvailable && <span className="text-sm">✨</span>}
          </div>
        </button>
      );
    });
  };

  // Function to render additional input fields based on classification type
  const renderAdditionalFields = (tx: UnclassifiedTransaction, decision: TransactionDecision) => {
    const { classification } = decision;
    const needsFairMarketValue = [
      TransactionClassification.GIFT_RECEIVED,
      TransactionClassification.PAYMENT_RECEIVED,
      TransactionClassification.REIMBURSEMENT_RECEIVED,
      TransactionClassification.MINING_INCOME,
      TransactionClassification.STAKING_INCOME,
      TransactionClassification.GIFT_SENT,
      TransactionClassification.PAYMENT_SENT,
    ].includes(classification);

    const needsCounterparty = [
      TransactionClassification.GIFT_RECEIVED,
      TransactionClassification.PAYMENT_RECEIVED,
      TransactionClassification.REIMBURSEMENT_RECEIVED,
      TransactionClassification.GIFT_SENT,
      TransactionClassification.PAYMENT_SENT,
    ].includes(classification);

    const needsGoodsServices = [
      TransactionClassification.PAYMENT_RECEIVED,
      TransactionClassification.REIMBURSEMENT_RECEIVED,
      TransactionClassification.PAYMENT_SENT,
    ].includes(classification);

    return (
      <div className="mt-3 space-y-3">
        {/* Fair Market Value for income/disposal events without USD */}
        {needsFairMarketValue && !tx.usdAmount && !tx.price && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <span className="text-red-500">*</span> Fair Market Value (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter USD value at time of transaction"
              value={decision.usdValue || ''}
              onChange={(e) =>
                handleClassificationChange(tx.id, classification, {
                  ...decision,
                  usdValue: parseFloat(e.target.value) || undefined,
                })
              }
              className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white text-gray-900 placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for tax reporting. Use the Bitcoin price at the time of transaction.
            </p>
          </div>
        )}

        {/* Counterparty for interpersonal transactions */}
        {needsCounterparty && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Counterparty (optional)
            </label>
            <input
              type="text"
              placeholder="Person or entity involved"
              value={decision.counterparty || ''}
              onChange={(e) =>
                handleClassificationChange(tx.id, classification, {
                  ...decision,
                  counterparty: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Goods/Services for payment transactions */}
        {needsGoodsServices && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Goods/Services (optional)
            </label>
            <input
              type="text"
              placeholder="What was purchased or provided"
              value={decision.goodsServices || ''}
              onChange={(e) =>
                handleClassificationChange(tx.id, classification, {
                  ...decision,
                  goodsServices: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Destination Wallet for self-custody withdrawals */}
        {classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Destination Wallet (optional)
            </label>
            <input
              type="text"
              placeholder="Hardware Wallet, Electrum, etc."
              value={decision.destinationWallet || ''}
              onChange={(e) =>
                handleClassificationChange(tx.id, classification, {
                  ...decision,
                  destinationWallet: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Exchange information for transfers */}
        {classification === TransactionClassification.EXCHANGE_TRANSFER && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Destination Exchange (optional)
            </label>
            <input
              type="text"
              placeholder="Coinbase, Kraken, etc."
              value={decision.destinationExchange || decision.transferExchange || ''}
              onChange={(e) =>
                handleClassificationChange(tx.id, classification, {
                  ...decision,
                  destinationExchange: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* General notes for all transactions */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Additional details about this transaction"
            value={decision.notes || ''}
            onChange={(e) =>
              handleClassificationChange(tx.id, classification, {
                ...decision,
                notes: e.target.value,
              })
            }
            className="w-full px-3 py-2 text-sm border-2 border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
          />
        </div>
      </div>
    );
  };

  if (!isOpen || prompts.length === 0) return null;

  const currentPrompt = prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === prompts.length - 1;

  // Safety check: ensure currentPrompt exists and has valid data
  if (!currentPrompt || !currentPrompt.transactions || currentPrompt.transactions.length === 0) {
    console.error('Invalid currentPrompt state:', {
      currentPromptIndex,
      promptsLength: prompts.length,
      currentPrompt,
    });
    return null;
  }

  const handleClassificationChange = (
    transactionId: string,
    classification: TransactionClassification,
    additionalData?: Partial<ClassificationDecision>,
  ) => {
    const newDecisions = new Map(decisions);
    newDecisions.set(transactionId, {
      transactionId,
      classification,
      ...additionalData,
    });
    setDecisions(newDecisions);
  };

  const handleBulkAction = (
    transactions: UnclassifiedTransaction[],
    classification: TransactionClassification,
  ) => {
    const newDecisions = new Map(decisions);
    transactions.forEach((tx) => {
      newDecisions.set(tx.id, {
        transactionId: tx.id,
        classification,
        ...(classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL && {
          destinationWallet: 'Self-Custody Wallet',
        }),
      });
    });
    setDecisions(newDecisions);
  };

  const toggleDetails = (transactionId: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(transactionId)) {
      newShowDetails.delete(transactionId);
    } else {
      newShowDetails.add(transactionId);
    }
    setShowDetails(newShowDetails);
  };

  const toggleAddressExpansion = (transactionId: string) => {
    const newExpandedAddresses = new Set(expandedAddresses);
    if (newExpandedAddresses.has(transactionId)) {
      newExpandedAddresses.delete(transactionId);
    } else {
      newExpandedAddresses.add(transactionId);
    }
    setExpandedAddresses(newExpandedAddresses);
  };

  const handleNext = () => {
    if (isLastPrompt) {
      // Finalize and submit all decisions
      const finalDecisions = Array.from(decisions.values());
      onClassify(finalDecisions);
    } else {
      setCurrentPromptIndex(currentPromptIndex + 1);
    }
  };

  const getTransactionIcon = (tx: UnclassifiedTransaction) => {
    if (tx.btcAmount > 0) {
      return <ArrowDown className="text-green-500" size={16} />;
    } else {
      return <ArrowUp className="text-red-500" size={16} />;
    }
  };

  const getClassificationIcon = (classification: TransactionClassification) => {
    switch (classification) {
      case TransactionClassification.PURCHASE:
        return <DollarSign className="text-green-500" size={16} />;
      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        return <Wallet className="text-blue-500" size={16} />;
      case TransactionClassification.SALE:
        return <DollarSign className="text-red-500" size={16} />;
      case TransactionClassification.EXCHANGE_TRANSFER:
        return <RefreshCw className="text-purple-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getClassificationColor = (classification: TransactionClassification) => {
    switch (classification) {
      // INCOME EVENTS (Green family)
      case TransactionClassification.PURCHASE:
        return 'bg-green-100 text-green-800';
      case TransactionClassification.GIFT_RECEIVED:
        return 'bg-green-100 text-green-800';
      case TransactionClassification.PAYMENT_RECEIVED:
        return 'bg-green-100 text-green-800';
      case TransactionClassification.REIMBURSEMENT_RECEIVED:
        return 'bg-green-100 text-green-800';
      case TransactionClassification.MINING_INCOME:
        return 'bg-emerald-100 text-emerald-800';
      case TransactionClassification.STAKING_INCOME:
        return 'bg-emerald-100 text-emerald-800';

      // DISPOSAL EVENTS (Red family)
      case TransactionClassification.SALE:
        return 'bg-red-100 text-red-800';
      case TransactionClassification.GIFT_SENT:
        return 'bg-red-100 text-red-800';
      case TransactionClassification.PAYMENT_SENT:
        return 'bg-red-100 text-red-800';

      // NON-TAXABLE MOVEMENTS (Blue family)
      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        return 'bg-blue-100 text-blue-800';
      case TransactionClassification.EXCHANGE_TRANSFER:
        return 'bg-blue-100 text-blue-800';

      // SYSTEM OPTIONS
      case TransactionClassification.SKIP:
        return 'bg-gray-100 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const unclassifiedCount =
    currentPrompt?.transactions?.filter((tx) => !decisions.has(tx.id)).length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Legal Disclaimer Banner - Collapsible */}
        <div className="bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
          <div className="px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-yellow-800 font-medium text-sm">Important Legal Notice</p>
                  <button
                    onClick={() => setIsDisclaimerCollapsed(!isDisclaimerCollapsed)}
                    className="md:hidden text-yellow-700 hover:text-yellow-900 p-1"
                    aria-label={isDisclaimerCollapsed ? 'Expand disclaimer' : 'Collapse disclaimer'}
                  >
                    {isDisclaimerCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>
                <div
                  className={`text-yellow-700 text-xs md:text-sm ${isDisclaimerCollapsed ? 'hidden md:block' : 'block'} mt-1`}
                >
                  This tool provides basic transaction categorization for record-keeping purposes
                  only.
                  <strong> This is not financial or tax advice.</strong> Bitcoin transactions may
                  have complex tax implications. Consult IRS Publications 544 & 550 and a qualified
                  tax professional for guidance specific to your situation.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              {currentPrompt.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentPromptIndex + 1} of {prompts.length}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-4 md:p-6">
            {/* Prompt Message */}
            <div className="mb-6">
              <p className="text-gray-900">{currentPrompt.message}</p>
              {unclassifiedCount > 0 && (
                <div className="mt-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                  {unclassifiedCount} transaction{unclassifiedCount !== 1 ? 's' : ''} still need
                  classification
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {currentPrompt.bulkActions && currentPrompt.bulkActions.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-3">Quick Actions:</h3>
                <div className="flex flex-wrap gap-2">
                  {currentPrompt.bulkActions.map((action, index) => {
                    const applicableTransactions = action.condition
                      ? currentPrompt.transactions.filter(action.condition)
                      : currentPrompt.transactions;

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleBulkAction(applicableTransactions, action.classification)
                        }
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {action.label}
                        {action.condition && (
                          <span className="ml-1 opacity-75">({applicableTransactions.length})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div className="space-y-4">
              {currentPrompt.transactions.map((tx) => {
                const decision = decisions.get(tx.id);
                const isDetailsOpen = showDetails.has(tx.id);

                return (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {getTransactionIcon(tx)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <span className="text-base sm:text-lg">
                              {getDirectionIndicator(tx.btcAmount).icon}
                            </span>
                            <span className="truncate">
                              {Math.abs(tx.btcAmount) > 0
                                ? formatBTC(Math.abs(tx.btcAmount))
                                : 'Unknown Amount'}
                            </span>
                            {Math.abs(tx.usdAmount) > 0 && (
                              <span className="text-gray-600 text-xs sm:text-sm truncate">
                                ({formatCurrency(Math.abs(tx.usdAmount))})
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {tx.originalId
                                  ? getTransactionIdSnippet(tx.originalId)
                                  : getTransactionIdSnippet(tx.id)}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span>{tx.date.toLocaleDateString()}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-medium">{tx.detectedType}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {tx.exchange}
                              {tx.destinationAddress && (
                                <>
                                  <span> • </span>
                                  <span className="font-mono">
                                    {getTransactionIdSnippet(tx.destinationAddress)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {decision && (
                          <div
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${getClassificationColor(decision.classification)}`}
                          >
                            {getClassificationIcon(decision.classification)}
                            <span className="hidden sm:inline">
                              {decision.classification.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => toggleDetails(tx.id)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 min-h-[32px]"
                        >
                          {isDetailsOpen ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Panel */}
                    {isDetailsOpen && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Transaction Details
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">
                                {tx.originalId ? 'Exchange Reference:' : 'Generated ID:'}
                              </span>
                              <div className="font-mono text-gray-600 break-all mt-1">
                                {tx.originalId || tx.id}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Direction:</span>
                              <div className="text-gray-600 mt-1">
                                {getDirectionIndicator(tx.btcAmount).icon}{' '}
                                {getDirectionIndicator(tx.btcAmount).label}
                              </div>
                            </div>
                          </div>

                          {tx.originalId && (
                            <div>
                              <span className="font-medium text-gray-700">Internal ID:</span>
                              <div className="font-mono text-gray-600 break-all mt-1">{tx.id}</div>
                            </div>
                          )}

                          {tx.destinationAddress && (
                            <div>
                              <span className="font-medium text-gray-700">
                                {tx.destinationAddress.startsWith('lnbc')
                                  ? 'Lightning Invoice:'
                                  : 'Destination Address:'}
                              </span>
                              <div className="font-mono text-gray-600 break-all mt-1 text-xs overflow-hidden">
                                {tx.destinationAddress}
                              </div>
                              {tx.destinationAddress.startsWith('lnbc') && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Lightning Network payment request
                                </p>
                              )}
                            </div>
                          )}

                          {tx.txHash && (
                            <div>
                              <span className="font-medium text-gray-700">Transaction Hash:</span>
                              <div className="font-mono text-gray-600 break-all mt-1">
                                {tx.txHash}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">BTC Amount:</span>
                              <div className="text-gray-600 mt-1">{tx.btcAmount.toFixed(8)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">USD Amount:</span>
                              <div className="text-gray-600 mt-1">{tx.usdAmount || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Price:</span>
                              <div className="text-gray-600 mt-1">
                                {tx.price ? formatCurrency(tx.price) : 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Detected Type:</span>
                            <div className="text-gray-600 mt-1">{tx.detectedType}</div>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Confidence Score:</span>
                            <div className="text-gray-600 mt-1">
                              {(tx.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Smart Classification Options */}
                    <div className="mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                        <p className="text-xs sm:text-sm text-gray-800">
                          Select the category that best describes this transaction:
                        </p>
                        <span className="text-xs text-green-600 font-medium">✨ = Recommended</span>
                      </div>
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pb-4">
                        {renderClassificationButtons(tx)}
                      </div>
                    </div>

                    {/* Enhanced conditional input fields for expanded classifications */}
                    {decision && renderAdditionalFields(tx, decision)}

                    {/* Details Panel */}
                    {isDetailsOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-900">
                          <div>
                            <span className="font-medium text-gray-900">Raw Type:</span>{' '}
                            {tx.detectedType}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">Amount:</span>{' '}
                            {tx.btcAmount} BTC
                          </div>
                          {tx.destinationAddress && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-900">Address:</span>
                              <div className="mt-1">
                                {(() => {
                                  const { truncated, needsTruncation } = truncateAddress(
                                    tx.destinationAddress,
                                  );
                                  const isExpanded = expandedAddresses.has(tx.id);
                                  const displayText = isExpanded
                                    ? tx.destinationAddress
                                    : truncated;

                                  return (
                                    <div className="font-mono text-xs break-all">
                                      <div className="bg-gray-50 p-2 rounded border">
                                        {displayText}
                                      </div>
                                      {needsTruncation && (
                                        <button
                                          onClick={() => toggleAddressExpansion(tx.id)}
                                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                          {isExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                          {tx.txHash && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-900">TX Hash:</span>
                              <div className="mt-1">
                                {(() => {
                                  const { truncated, needsTruncation } = truncateAddress(
                                    tx.txHash,
                                    60,
                                  );
                                  const isExpanded = expandedAddresses.has(`${tx.id}-hash`);
                                  const displayText = isExpanded ? tx.txHash : truncated;

                                  return (
                                    <div className="font-mono text-xs break-all">
                                      <div className="bg-gray-50 p-2 rounded border">
                                        {displayText}
                                      </div>
                                      {needsTruncation && (
                                        <button
                                          onClick={() => toggleAddressExpansion(`${tx.id}-hash`)}
                                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                          {isExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t bg-gray-50 flex-shrink-0">
          {/* Tax Guidance Section */}
          <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 border-b border-gray-200 bg-blue-50">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="text-xs md:text-sm">
                <p className="text-blue-800 font-medium mb-1">For Tax Reporting Research:</p>
                <div className="text-blue-700 space-y-0.5 md:space-y-1">
                  <p>• IRS Publication 544 (Sales and Other Dispositions of Assets)</p>
                  <p>• IRS Publication 550 (Investment Income and Expenses)</p>
                  <p>
                    • IRS Virtual Currency FAQ:
                    <a
                      href="https://www.irs.gov/individuals/international-taxpayers/frequently-asked-questions-on-virtual-currency-transactions"
                      className="underline hover:no-underline ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      irs.gov/virtual-currency
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Button Section */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                {currentPromptIndex + 1} of {prompts.length} steps
              </div>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel Import
                </button>
                <button
                  onClick={handleNext}
                  disabled={unclassifiedCount > 0}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-2 min-h-[44px] text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                    unclassifiedCount > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLastPrompt ? 'Import Transactions' : 'Next'}
                  {unclassifiedCount === 0 && <CheckCircle size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionClassificationModal;
