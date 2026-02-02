import type { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-200">
            <Sidebar />
            <main className="flex-1 p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8 lg:ml-64 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
};
