import React from 'react';

interface ToroIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

export const ToroIcon: React.FC<ToroIconProps> = ({ size = 24, ...props }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {/* Cuernos potentes */}
            <path d="M3 5c0 4 3 6 5 7" />
            <path d="M21 5c0 4-3 6-5 7" />

            {/* Cabeza (Forma de U fuerte) */}
            <path d="M8 11h8a1 1 0 0 1 1 1v2a5 5 0 0 1-10 0v-2a1 1 0 0 1 1-1z" />

            {/* Anillo Nasal */}
            <circle cx="12" cy="18" r="2" />
        </svg>
    );
};
