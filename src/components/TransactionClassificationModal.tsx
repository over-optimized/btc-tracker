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
      case TransactionClassification.PURCHASE:
        return 'bg-green-100 text-green-800';
      case TransactionClassification.SELF_CUSTODY_WITHDRAWAL:
        return 'bg-blue-100 text-blue-800';
      case TransactionClassification.SALE:
        return 'bg-red-100 text-red-800';
      case TransactionClassification.EXCHANGE_TRANSFER:
        return 'bg-purple-100 text-purple-800';
      case TransactionClassification.SKIP:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unclassifiedCount =
    currentPrompt?.transactions?.filter((tx) => !decisions.has(tx.id)).length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] max-h-[90vh] flex flex-col">
        {/* Legal Disclaimer Banner - Collapsible */}
        <div className="bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
          <div className="px-6 py-3">
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
        <div className="flex items-center justify-between p-4 md:p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
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
          <div className="p-4 md:p-6">
            {/* Prompt Message */}
            <div className="mb-6">
              <p className="text-gray-700">{currentPrompt.message}</p>
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
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {Math.abs(tx.btcAmount) > 0
                              ? formatBTC(Math.abs(tx.btcAmount))
                              : 'Unknown Amount'}
                            {tx.usdAmount > 0 && (
                              <span className="text-gray-600 ml-2">
                                ({formatCurrency(tx.usdAmount)})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {tx.exchange} • {tx.date.toLocaleDateString()} • {tx.detectedType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {decision && (
                          <div
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${getClassificationColor(decision.classification)}`}
                          >
                            {getClassificationIcon(decision.classification)}
                            {decision.classification.replace('_', ' ')}
                          </div>
                        )}
                        <button
                          onClick={() => toggleDetails(tx.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isDetailsOpen ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </div>

                    {/* Classification Options */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">
                        Select the category that best describes this transaction:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() =>
                            handleClassificationChange(tx.id, TransactionClassification.PURCHASE)
                          }
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            decision?.classification === TransactionClassification.PURCHASE
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-green-50'
                          }`}
                        >
                          Buy Bitcoin
                        </button>

                        <button
                          onClick={() =>
                            handleClassificationChange(
                              tx.id,
                              TransactionClassification.SELF_CUSTODY_WITHDRAWAL,
                              {
                                destinationWallet: 'Self-Custody Wallet',
                              },
                            )
                          }
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            decision?.classification ===
                            TransactionClassification.SELF_CUSTODY_WITHDRAWAL
                              ? 'bg-blue-100 border-blue-300 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50'
                          }`}
                        >
                          Move to Wallet
                        </button>

                        <button
                          onClick={() =>
                            handleClassificationChange(tx.id, TransactionClassification.SALE)
                          }
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            decision?.classification === TransactionClassification.SALE
                              ? 'bg-red-100 border-red-300 text-red-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-red-50'
                          }`}
                        >
                          Sell Bitcoin
                        </button>

                        <button
                          onClick={() =>
                            handleClassificationChange(tx.id, TransactionClassification.SKIP)
                          }
                          className={`p-2 text-sm rounded-md border transition-colors ${
                            decision?.classification === TransactionClassification.SKIP
                              ? 'bg-gray-100 border-gray-300 text-gray-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Skip This
                        </button>
                      </div>
                    </div>

                    {/* Additional fields for certain classifications */}
                    {decision?.classification ===
                      TransactionClassification.SELF_CUSTODY_WITHDRAWAL && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Destination Wallet (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Hardware Wallet, Electrum, etc."
                          value={decision.destinationWallet || ''}
                          onChange={(e) =>
                            handleClassificationChange(tx.id, decision.classification, {
                              ...decision,
                              destinationWallet: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Details Panel */}
                    {isDetailsOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Raw Type:</span> {tx.detectedType}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> {tx.btcAmount} BTC
                          </div>
                          {tx.destinationAddress && (
                            <div className="col-span-2">
                              <span className="font-medium">Address:</span> {tx.destinationAddress}
                            </div>
                          )}
                          {tx.txHash && (
                            <div className="col-span-2">
                              <span className="font-medium">TX Hash:</span> {tx.txHash}
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
          <div className="px-4 md:px-6 py-2 md:py-3 border-b border-gray-200 bg-blue-50">
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
          <div className="p-4 md:p-6">
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
