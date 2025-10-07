import React from 'react';

interface AppHeaderProps {
  title: string;
  children?: React.ReactNode;
  onBack?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, children, onBack }) => {
  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white">
      <h1 className="text-xl font-semibold text-gray-900 m-0">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
        {onBack && (
          <button 
            className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1" 
            onClick={onBack}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;