import type { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';
import { AiChat } from '../ai/AiChat';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="flex min-h-screen bg-ivory">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 sm:p-6 lg:p-10 lg:pt-10 lg:ml-64 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                    {children}
                </div>
            </main>
            <AiChat />
        </div>
    );
};
