import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, description, className = '', ...props }) => {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        {...props}
      />
      <div>
        <span className="text-gray-700">{label}</span>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
    </label>
  );
};

export default Checkbox;