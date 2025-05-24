import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // You can add custom props here if needed, e.g., for error states or icons
  // error?: boolean;
  // icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const baseStyles =
      'block w-full px-3 py-2 border border-neutral-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm';

    const disabledStyles = 'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';

    // For file inputs, some base styling might differ or be unwanted
    const typeSpecificStyles = type === 'file' ? 'px-0 py-0 border-none shadow-none focus:ring-0 focus:border-0' : '';


    const combinedClassName = `
      ${baseStyles}
      ${disabledStyles}
      ${typeSpecificStyles}
      ${className}
    `.trim();

    return (
      <input
        ref={ref}
        type={type}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;