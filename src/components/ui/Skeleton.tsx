interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded-md ${className}`}
        />
    );
};

export const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="w-full space-y-4">
        <div className="flex gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 flex-1" />
            ))}
        </div>
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex gap-4">
                {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-12 flex-1" />
                ))}
            </div>
        ))}
    </div>
);
