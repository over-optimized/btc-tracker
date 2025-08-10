import React from 'react';
import { Bitcoin, TrendingUp } from 'lucide-react';

interface BrandHeaderProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ 
  className = '', 
  showSubtitle = true,
  size = 'medium'
}) => {
  const sizeConfig = {
    small: {
      container: 'gap-2',
      iconSize: 20,
      titleClass: 'text-lg font-bold',
      subtitleClass: 'text-xs'
    },
    medium: {
      container: 'gap-3',
      iconSize: 24,
      titleClass: 'text-xl sm:text-2xl font-bold',
      subtitleClass: 'text-sm'
    },
    large: {
      container: 'gap-4',
      iconSize: 32,
      titleClass: 'text-2xl sm:text-3xl font-bold',
      subtitleClass: 'text-base'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`logo-container relative overflow-hidden rounded-xl border border-gray-200/40 dark:border-gray-700/40 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm px-4 py-3 transition-all duration-300 hover:border-gray-300/60 dark:hover:border-gray-600/60 hover:shadow-lg hover:shadow-orange-100/20 dark:hover:shadow-orange-900/10 ${className}`}>
      <div className={`flex items-center ${config.container} relative z-10`}>
        {/* Logo Area - Future placeholder for custom logo */}
        <div className="flex items-center gap-2 relative">
          {/* Primary Bitcoin Icon */}
          <div className="relative">
            <Bitcoin 
              className="text-orange-500 dark:text-orange-400" 
              size={config.iconSize} 
            />
            {/* Subtle accent indicator */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-75"></div>
          </div>
          
          {/* Trending indicator */}
          <TrendingUp 
            className="text-blue-500 dark:text-blue-400 opacity-75" 
            size={Math.round(config.iconSize * 0.7)} 
          />
        </div>
        
        {/* Brand Text */}
        <div className="flex flex-col">
          <h1 className={`${config.titleClass} bg-gradient-to-r from-orange-600 to-blue-600 dark:from-orange-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight`}>
            Bitcoin DCA Tracker
          </h1>
          {showSubtitle && (
            <p className={`${config.subtitleClass} text-gray-600 dark:text-gray-400 leading-none`}>
              Track your dollar-cost averaging strategy
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;