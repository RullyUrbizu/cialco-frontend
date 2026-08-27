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

        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

        const variants = {
            primary: 'bg-pine text-ivory-50 shadow-soft hover:bg-pine-700 hover:shadow-lift focus-visible:ring-pine',
            secondary: 'bg-paper text-ink-soft border border-sand/70 shadow-soft hover:border-brass/60 hover:text-ink hover:bg-ivory-50 focus-visible:ring-brass',
            danger: 'bg-terracotta text-white shadow-soft hover:bg-[#9C3A25] hover:shadow-lift focus-visible:ring-terracotta',
            ghost: 'bg-transparent text-ink-muted hover:bg-ivory-200/70 hover:text-ink focus-visible:ring-ink/30',
            info: 'bg-cialco text-white shadow-soft hover:bg-cialco-600 hover:shadow-lift focus-visible:ring-cialco',
            warning: 'bg-harvest text-white shadow-soft hover:bg-[#B0831F] hover:shadow-lift focus-visible:ring-harvest',
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
