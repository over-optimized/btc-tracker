import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, AlertTriangle, ExternalLink } from 'lucide-react';

export interface TaxEducationContent {
  title: string;
  summary: string;
  details: string | React.ReactNode;
  examples?: Array<{
    scenario: string;
    explanation: string;
    outcome: string;
  }>;
  warnings?: string[];
  resources?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
}

export interface TaxEducationPanelProps {
  content: TaxEducationContent;
  variant?: 'default' | 'compact' | 'inline';
  defaultExpanded?: boolean;
  className?: string;
}

export const TaxEducationPanel: React.FC<TaxEducationPanelProps> = ({
  content,
  variant = 'default',
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const renderExamples = () => {
    if (!content.examples?.length) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <BookOpen size={14} />
          Examples
        </h4>
        <div className="space-y-3">
          {content.examples.map((example, index) => (
            <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-medium text-blue-900 dark:text-blue-200 text-sm mb-1">
                {example.scenario}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                {example.explanation}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Tax Impact: {example.outcome}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWarnings = () => {
    if (!content.warnings?.length) return null;

    return (
      <div className="mt-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Important Considerations
              </div>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                {content.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-amber-600 dark:bg-amber-400 mt-2 flex-shrink-0"></span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResources = () => {
    if (!content.resources?.length) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          Additional Resources
        </h4>
        <div className="space-y-2">
          {content.resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <ExternalLink size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">
                  {resource.title}
                </div>
                {resource.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {resource.description}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Learn more about {content.title.toLowerCase()}
        </button>
        {isExpanded && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            {content.details}
            {renderExamples()}
            {renderWarnings()}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-block ${className}`}>
        <button
          onClick={toggleExpanded}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Learn more'}
        </button>
        {isExpanded && (
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {content.details}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
            {content.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {content.summary}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronDown size={20} className="text-gray-400" />
          ) : (
            <ChevronRight size={20} className="text-gray-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-4 text-sm text-gray-700 dark:text-gray-300">
            {content.details}
          </div>
          {renderExamples()}
          {renderWarnings()}
          {renderResources()}
        </div>
      )}
    </div>
  );
};

export default TaxEducationPanel;