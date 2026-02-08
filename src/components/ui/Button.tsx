import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'info' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95';

        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:ring-blue-500 shadow-sm',
            secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md hover:border-gray-400 focus:ring-blue-500 shadow-sm',
            danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg focus:ring-red-500 shadow-sm',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:shadow-sm focus:ring-gray-500',
            info: 'bg-cyan-600 text-white hover:bg-cyan-700 hover:shadow-lg focus:ring-cyan-500 shadow-sm',
            warning: 'bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg focus:ring-amber-500 shadow-sm',
        };

        const sizes = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-lg',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
