import React from 'react';
import { User, ArrowRight, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import TaxImplicationIndicator, { TaxEventType } from './TaxImplicationIndicator';

export interface ScenarioStep {
  description: string;
  amount?: string;
  value?: string;
  note?: string;
}

export interface ScenarioExampleProps {
  title: string;
  description: string;
  persona?: string; // "Daily DCA investor", "Lightning user", etc.
  steps: ScenarioStep[];
  taxImplication: TaxEventType;
  taxCalculation?: {
    costBasis?: string;
    fairMarketValue?: string;
    capitalGain?: string;
    taxableIncome?: string;
  };
  outcome: string;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const ScenarioExample: React.FC<ScenarioExampleProps> = ({
  title,
  description,
  persona,
  steps,
  taxImplication,
  taxCalculation,
  outcome,
  variant = 'default',
  className = '',
}) => {
  const renderSteps = () => (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {step.description}
            </div>
            {(step.amount || step.value) && (
              <div className="flex items-center gap-4 mt-1 text-xs">
                {step.amount && (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {step.amount}
                  </span>
                )}
                {step.value && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {step.value}
                  </span>
                )}
              </div>
            )}
            {step.note && (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                {step.note}
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <ArrowRight size={14} className="text-gray-400 mt-1" />
          )}
        </div>
      ))}
    </div>
  );

  const renderTaxCalculation = () => {
    if (!taxCalculation) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={14} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tax Calculation
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {taxCalculation.costBasis && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cost Basis:</span>
              <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                {taxCalculation.costBasis}
              </span>
            </div>
          )}
          {taxCalculation.fairMarketValue && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Fair Market Value:</span>
              <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                {taxCalculation.fairMarketValue}
              </span>
            </div>
          )}
          {taxCalculation.capitalGain && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Capital Gain/Loss:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                {taxCalculation.capitalGain}
              </span>
            </div>
          )}
          {taxCalculation.taxableIncome && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Taxable Income:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                {taxCalculation.taxableIncome}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutcome = () => (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            Tax Outcome
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {outcome}
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {title}
          </div>
          <TaxImplicationIndicator 
            taxEventType={taxImplication}
            size="sm"
            variant="badge"
          />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {description}
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          {outcome}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h4>
            {persona && (
              <div className="flex items-center gap-1 mt-1">
                <User size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {persona}
                </span>
              </div>
            )}
          </div>
          <TaxImplicationIndicator 
            taxEventType={taxImplication}
            size="md"
            variant="badge"
          />
        </div>
        
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {description}
        </div>
        
        {renderSteps()}
        {renderTaxCalculation()}
        {renderOutcome()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        <TaxImplicationIndicator 
          taxEventType={taxImplication}
          size="sm"
          variant="badge"
        />
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </div>
      
      {renderSteps()}
      {renderTaxCalculation()}
      {renderOutcome()}
    </div>
  );
};

export default ScenarioExample;