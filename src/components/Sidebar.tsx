import { useState } from "react";
import { Menu, X, Home, Users, ExternalLink, FileText, History } from "lucide-react";
import { ToroIcon } from "./ui/ToroIcon";
import { TermoIcon } from "./ui/TermoIcon";
import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { path: "/", label: "Stock", icon: Home },
    { path: "/termos", label: "Termos", icon: TermoIcon },
    { path: "/remitos", label: "Remitos", icon: FileText },
    { path: "/historial", label: "Historial", icon: History },
    { path: "/Clientes", label: "Clientes", icon: Users },
    { path: "/Toros", label: "Toros", icon: ToroIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-900 to-slate-900 border-r border-blue-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-center bg-blue-950/30">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white tracking-tight drop-shadow-sm">Stock Cialco</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1"
                    : "text-blue-100/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
                    }`}
                >
                  <Icon size={20} className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                  {active && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.6)]" />
                  )}
                </Link>
              );
            })}

            {/* Separador y Link Externo */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <a
                href="https://cialco.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-blue-200/70 hover:bg-white/10 hover:text-white group"
              >
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30 transition-colors">
                  <ExternalLink size={18} />
                </div>
                <span>Sitio Cialco</span>
              </a>
            </div>
          </nav>

          {/* Footer (optional) */}
          <div className="p-4 border-t border-white/10 bg-blue-950/30">
            <p className="text-xs text-center text-blue-200/50 font-medium tracking-wide">
              © 2026 Cialco
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
