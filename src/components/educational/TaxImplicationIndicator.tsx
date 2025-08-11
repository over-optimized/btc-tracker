import React from 'react';
import { TrendingUp, TrendingDown, Shield, AlertCircle } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export enum TaxEventType {
  INCOME = 'income',           // Taxable income at fair market value
  DISPOSAL = 'disposal',       // Capital gains/loss calculation
  NON_TAXABLE = 'non_taxable', // No tax implications
  UNKNOWN = 'unknown'          // Tax treatment unclear
}

export interface TaxImplicationProps {
  taxEventType: TaxEventType;
  description?: string;
  detailedExplanation?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'inline' | 'standalone';
}

const TAX_EVENT_CONFIG = {
  [TaxEventType.INCOME]: {
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    icon: TrendingUp,
    iconColor: 'text-green-600 dark:text-green-400',
    label: 'Taxable Income',
    shortLabel: 'Income',
    defaultDescription: 'Report as income at fair market value when received',
    detailedExplanation: `This transaction creates taxable income that must be reported on your tax return. The fair market value of Bitcoin at the time you received it becomes both your taxable income amount and your cost basis for future sales.`
  },
  [TaxEventType.DISPOSAL]: {
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    icon: TrendingDown,
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Taxable Disposal',
    shortLabel: 'Disposal',
    defaultDescription: 'Calculate capital gains or losses against your cost basis',
    detailedExplanation: `This transaction is a taxable disposal that may result in capital gains or losses. The difference between the fair market value when disposed and your original cost basis determines your tax liability.`
  },
  [TaxEventType.NON_TAXABLE]: {
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    icon: Shield,
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Non-Taxable',
    shortLabel: 'Non-Taxable',
    defaultDescription: 'No immediate tax implications for this transaction',
    detailedExplanation: `This transaction does not create immediate tax consequences. Moving Bitcoin between your own wallets or accounts is generally not taxable, but keep records for future disposal calculations.`
  },
  [TaxEventType.UNKNOWN]: {
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
    icon: AlertCircle,
    iconColor: 'text-gray-600 dark:text-gray-400',
    label: 'Classification Needed',
    shortLabel: 'Unknown',
    defaultDescription: 'Tax treatment depends on transaction classification',
    detailedExplanation: `The tax implications of this transaction depend on its specific nature. Please classify the transaction to determine proper tax treatment.`
  }
};

export const TaxImplicationIndicator: React.FC<TaxImplicationProps> = ({
  taxEventType,
  description,
  detailedExplanation,
  showIcon = true,
  showLabel = true,
  size = 'md',
  variant = 'badge',
}) => {
  const config = TAX_EVENT_CONFIG[taxEventType];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const displayDescription = description || config.defaultDescription;
  const displayExplanation = detailedExplanation || config.detailedExplanation;

  const renderContent = () => {
    const content = (
      <>
        {showIcon && (
          <Icon 
            size={iconSizes[size]} 
            className={`${config.iconColor} ${showLabel ? 'mr-1' : ''}`} 
          />
        )}
        {showLabel && (
          <span className="font-medium">
            {size === 'sm' ? config.shortLabel : config.label}
          </span>
        )}
      </>
    );

    if (variant === 'badge') {
      return (
        <span className={`
          inline-flex items-center rounded-full border font-medium
          ${config.color} ${sizeClasses[size]}
        `}>
          {content}
        </span>
      );
    }

    if (variant === 'inline') {
      return (
        <span className="inline-flex items-center">
          {content}
        </span>
      );
    }

    return content;
  };

  // For standalone variant or when we need tooltip
  if (variant === 'standalone' || displayDescription) {
    return (
      <InfoTooltip
        title={config.label}
        content={
          <div className="space-y-2">
            <p className="text-sm">{displayDescription}</p>
            {displayExplanation && (
              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-300">{displayExplanation}</p>
              </div>
            )}
          </div>
        }
        maxWidth="max-w-xs"
        trigger="hover"
      >
        <div className="inline-flex items-center cursor-help">
          {renderContent()}
        </div>
      </InfoTooltip>
    );
  }

  return <div className="inline-flex items-center">{renderContent()}</div>;
};

export default TaxImplicationIndicator;