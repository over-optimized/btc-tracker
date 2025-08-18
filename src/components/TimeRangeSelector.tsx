import React from 'react';
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

  const buttonBaseClasses =
    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-h-[44px] sm:min-h-auto sm:px-2 sm:py-1';

  const getButtonClasses = (option: TimeRangeOption) => {
    const isSelected = selectedRange === option;
    return `${buttonBaseClasses} ${
      isSelected
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500'
    }`;
  };

  const getOptionLabel = (option: TimeRangeOption) => {
    return getDateRange(option).label;
  };

  return (
    <div className={`flex flex-wrap gap-1 sm:gap-2 ${className}`}>
      {availableOptions.map((option) => (
        <button
          key={option}
          onClick={() => onRangeChange(option)}
          className={getButtonClasses(option)}
          type="button"
        >
          {getOptionLabel(option)}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
