
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, PlusCircle, Database, LayoutDashboard, Truck, Settings, Send, Menu, X } from 'lucide-react';
import { LOGO_URL } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuVisible, setIsDesktopMenuVisible] = useState(true);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-ticket', label: 'Nuevo Ticket', icon: PlusCircle },
    { path: '/history', label: 'Entradas', icon: FileText },
    { path: '/dispatches', label: 'Salidas', icon: Send },
    { path: '/generators', label: 'Generadores', icon: Database },
    { path: '/vehicles', label: 'Vehiculos', icon: Truck },  
    { path: '/configuration', label: 'Configuración', icon: Settings }
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <>
      <div className="p-6 flex flex-col items-center gap-3 border-b border-slate-800 bg-slate-950/50">
        <Link to="/" className="flex flex-col items-center gap-3 hover:opacity-90 transition-opacity">
          <img
            src={LOGO_URL}
            alt="Logo AV"
            className="w-20 h-auto"
          />
          <div className="text-center">
            <span className="block font-bold text-xs tracking-wider brand-font text-emerald-400">
              ALTERNATIVA VERDE
            </span>
            <span className="block text-[9px] text-slate-400">GESTIÓN DE TICKETS</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-4 transition-colors ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border-r-4 border-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-slate-800 text-[10px] text-slate-500">
        <p>© 2026 Alternativa Verde 2023 C.A.</p>
        <p>Rif: J-504708925</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header móvil/tablet */}
      <header className="lg:hidden no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img src={LOGO_URL} alt="Logo AV" className="w-9 h-auto" />
          <span className="text-xs font-bold tracking-wider brand-font text-emerald-700 truncate">
            ALTERNATIVA VERDE
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Drawer móvil/tablet */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          />
          <nav className="absolute right-0 top-0 h-full w-72 max-w-[90vw] bg-slate-900 text-white flex flex-col shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-200"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </nav>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        <button
          type="button"
          onClick={() => setIsDesktopMenuVisible((prev) => !prev)}
          className={`hidden lg:inline-flex no-print fixed top-4 z-30 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow ${
            isDesktopMenuVisible ? 'right-[19rem]' : 'right-4'
          }`}
          aria-label={isDesktopMenuVisible ? 'Ocultar menú' : 'Mostrar menú'}
          title={isDesktopMenuVisible ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {isDesktopMenuVisible ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 xl:p-8 overflow-y-auto">
          {children}
        </main>

        <nav
          className={`hidden lg:flex no-print bg-slate-900 text-white min-h-screen flex-col shadow-xl transition-all duration-300 overflow-hidden ${
            isDesktopMenuVisible ? 'w-72 border-l border-slate-800' : 'w-0 border-l-0'
          }`}
        >
          {sidebarContent}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
