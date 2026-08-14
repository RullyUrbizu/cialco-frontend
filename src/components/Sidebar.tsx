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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-ink text-ivory hover:bg-pine transition shadow-lift"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-ink/50 backdrop-blur-[2px] z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#16281F] via-[#1B382A] to-[#1F4A36] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } grain`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Header */}
          <div className="px-6 pt-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-brass/20 border border-brass/40 flex items-center justify-center shadow-brass">
                <span className="font-serif text-2xl font-semibold text-brass-light leading-none -mt-0.5">C</span>
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-ivory tracking-tight leading-none">Stock Cialco</h1>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-brass-light/80 mt-1.5">
                  Genética &amp; Stock
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                    ? "bg-white/10 text-ivory shadow-inner shadow-black/10"
                    : "text-ivory/50 hover:bg-white/5 hover:text-ivory/90"
                    }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-brass-light" />
                  )}
                  <Icon size={19} className={`transition-transform duration-200 ${active ? "text-brass-light scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Separador y Link Externo */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <a
                href="https://cialco.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-ivory/50 hover:bg-white/5 hover:text-ivory group"
              >
                <span className="p-1.5 rounded-lg bg-brass/15 text-brass-light group-hover:bg-brass/25 transition-colors">
                  <ExternalLink size={17} />
                </span>
                <span>Sitio Cialco</span>
              </a>
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-white/10">
            <p className="text-[10px] text-center text-ivory/35 font-medium tracking-widest uppercase">
              © 2026 Cialco
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
