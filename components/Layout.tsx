
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, PlusCircle, Database, LayoutDashboard, Truck, Settings, Send } from 'lucide-react';
import { LOGO_URL } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-ticket', label: 'Nuevo Ticket', icon: PlusCircle },
    { path: '/history', label: 'Historial', icon: FileText },
    { path: '/generators', label: 'Generadores', icon: Database },
    { path: '/vehicles', label: 'Vehiculos', icon: Truck },
    { path: '/dispatches', label: 'Salidas', icon: Send },
    { path: '/configuration', label: 'Configuración', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <nav className="w-full md:w-64 bg-slate-900 text-white md:min-h-screen flex flex-col shadow-xl no-print">
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
              <span className="block text-[9px] text-slate-400">GESTIÓN DE TICKETS 2026</span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 py-6">
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
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
