import React, { useEffect, useState } from 'react';
import { Bell, X, Upload, Settings } from 'lucide-react';
import { Transaction } from '../types/Transaction';
import {
  shouldShowImportReminder,
  getImportReminderPreferences,
  setImportReminderPreferences,
  analyzeDataFreshness,
} from '../utils/dataFreshness';

interface ImportReminderToastProps {
  transactions: Transaction[];
  onImportClick?: () => void;
  onSettingsClick?: () => void;
}

const ImportReminderToast: React.FC<ImportReminderToastProps> = ({
  transactions,
  onImportClick,
  onSettingsClick,
}) => {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState(getImportReminderPreferences());

  useEffect(() => {
    // Check if we should show reminder on mount
    if (shouldShowImportReminder(transactions)) {
      setVisible(true);
      
      // Update last reminder shown time
      setImportReminderPreferences({
        ...preferences,
        lastReminderShown: new Date(),
      });
    }
  }, [transactions]);

  const handleDismiss = () => {
    setVisible(false);
  };

  const handleSnooze = (days: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    
    setImportReminderPreferences({
      ...preferences,
      lastReminderShown: snoozeUntil,
    });
    
    setVisible(false);
  };

  const handleImport = () => {
    setVisible(false);
    onImportClick?.();
  };

  if (!visible || !preferences.enabled) {
    return null;
  }

  const freshness = analyzeDataFreshness(transactions);

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-orange-200 p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="text-orange-500" size={18} />
          <span className="text-sm font-semibold text-gray-800">Import Reminder</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="text-sm text-gray-700 mb-4">
        {freshness.message}
        {freshness.recommendation && (
          <div className="mt-1 text-xs text-gray-600">
            {freshness.recommendation}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleImport}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload size={14} />
          Import Strike Data
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleSnooze(1)}
            className="flex-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Remind Tomorrow
          </button>
          <button
            onClick={() => handleSnooze(3)}
            className="flex-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Remind in 3 days
          </button>
        </div>
      </div>

      {onSettingsClick && (
        <button
          onClick={() => {
            setVisible(false);
            onSettingsClick();
          }}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Settings size={12} />
          Reminder Settings
        </button>
      )}
    </div>
  );
};

export default ImportReminderToast;