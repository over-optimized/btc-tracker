import React from 'react';

const ChartSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg mb-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
            <p className="text-gray-500 text-sm">Loading chart...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;