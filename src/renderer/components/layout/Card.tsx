import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <hr className="border-gray-200 mb-6" />
        </>
      )}
      {children}
    </div>
  );
};

export default Card;