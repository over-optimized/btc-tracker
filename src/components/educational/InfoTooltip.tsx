import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

export interface InfoTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  maxWidth?: string;
  className?: string;
  iconType?: 'info' | 'help';
  iconSize?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  children,
  position = 'top',
  trigger = 'hover',
  maxWidth = 'max-w-sm',
  className = '',
  iconType = 'info',
  iconSize = 16,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-adjust position based on viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let newPosition = position;
      
      // Check if tooltip goes off-screen and adjust
      if (position === 'top' && rect.top < tooltipRect.height + 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && rect.bottom + tooltipRect.height + 10 > window.innerHeight) {
        newPosition = 'top';
      } else if (position === 'left' && rect.left < tooltipRect.width + 10) {
        newPosition = 'right';
      } else if (position === 'right' && rect.right + tooltipRect.width + 10 > window.innerWidth) {
        newPosition = 'left';
      }
      
      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (trigger === 'click') {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(!isVisible);
    }
  };

  // Close on escape key or outside click for click trigger
  useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsVisible(false);
      };
      
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
          setIsVisible(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleOutsideClick);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('click', handleOutsideClick);
      };
    }
  }, [trigger, isVisible]);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 pointer-events-none';
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'absolute top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800 border-l-4 border-r-4 border-t-4';
      case 'bottom':
        return 'absolute bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-800 border-l-4 border-r-4 border-b-4';
      case 'left':
        return 'absolute left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-800 border-t-4 border-b-4 border-l-4';
      case 'right':
        return 'absolute right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-800 border-t-4 border-b-4 border-r-4';
      default:
        return 'absolute top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800 border-l-4 border-r-4 border-t-4';
    }
  };

  const Icon = iconType === 'info' ? Info : HelpCircle;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children || (
        <button
          type="button"
          className={`inline-flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ${
            trigger === 'click' ? 'cursor-pointer' : ''
          }`}
          aria-label={title || 'More information'}
        >
          <Icon size={iconSize} />
        </button>
      )}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getPositionClasses()}
          role="tooltip"
        >
          <div className={`${maxWidth} p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg pointer-events-auto`}>
            {title && (
              <div className="font-semibold mb-1 text-gray-100">
                {title}
              </div>
            )}
            <div className="text-gray-200">
              {content}
            </div>
            <div className={getArrowClasses()}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;