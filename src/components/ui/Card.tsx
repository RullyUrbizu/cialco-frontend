interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: string;
}

export const Card = ({ children, className = '', padding = 'p-6' }: CardProps) => {
    return (
        <div className={`bg-white/40 backdrop-blur-xl shadow-lg border border-white/60 ${padding} ${className}`}>
            {children}
        </div>
    );
};
