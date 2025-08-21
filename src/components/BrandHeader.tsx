import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bitcoin, TrendingUp } from 'lucide-react';

interface BrandHeaderProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({
  className = '',
  showSubtitle = true,
  size = 'medium',
  clickable = true,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate('/');
    }
  };
  const sizeConfig = {
    small: {
      container: 'gap-2',
      iconSize: 20,
      titleClass: 'text-lg font-bold',
      subtitleClass: 'text-xs',
    },
    medium: {
      container: 'gap-3',
      iconSize: 24,
      titleClass: 'text-xl sm:text-2xl font-bold',
      subtitleClass: 'text-sm',
    },
    large: {
      container: 'gap-4',
      iconSize: 32,
      titleClass: 'text-2xl sm:text-3xl font-bold',
      subtitleClass: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`logo-container relative overflow-hidden rounded-xl border border-gray-200/15 dark:border-gray-700/40 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm px-4 py-3 transition-all duration-300 group ${
        clickable
          ? 'cursor-pointer hover:scale-[1.02] hover:border-gray-300/30 dark:hover:border-gray-600/60 hover:shadow-lg hover:shadow-orange-100/20 dark:hover:shadow-orange-900/10 hover:brightness-110'
          : ''
      } ${className}`}
      onClick={handleClick}
      title={clickable ? 'Go to Dashboard' : undefined}
    >
      {/* Enhanced shimmer animation */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-orange-400/10 to-transparent group-hover:translate-x-full transition-transform duration-[1500ms] ease-out"></div>

      <div className={`flex items-center ${config.container} relative z-10`}>
        {/* Logo Area - Future placeholder for custom logo */}
        <div className="flex items-center gap-1 relative">
          {/* Primary Bitcoin Icon */}
          <div className="relative">
            <Bitcoin
              className="text-orange-500 dark:text-orange-400 transition-all duration-300 group-hover:scale-110"
              size={config.iconSize}
            />
            {/* Subtle accent indicator with pulse */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-75 group-hover:opacity-100 animate-pulse"></div>
          </div>

          {/* Trending indicator */}
          <TrendingUp
            className="text-blue-500 dark:text-blue-400 opacity-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
            size={Math.round(config.iconSize * 0.7)}
          />
        </div>

        {/* Brand Text */}
        <div className="flex flex-col">
          <h1
            className={`${config.titleClass} bg-gradient-to-r from-orange-600 to-blue-600 dark:from-orange-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight transition-all duration-300 group-hover:from-orange-500 group-hover:to-blue-500 dark:group-hover:from-orange-300 dark:group-hover:to-blue-300`}
          >
            BTC Tracker
          </h1>
          {showSubtitle && (
            <p
              className={`${config.subtitleClass} text-gray-600 dark:text-gray-400 leading-none transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300`}
            >
              Track your Bitcoin investments
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;
