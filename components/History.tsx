
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Printer, Eye, ChevronRight, FileDown, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  fetchTicketsPage,
  deleteTicketApi,
  fetchCollectionCenters,
  fetchGenerators,
  fetchDispatches,
  fetchAppConfiguration,
  fetchCollectionCenterMembers,
  fetchVehicles
} from '../utils/database';
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
  const today = new Date();
  const [bookMonth, setBookMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [bookYear, setBookYear] = useState(String(today.getFullYear()));
  const [isBookGenerating, setIsBookGenerating] = useState(false);

  const pageSize = 50;
  const exportPageSize = 200;
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];
  const years = React.useMemo(() => {
    const year = today.getFullYear();
    return Array.from({ length: 6 }, (_, i) => String(year - 2 + i));
  }, [today]);

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
    const slashParts = value.split('/');
    if (slashParts.length === 3) {
      const [day, month, year] = slashParts.map(Number);
      if (!day || !month || !year) return 0;
      return new Date(year, month - 1, day).getTime();
    }
    const dashParts = value.split('-');
    if (dashParts.length === 3) {
      const [year, month, day] = dashParts.map(Number);
      if (!day || !month || !year) return 0;
      return new Date(year, month - 1, day).getTime();
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    return 0;
  };

  const parseTicketDate = (value: string) => {
    const slashParts = value.split('/');
    if (slashParts.length === 3) {
      const [day, month, year] = slashParts.map(Number);
      if (!day || !month || !year) return null;
      return new Date(year, month - 1, day);
    }
    const dashParts = value.split('-');
    if (dashParts.length === 3) {
      const [year, month, day] = dashParts.map(Number);
      if (!day || !month || !year) return null;
      return new Date(year, month - 1, day);
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
    return null;
  };

  const formatLiters = (value: number) => (
    new Intl.NumberFormat('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value)
  );

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

  const handleBookExport = async () => {
    if (isBookGenerating) return;
    setIsBookGenerating(true);
    try {
      const allItems: Ticket[] = [];
      let offset = 0;

      while (true) {
        const batch = await fetchTicketsPage({
          limit: exportPageSize,
          offset,
          collectionCenterId: null,
          skipCache: true
        });
        allItems.push(...batch.items);
        offset += exportPageSize;
        if (allItems.length >= batch.total || batch.items.length === 0) break;
      }

      const generators = await fetchGenerators();
      const dispatches = await fetchDispatches({ collectionCenterId: null });
      const vehicles = await fetchVehicles();
      const config = await fetchAppConfiguration();
      const generatorById = new Map(generators.map(g => [g.id, g]));
      const monthLabel = months.find(m => m.value === bookMonth)?.label || bookMonth;
      const monthYearLabel = `${monthLabel} ${bookYear}`;

      let invalidDateCount = 0;
      let outsideMonthCount = 0;
      const filtered = allItems.filter(ticket => {
        const date = parseTicketDate(ticket.date || '');
        if (!date) {
          invalidDateCount += 1;
          return false;
        }
        const match = String(date.getFullYear()) === bookYear
          && String(date.getMonth() + 1).padStart(2, '0') === bookMonth;
        if (!match) outsideMonthCount += 1;
        return match;
      });

      filtered.sort((a, b) => parseDateValue(a.date || '') - parseDateValue(b.date || ''));

      const filteredDispatches = dispatches.filter(dispatch => {
        const date = parseTicketDate(dispatch.date || '');
        if (!date) return false;
        return String(date.getFullYear()) === bookYear && String(date.getMonth() + 1).padStart(2, '0') === bookMonth;
      });

      filteredDispatches.sort((a, b) => parseDateValue(a.date || '') - parseDateValue(b.date || ''));

      const totalLiters = filtered.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
      const totalLitersLabel = formatLiters(totalLiters);

      const centerTotals = new Map<string, { name: string; liters: number; count: number }>();
      filtered.forEach(ticket => {
        const centerId = ticket.collectionCenterId || 'Sin centro';
        const centerName = centers.find(c => c.id === ticket.collectionCenterId)?.name || centerId;
        const current = centerTotals.get(centerId) || { name: centerName, liters: 0, count: 0 };
        current.liters += Number(ticket.quantity || 0);
        current.count += 1;
        centerTotals.set(centerId, current);
      });

      const centerRows = Array.from(centerTotals.values())
        .sort((a, b) => b.liters - a.liters)
        .map(row => `
          <tr>
            <td>${row.name}</td>
            <td class="num">${row.count}</td>
            <td class="num">${formatLiters(row.liters)}</td>
          </tr>
        `)
        .join('');

      const centerTableBody = centerRows || `
        <tr>
          <td colspan="3" class="empty">Sin datos para el mes seleccionado.</td>
        </tr>
      `;

      const rowsHtml = filtered.map(ticket => {
        const generator = generatorById.get(ticket.generatorId);
        const sector = generator?.sector || '';
        return `
          <tr>
            <td>${ticket.ticketNumber || ''}</td>
            <td>${ticket.date || ''}</td>
            <td>${ticket.generatorName || ''}</td>
            <td>${sector}</td>
            <td class="num">${formatLiters(Number(ticket.quantity || 0))}</td>
            <td>${ticket.collectorName || ''}</td>
          </tr>
        `;
      }).join('');

      const tableBody = rowsHtml || `
        <tr>
          <td colspan="5" class="empty">Sin registros para el mes seleccionado.</td>
        </tr>
      `;

      const dispatchRowsHtml = filteredDispatches.map(dispatch => `
        <tr>
          <td>${dispatch.date || ''}</td>
          <td>${dispatch.description || ''}</td>
          <td>${dispatch.presentation || ''}</td>
          <td class="num">${formatLiters(Number(dispatch.dispatchedQuantity || 0))}</td>
          <td>${dispatch.destinationName || ''}</td>
          <td>${dispatch.vehiclePlate || ''}</td>
          <td>${dispatch.driverName || ''}</td>
        </tr>
      `).join('');

      const dispatchTableBody = dispatchRowsHtml || `
        <tr>
          <td colspan="7" class="empty">Sin salidas registradas para el mes seleccionado.</td>
        </tr>
      `;

      const dispatchTotalLiters = filteredDispatches.reduce((sum, d) => sum + Number(d.dispatchedQuantity || 0), 0);
      const dispatchTotalLitersLabel = formatLiters(dispatchTotalLiters);

      const centerId = config.collectionCenterId
        || filtered[0]?.collectionCenterId
        || allItems[0]?.collectionCenterId
        || null;
      const activeCenter = centerId ? centers.find(c => c.id === centerId) : null;
      const centerLabel = activeCenter
        ? `${activeCenter.name}${activeCenter.address ? `, ${activeCenter.address}` : ''}`
        : 'Centro de acopio no definido';

      let jefeName = 'No definido';
      let jefeCedula = '';
      if (centerId) {
        const members = await fetchCollectionCenterMembers(centerId);
        const jefe = members.find(m => /jefe|operaciones/i.test(m.role || ''))
          || members.find(m => /coordinador/i.test(m.role || ''))
          || members[0];
        if (jefe?.fullName) jefeName = jefe.fullName;
        if (jefe?.cedula) jefeCedula = jefe.cedula;
      }
      const jefeLabel = jefeCedula ? `${jefeName} (C.I. ${jefeCedula})` : jefeName;

      const vehiclesForCenter = centerId ? vehicles.filter(v => v.collectionCenterId === centerId) : vehicles;
      const defaultVehicle = vehiclesForCenter.find(v => v.isDefault) || vehiclesForCenter[0];
      const vehicleLabel = defaultVehicle
        ? `${defaultVehicle.brand || ''} ${defaultVehicle.model || ''}`.trim()
        : 'No definida';
      const vehiclePlate = defaultVehicle?.plate || 'No definida';

      const reportHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Libro de Control - ${monthYearLabel}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: 'Arial', sans-serif; color: #111827; }
            .page { position: relative; min-height: 100vh; padding: 96px 64px 56px; display: flex; flex-direction: column; justify-content: flex-start; }
            .page.cover { justify-content: center; text-align: center; padding-top: 140px; }
            .logo { position: absolute; top: 24px; left: 56px; width: 140px; height: auto; display: block; z-index: 2; }
            .folio { position: absolute; top: 32px; right: 56px; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; }
            .page h1, .page h2 { margin-top: 0; }
            h1 { font-size: 22px; margin: 0 0 18px; text-transform: uppercase; }
            h2 { font-size: 18px; margin: 0 0 16px; text-transform: uppercase; }
            p { margin: 6px 0; font-size: 14px; line-height: 1.4; }
            .center { text-align: center; }
            .block { margin-top: 24px; }
            .label { font-weight: 700; }
            .next-folio { margin-top: 18px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f8fafc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            td.num { text-align: right; }
            .empty { text-align: center; font-style: italic; padding: 18px; }
            @media print {
              body { margin: 0; }
              .page { page-break-after: always; }
              .page:last-child { page-break-after: auto; }
              .logo { visibility: visible; }
            }
          </style>
        </head>
        <body>
          <section class="page cover">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 00</div>
            <h1>LIBRO DE CONTROL DE ENTRADAS Y SALIDAS DE MATERIALES APROVECHABLES</h1>
            <p class="center">EMPRESA: Alternativa Verde 2023, C.A.</p>
            <p class="center">RIF: J-50470892-5</p>
            <p class="center">CENTRO DE ACOPIO: ${centerLabel}</p>
            <p class="center">REGISTRO ReNMA: 03-05-T-Ac-2024-398.</p>
            <p class="next-folio">Folio siguiente: FOLIO 01: IDENTIFICACIÓN DE OPERACIONES REGIONALES</p>
          </section>

          <section class="page">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 01</div>
            <h2 class="center">IDENTIFICACIÓN DE OPERACIONES REGIONALES</h2>
            <div class="block">
              <p><span class="label">Jefe de Operaciones:</span> ${jefeLabel}.</p>
              <p><span class="label">Unidad de Transporte Autorizada:</span> ${vehicleLabel}, Placa ${vehiclePlate}.</p>
            </div>
            <p class="next-folio">Folio siguiente: BITÁCORA DE ENTRADAS (RECOLECCIÓN ${monthYearLabel})</p>
          </section>

          <section class="page">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 02</div>
            <h2 class="center">BITÁCORA DE ENTRADAS (RECOLECCIÓN ${monthYearLabel})</h2>
            <p>Este registro detalla los ${totalLitersLabel} litros recolectados en el período reportado.</p>
            <table>
              <thead>
                <tr>
                  <th>Codigo Ticket</th>
                  <th>Fecha</th>
                  <th>Generador / Establecimiento</th>
                  <th>Sector</th>
                  <th>Cantidad (Lts)</th>
                  <th>Recolector</th>
                </tr>
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>
            <p class="next-folio">Folio siguiente: BITÁCORA DE SALIDAS (DESPACHO ${monthYearLabel})</p>
          </section>

          <section class="page">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 03</div>
            <h2 class="center">BITÁCORA DE SALIDAS (DESPACHO ${monthYearLabel})</h2>
            <p>Este registro detalla los ${dispatchTotalLitersLabel} litros despachados en el período reportado.</p>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Presentación</th>
                  <th>Cantidad (Lts)</th>
                  <th>Destino</th>
                  <th>Placa</th>
                  <th>Chofer</th>
                </tr>
              </thead>
              <tbody>
                ${dispatchTableBody}
              </tbody>
            </table>
            <p class="next-folio">Folio siguiente: ESPECIFICACIONES TÉCNICAS Y CIERRE MENSUAL</p>
          </section>

          <section class="page">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 04</div>
            <h2 class="center">ESPECIFICACIONES TÉCNICAS Y CIERRE MENSUAL</h2>
            <div class="block">
              <p><span class="label">Total Consolidado ${monthYearLabel}:</span> ${totalLitersLabel} Litros.</p>
              <p><span class="label">Total Salidas ${monthYearLabel}:</span> ${dispatchTotalLitersLabel} Litros.</p>
              <p><span class="label">Propiedades del Material:</span> Según Reporte REVEEX N° 36.940.</p>
              <p><span class="label">Humedad:</span> 0.180%.</p>
              <p><span class="label">Acidez:</span> 4.28.</p>
              <p><span class="label">Índice de Peróxido:</span> 3.18 meq/kg.</p>
              <p><span class="label">Clasificación NFPA 704:</span> Salud: 0; Inflamabilidad: 1; Reactividad: 0.</p>
              <p><span class="label">Validado por:</span> ${jefeName}</p>
              <p><span class="label">Sello:</span> Alternativa Verde 2023, C.A.</p>
            </div>
          </section>

          <section class="page">
            <img class="logo" src="${LOGO_URL}" alt="Logo" />
            <div class="folio">FOLIO 05</div>
            <h2 class="center">DIAGNOSTICO DE VOLUMEN ${monthYearLabel}</h2>
            <p><span class="label">Tickets totales cargados:</span> ${allItems.length}</p>
            <p><span class="label">Tickets del mes:</span> ${filtered.length}</p>
            <!-- <p><span class="label">Tickets fuera del mes:</span> ${outsideMonthCount}</p>
            <p><span class="label">Tickets con fecha invalida:</span> ${invalidDateCount}</p> -->
            <table>
              <thead>
                <tr>
                  <th>Centro de Acopio</th>
                  <th>Tickets</th>
                  <th>Litros</th>
                </tr>
              </thead>
              <tbody>
                ${centerTableBody}
              </tbody>
            </table>
          </section>
          <script>
            window.addEventListener('load', function () {
              const images = Array.from(document.images);
              if (!images.length) {
                window.focus();
                window.print();
                return;
              }
              let loaded = 0;
              const done = function () {
                window.focus();
                window.print();
              };
              images.forEach(function (img) {
                if (img.complete) {
                  loaded += 1;
                  if (loaded === images.length) done();
                  return;
                }
                img.onload = function () {
                  loaded += 1;
                  if (loaded === images.length) done();
                };
                img.onerror = function () {
                  loaded += 1;
                  if (loaded === images.length) done();
                };
              });
            });
          </script>
        </body>
        </html>
      `;

      const popup = window.open('', '_blank', 'width=1024,height=768');
      if (!popup) {
        alert('Permite las ventanas emergentes para generar el libro.');
        return;
      }
      popup.document.open();
      popup.document.write(reportHtml);
      popup.document.close();
      popup.focus();
    } finally {
      setIsBookGenerating(false);
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
        <button
          onClick={handleBookExport}
          disabled={isBookGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          {isBookGenerating ? 'Generando...' : 'Libro de Control'}
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
          <select
            className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={bookMonth}
            onChange={(e) => setBookMonth(e.target.value)}
            aria-label="Mes del libro"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
          <select
            className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={bookYear}
            onChange={(e) => setBookYear(e.target.value)}
            aria-label="Año del libro"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
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
