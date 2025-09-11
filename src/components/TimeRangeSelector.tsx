import React from 'react';
import { ChevronDown } from 'lucide-react';
import { TimeRangeOption, getDateRange, getAvailableYearOptions } from '../utils/dateFilters';

interface TimeRangeSelectorProps {
  selectedRange: TimeRangeOption;
  onRangeChange: (range: TimeRangeOption) => void;
  transactions?: { date: Date }[];
  className?: string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  transactions = [],
  className = '',
}) => {
  const availableOptions = getAvailableYearOptions(transactions);

  const getOptionLabel = (option: TimeRangeOption) => {
    return getDateRange(option).label;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={selectedRange}
        onChange={(e) => onRangeChange(e.target.value as TimeRangeOption)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                   text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 pr-10 text-sm font-medium
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer
                   min-w-[140px]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {availableOptions.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {getOptionLabel(option)}
          </option>
        ))}
      </select>

      {/* Custom chevron icon */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </div>
    </div>
  );
};

export default TimeRangeSelector;
