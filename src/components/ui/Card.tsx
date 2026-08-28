interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: string;
}

export const Card = ({ children, className = '', padding = 'p-6' }: CardProps) => {
    return (
        <div className={`bg-paper rounded-xl2 border border-hairline shadow-soft ${padding} ${className}`}>
            {children}
        </div>
    );
};
