import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { Button } from './Button';

interface ExportMenuProps {
    onExportPDF: () => void;
    onExportXLSX: () => void;
    className?: string;
}

export const ExportMenu = ({ onExportPDF, onExportXLSX, className = "" }: ExportMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            <Button
                variant="secondary"
                className="flex items-center gap-2 w-full sm:w-auto h-10 px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Download size={18} />
                <span>Exportar</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        <button
                            onClick={() => {
                                onExportPDF();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
                        >
                            <FileText size={18} className="text-gray-400" />
                            <div className="flex flex-col">
                                <span className="font-semibold">PDF (.pdf)</span>
                                <span className="text-[10px] text-gray-400">Documento profesional</span>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                onExportXLSX();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left border-t border-gray-50"
                        >
                            <Table size={18} className="text-gray-400" />
                            <div className="flex flex-col">
                                <span className="font-semibold">Excel (.xlsx)</span>
                                <span className="text-[10px] text-gray-400">Hoja de cálculo</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
