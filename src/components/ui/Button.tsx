import React, { ButtonHTMLAttributes } from 'react';

// Define common button variants if needed (e.g., primary, secondary, danger)
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean; // Optional loading state
  // Allow any other HTML button attributes
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150 ease-in-out';

    const variantStyles = {
      primary:
        'bg-brand-primary text-white hover:bg-brand-primary-dark focus-visible:ring-brand-primary',
      secondary:
        'bg-brand-secondary text-white hover:bg-brand-secondary-dark focus-visible:ring-brand-secondary',
      danger:
        'bg-error text-white hover:bg-red-700 focus-visible:ring-error',
      ghost:
        'text-brand-primary hover:bg-brand-primary-light focus-visible:ring-brand-primary',
      outline:
        'border border-brand-primary text-brand-primary hover:bg-brand-primary-light focus-visible:ring-brand-primary',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const disabledStyles =
      'disabled:opacity-50 disabled:cursor-not-allowed';

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${disabledStyles}
      ${className}
    `.trim(); // trim to remove any leading/trailing whitespace

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button'; // for better debugging messages

export default Button;