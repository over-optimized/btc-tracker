import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import { generateStableTransactionId } from '../utils/generateTransactionId';

interface AddWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (withdrawal: Transaction) => void;
  exchanges: string[]; // List of exchanges user has used
}

const AddWithdrawalModal: React.FC<AddWithdrawalModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  exchanges,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    exchange: exchanges[0] || '',
    btcAmount: '',
    destinationWallet: '',
    networkFee: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.exchange) newErrors.exchange = 'Exchange is required';
    if (!formData.btcAmount || parseFloat(formData.btcAmount) <= 0) {
      newErrors.btcAmount = 'Valid BTC amount is required';
    }
    if (!formData.destinationWallet.trim()) {
      newErrors.destinationWallet = 'Destination wallet is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const btcAmount = parseFloat(formData.btcAmount);
    const networkFee = formData.networkFee ? parseFloat(formData.networkFee) : 0;
    const date = new Date(formData.date);

    // Create withdrawal transaction
    const withdrawal: Transaction = {
      id: '', // Will be generated
      date,
      exchange: formData.exchange,
      type: 'Withdrawal',
      usdAmount: 0, // Withdrawals don't have a USD amount
      btcAmount: btcAmount,
      price: 0, // Will be set to 0 for withdrawals
      destinationWallet: formData.destinationWallet.trim(),
      networkFee: networkFee,
      networkFeeUsd: 0, // Could calculate based on current price if needed
      isSelfCustody: true,
      isTaxable: false,
      notes: formData.notes.trim(),
    };

    // Generate stable ID
    const transactionData = {
      exchange: withdrawal.exchange,
      date: withdrawal.date,
      usdAmount: withdrawal.usdAmount,
      btcAmount: withdrawal.btcAmount,
      type: withdrawal.type,
      price: withdrawal.price,
      destinationWallet: withdrawal.destinationWallet,
    };
    
    withdrawal.id = generateStableTransactionId(transactionData);

    onAdd(withdrawal);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      exchange: exchanges[0] || '',
      btcAmount: '',
      destinationWallet: '',
      networkFee: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Record Withdrawal</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Exchange */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Exchange *
            </label>
            <select
              value={formData.exchange}
              onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.exchange ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select exchange...</option>
              {exchanges.map((exchange) => (
                <option key={exchange} value={exchange}>
                  {exchange}
                </option>
              ))}
            </select>
            {errors.exchange && <p className="mt-1 text-sm text-red-600">{errors.exchange}</p>}
          </div>

          {/* BTC Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BTC Amount *
            </label>
            <input
              type="number"
              step="0.00000001"
              placeholder="0.01000000"
              value={formData.btcAmount}
              onChange={(e) => setFormData({ ...formData, btcAmount: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.btcAmount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.btcAmount && <p className="mt-1 text-sm text-red-600">{errors.btcAmount}</p>}
          </div>

          {/* Destination Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Wallet *
            </label>
            <input
              type="text"
              placeholder="Hardware Wallet, Electrum, etc."
              value={formData.destinationWallet}
              onChange={(e) => setFormData({ ...formData, destinationWallet: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.destinationWallet ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter wallet name or address where Bitcoin was sent
            </p>
            {errors.destinationWallet && <p className="mt-1 text-sm text-red-600">{errors.destinationWallet}</p>}
          </div>

          {/* Network Fee (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Network Fee (BTC)
            </label>
            <input
              type="number"
              step="0.00000001"
              placeholder="0.00001000"
              value={formData.networkFee}
              onChange={(e) => setFormData({ ...formData, networkFee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Network fee paid for the withdrawal
            </p>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes about this withdrawal..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Withdrawals to self-custody are not taxable events. 
              This will reduce your exchange balance but maintain your cost basis for tax calculations.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWithdrawalModal;