import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, ArrowDown, ArrowUp, Wallet, DollarSign, RefreshCw } from 'lucide-react';
import { 
  UnclassifiedTransaction, 
  TransactionClassification, 
  ClassificationDecision, 
  ClassificationPrompt 
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

  if (!isOpen || prompts.length === 0) return null;

  const currentPrompt = prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === prompts.length - 1;

  const handleClassificationChange = (
    transactionId: string, 
    classification: TransactionClassification,
    additionalData?: Partial<ClassificationDecision>
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
    classification: TransactionClassification
  ) => {
    const newDecisions = new Map(decisions);
    transactions.forEach(tx => {
      newDecisions.set(tx.id, {
        transactionId: tx.id,
        classification,
        ...(classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL && {
          destinationWallet: 'Self-Custody Wallet'
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

  const unclassifiedCount = currentPrompt.transactions.filter(
    tx => !decisions.has(tx.id) || decisions.get(tx.id)?.classification === TransactionClassification.OTHER
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{currentPrompt.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentPromptIndex + 1} of {prompts.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="p-6">
            {/* Prompt Message */}
            <div className="mb-6">
              <p className="text-gray-700">{currentPrompt.message}</p>
              {unclassifiedCount > 0 && (
                <div className="mt-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                  {unclassifiedCount} transaction{unclassifiedCount !== 1 ? 's' : ''} still need classification
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
                        onClick={() => handleBulkAction(applicableTransactions, action.classification)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {action.label}
                        {action.condition && (
                          <span className="ml-1 opacity-75">
                            ({applicableTransactions.length})
                          </span>
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
                            {Math.abs(tx.btcAmount) > 0 ? formatBTC(Math.abs(tx.btcAmount)) : 'Unknown Amount'}
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
                          <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${getClassificationColor(decision.classification)}`}>
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
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleClassificationChange(tx.id, TransactionClassification.PURCHASE)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          decision?.classification === TransactionClassification.PURCHASE
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-green-50'
                        }`}
                      >
                        Purchase
                      </button>
                      
                      <button
                        onClick={() => handleClassificationChange(tx.id, TransactionClassification.SELF_CUSTODY_WITHDRAWAL, {
                          destinationWallet: 'Self-Custody Wallet'
                        })}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          decision?.classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Self-Custody
                      </button>
                      
                      <button
                        onClick={() => handleClassificationChange(tx.id, TransactionClassification.SALE)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          decision?.classification === TransactionClassification.SALE
                            ? 'bg-red-100 border-red-300 text-red-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-red-50'
                        }`}
                      >
                        Sale
                      </button>
                      
                      <button
                        onClick={() => handleClassificationChange(tx.id, TransactionClassification.SKIP)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          decision?.classification === TransactionClassification.SKIP
                            ? 'bg-gray-100 border-gray-300 text-gray-800'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Skip
                      </button>
                    </div>

                    {/* Additional fields for certain classifications */}
                    {decision?.classification === TransactionClassification.SELF_CUSTODY_WITHDRAWAL && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Destination Wallet (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Hardware Wallet, Electrum, etc."
                          value={decision.destinationWallet || ''}
                          onChange={(e) => handleClassificationChange(tx.id, decision.classification, {
                            ...decision,
                            destinationWallet: e.target.value
                          })}
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

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {currentPromptIndex + 1} of {prompts.length} steps
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel Import
              </button>
              <button
                onClick={handleNext}
                disabled={unclassifiedCount > 0}
                className={`px-4 py-2 rounded-md transition-colors ${
                  unclassifiedCount > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLastPrompt ? 'Import Transactions' : 'Next'}
                {unclassifiedCount === 0 && <CheckCircle className="inline ml-2" size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionClassificationModal;