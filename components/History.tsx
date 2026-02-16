
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Printer, Eye, ChevronRight, FileDown, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchTicketsPage, deleteTicketApi, fetchCollectionCenters } from '../utils/database';
import { CollectionCenter, Ticket } from '../types';
import { LOGO_URL } from '../constants';

const History: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedDate, setDebouncedDate] = useState('');
  const [sortKey, setSortKey] = useState<'ticketNumber' | 'date' | 'center' | 'generatorName' | 'quantity' | 'collectorName' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const pageSize = 50;
  const exportPageSize = 200;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchCollectionCenters();
      if (!mounted) return;
      setCenters(data);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setDebouncedDate(filterDate.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, filterDate]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, debouncedDate]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    (async () => {
      const result = await fetchTicketsPage({
        limit: pageSize,
        offset: page * pageSize,
        search: debouncedSearch,
        date: debouncedDate,
        sortKey: sortKey || undefined,
        sortDir: sortDirection,
        skipCache: reloadToken > 0
      });
      if (!active) return;
      setTickets(result.items);
      setTotal(result.total);
      setIsLoading(false);
    })();
    return () => { active = false };
  }, [page, pageSize, debouncedSearch, debouncedDate, reloadToken, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, total);

  const resolveCenterName = (centerId: string | null) => (
    centers.find(c => c.id === centerId)?.name || centerId || 'Sin centro'
  );

  const parseDateValue = (value: string) => {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const parts = value.split('/');
    if (parts.length !== 3) return 0;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) return 0;
    return new Date(year, month - 1, day).getTime();
  };

  const sortedTickets = React.useMemo(() => {
    if (!sortKey) return tickets;
    const copy = [...tickets];
    const direction = sortDirection === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'ticketNumber':
          return direction * (a.ticketNumber || '').localeCompare(b.ticketNumber || '', 'es', { numeric: true, sensitivity: 'base' });
        case 'date':
          return direction * (parseDateValue(a.date || '') - parseDateValue(b.date || ''));
        case 'center':
          return direction * resolveCenterName(a.collectionCenterId || null).localeCompare(resolveCenterName(b.collectionCenterId || null), 'es', { sensitivity: 'base' });
        case 'generatorName':
          return direction * (a.generatorName || '').localeCompare(b.generatorName || '', 'es', { sensitivity: 'base' });
        case 'quantity':
          return direction * ((a.quantity || 0) - (b.quantity || 0));
        case 'collectorName':
          return direction * (a.collectorName || '').localeCompare(b.collectorName || '', 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
    return copy;
  }, [tickets, sortKey, sortDirection, centers]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const sortLabels: Record<NonNullable<typeof sortKey>, string> = {
    ticketNumber: 'Nro. Ticket',
    date: 'Fecha',
    center: 'Centro de Acopio',
    generatorName: 'Generador',
    quantity: 'Cantidad',
    collectorName: 'Recolector'
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const allItems: Ticket[] = [];
      let offset = 0;

      while (true) {
        const batch = await fetchTicketsPage({
          limit: exportPageSize,
          offset,
          search: debouncedSearch,
          date: debouncedDate,
          sortKey: sortKey || undefined,
          sortDir: sortDirection,
          skipCache: true
        });
        allItems.push(...batch.items);
        offset += exportPageSize;
        if (allItems.length >= batch.total || batch.items.length === 0) break;
      }

      const rows = allItems.map((t) => ({
        'Nro Ticket': t.ticketNumber,
        'Fecha': t.date,
        'Centro de Acopio': centers.find(c => c.id === t.collectionCenterId)?.name || t.collectionCenterId || 'Sin centro',
        'Generador': t.generatorName,
        'Cantidad (Lts)': t.quantity,
        'Recolector': t.collectorName,
        'Placa': t.vehiclePlate,
        'Estado Material': t.materialState
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');

      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `historial_tickets_${stamp}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="Logo" className="w-14 h-auto" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Historial de Recolección</h1>
            <p className="text-slate-500">Consulta y reimprime los tickets generados hasta la fecha.</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" />
          {isExporting ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o Nro. Ticket..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
             <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input
                type="text"
                placeholder="DD/MM/AAAA"
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 w-40"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-xs text-slate-500">
            Orden: {sortKey ? `${sortLabels[sortKey]} (${sortDirection === 'asc' ? 'ascendente' : 'descendente'})` : 'Ninguno'}
          </span>
          <button
            type="button"
            onClick={() => setSortKey(null)}
            disabled={!sortKey}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Limpiar orden
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('ticketNumber')}
                  className="flex items-center gap-2"
                >
                  Nro. Ticket
                  {sortKey === 'ticketNumber' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-2"
                >
                  Fecha
                  {sortKey === 'date' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('center')}
                  className="flex items-center gap-2"
                >
                  Centro de Acopio
                  {sortKey === 'center' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('generatorName')}
                  className="flex items-center gap-2"
                >
                  Generador
                  {sortKey === 'generatorName' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('quantity')}
                  className="flex items-center gap-2"
                >
                  Cantidad
                  {sortKey === 'quantity' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                <button
                  type="button"
                  onClick={() => toggleSort('collectorName')}
                  className="flex items-center gap-2"
                >
                  Recolector
                  {sortKey === 'collectorName' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                  Cargando tickets...
                </td>
              </tr>
            ) : sortedTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-mono text-sm text-emerald-700 font-semibold">{ticket.ticketNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{ticket.date}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{resolveCenterName(ticket.collectionCenterId || null)}</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-900">{ticket.generatorName}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {ticket.quantity} Lts
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{ticket.collectorName}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link
                    to={`/print/${ticket.id}`}
                    className="p-2 inline-block text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Imprimir"
                  >
                    <Printer className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/print/${ticket.id}`}
                    className="p-2 inline-block text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all"
                    title="Ver Detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/edit/${ticket.id}`}
                    className="p-2 inline-block text-slate-400 hover:text-yellow-600 bg-slate-100 hover:bg-yellow-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar este ticket? Esta acción no se puede deshacer.')) return;
                      const ok = await deleteTicketApi(ticket.id);
                      if (!ok) return;
                      const nextPage = tickets.length === 1 && page > 0 ? page - 1 : page;
                      setPage(nextPage);
                      setReloadToken(prev => prev + 1);
                    }}
                    className="p-2 inline-block text-red-500 hover:text-white bg-slate-100 hover:bg-red-500 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && tickets.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-500">No se encontraron tickets con los criterios de busqueda.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Mostrando {startIndex}-{endIndex} de {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
            disabled={page === 0 || isLoading}
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Pagina {Math.min(page + 1, totalPages)} de {totalPages}
          </span>
          <button
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
            disabled={page + 1 >= totalPages || isLoading}
            onClick={() => setPage(prev => prev + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
