import React from 'react';
import { Flag, Info, ExternalLink, AlertTriangle } from 'lucide-react';

export interface USJurisdictionNoticeProps {
  variant?: 'banner' | 'inline' | 'modal' | 'compact';
  showIcon?: boolean;
  showDismiss?: boolean;
  onDismiss?: () => void;
  includeDisclaimer?: boolean;
  className?: string;
}

export const USJurisdictionNotice: React.FC<USJurisdictionNoticeProps> = ({
  variant = 'banner',
  showIcon = true,
  showDismiss = false,
  onDismiss,
  includeDisclaimer = true,
  className = '',
}) => {
  const renderContent = () => (
    <>
      <div className="flex items-start gap-3">
        {showIcon && (
          <Flag size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            US Tax Law Focus
          </div>
          <div className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
            This application is designed specifically for US taxpayers and follows US tax law. 
            Tax calculations, classifications, and guidance are based on IRS regulations and 
            may not apply in other jurisdictions.
          </div>
          
          {includeDisclaimer && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Not Tax Advice:</strong> This tool provides educational information 
                  and calculations based on general tax principles. Always consult with a 
                  qualified tax professional for your specific situation.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex-shrink-0"
            aria-label="Dismiss notice"
          >
            ×
          </button>
        )}
      </div>
    </>
  );

  const renderInternationalGuidance = () => (
    <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
      <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
        International Users
      </div>
      <div className="text-sm text-blue-800 dark:text-blue-300 mb-3">
        If you're not a US taxpayer, this tool may still be useful for tracking your Bitcoin transactions, 
        but please note that tax calculations and guidance will not apply to your jurisdiction.
      </div>
      <div className="space-y-2">
        <a
          href="https://www.oecd.org/tax/tax-policy/tax-challenges-arising-from-digitalisation-overview-of-the-2020-reports-f0fb9649-en.htm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
        >
          <ExternalLink size={12} />
          OECD Digital Tax Guidelines
        </a>
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 ${className}`}>
        {showIcon && <Flag size={12} />}
        <span>US Tax Law Focus</span>
        {includeDisclaimer && (
          <span className="text-blue-600 dark:text-blue-400">• Educational Only</span>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm ${className}`}>
        {showIcon && <Info size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />}
        <span className="text-blue-800 dark:text-blue-200">
          <strong>US Tax Focus:</strong> Calculations based on US tax law.
          {includeDisclaimer && ' Educational information only.'}
        </span>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg ${className}`}>
        {renderContent()}
        {renderInternationalGuidance()}
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 ${className}`}>
      {renderContent()}
    </div>
  );
};

export default USJurisdictionNotice;