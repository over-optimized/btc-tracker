import React, { Suspense } from 'react';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  fullScreen?: boolean;
}

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  fullScreen = false,
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper;