import React from 'react';

interface TermoIconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

export const TermoIcon: React.FC<TermoIconProps> = ({ size = 24, ...props }) => {
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
            {/* Cuerpo del tanque (base cilíndrica) */}
            <path d="M6 10v8c0 2.2 2.7 4 6 4s6-1.8 6-4v-8" />

            {/* Parte superior / Hombros */}
            <path d="M6 10c0-2.2 2.7-4 6-4s6 1.8 6 4" />

            {/* Cuello y Tapa */}
            <path d="M10 6V3h4v3" />
            <path d="M9 3h6" />

            {/* Línea de detalle del cierre */}
            <path d="M10 9h4" />
        </svg>
    );
};
