
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Package, Droplet, 
  ArrowUpRight, Plus
} from 'lucide-react';
import { fetchDashboardSummaryWithFilters, fetchCollectionCenters, fetchAppConfiguration, putAppConfiguration, fetchGenerators, fetchReportTicketsWithFilters } from '../utils/database';
import { AppConfiguration, CollectionCenter, Generator, Ticket } from '../types';
import { LOGO_URL } from '../constants';

const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalGens, setTotalGens] = useState(0);
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalDispatched, setTotalDispatched] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; litersIn: number; litersOut: number }[]>([]);
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [config, setConfig] = useState<AppConfiguration>({ collectionCenterId: null });
  const [changingCenter, setChangingCenter] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterGeneratorId, setFilterGeneratorId] = useState('');

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, index) => String(currentYear - 3 + index));

  const toApiDate = (dateValue: string) => {
    if (!dateValue) return '';
    const [year, month, day] = dateValue.split('-');
    if (!year || !month || !day) return '';
    return `${day}/${month}/${year}`;
  };

  const loadSummary = async () => {
    const summary = await fetchDashboardSummaryWithFilters({
      dateFrom: toApiDate(filterDateFrom),
      dateTo: toApiDate(filterDateTo),
      month: filterMonth ? Number.parseInt(filterMonth, 10) : null,
      year: filterYear ? Number.parseInt(filterYear, 10) : null,
      generatorId: filterGeneratorId || ''
    });
    setTickets(summary.lastFive);
    setTotalGens(summary.totalGens);
    setTotalLiters(summary.totalLiters);
    setTotalDispatched(summary.totalDispatched || 0);
    setTicketCount(summary.ticketCount);
    setChartData(summary.chartData);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [summary, centersData, configData, generatorsData] = await Promise.all([
        fetchDashboardSummaryWithFilters({}),
        fetchCollectionCenters(),
        fetchAppConfiguration(),
        fetchGenerators()
      ]);
      if (!mounted) return;
      setTickets(summary.lastFive);
      setTotalGens(summary.totalGens);
      setTotalLiters(summary.totalLiters);
      setTotalDispatched(summary.totalDispatched || 0);
      setTicketCount(summary.ticketCount);
      setChartData(summary.chartData);
      setCenters(centersData);
      setConfig(configData);
      setGenerators(generatorsData);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const summary = await fetchDashboardSummaryWithFilters({
        dateFrom: toApiDate(filterDateFrom),
        dateTo: toApiDate(filterDateTo),
        month: filterMonth ? Number.parseInt(filterMonth, 10) : null,
        year: filterYear ? Number.parseInt(filterYear, 10) : null,
        generatorId: filterGeneratorId || ''
      });
      if (!mounted) return;
      setTickets(summary.lastFive);
      setTotalGens(summary.totalGens);
      setTotalLiters(summary.totalLiters);
      setTotalDispatched(summary.totalDispatched || 0);
      setTicketCount(summary.ticketCount);
      setChartData(summary.chartData);
    })();
    return () => { mounted = false; };
  }, [filterDateFrom, filterDateTo, filterMonth, filterYear, filterGeneratorId]);

  const handleReport = async () => {
    if (!filterGeneratorId) {
      alert('Seleccione un generador para generar el acta.');
      return;
    }
    if (!filterMonth || !filterYear) {
      alert('Seleccione mes y año para generar el acta.');
      return;
    }

    const ticketsData = await fetchReportTicketsWithFilters({
      dateFrom: toApiDate(filterDateFrom),
      dateTo: toApiDate(filterDateTo),
      month: Number.parseInt(filterMonth, 10),
      year: Number.parseInt(filterYear, 10),
      generatorId: filterGeneratorId
    });

    const selectedGenerator = generators.find(g => g.id === filterGeneratorId);
    const generatorName = selectedGenerator?.name || '---';
    const generatorRif = selectedGenerator?.rif || '---';
    const collectionMode = selectedGenerator?.collectionMode || '';
    const totalVolume = ticketsData.reduce((acc, t) => acc + Number(t.quantity || 0), 0);
    const ticketNumbersList = ticketsData.map(t => t.ticketNumber).filter(Boolean);
    const ticketNumbersText = ticketNumbersList.join(', ');
    const monthLabel = months.find(m => m.value === filterMonth)?.label || '';
    const activeCenter = centers.find(c => c.id === (config.collectionCenterId || ''));
    const centerState = activeCenter?.state || '__________';
    const printDate = new Date();
    const printDay = printDate.getDate();
    const printMonthLabel = months.find(m => m.value === String(printDate.getMonth() + 1))?.label || '';
    const printYear = printDate.getFullYear();

    const modeOptions = ['Semanal', 'Quincenal', 'Mensual', 'Fortuito', 'Otro'];
    const modeLine = modeOptions.map(mode => `[${collectionMode === mode ? 'x' : ' '}] ${mode}`).join('   ');

    const logoSrc = new URL(LOGO_URL, window.location.href).href;
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Acta AVU</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; padding-top: 16px; }
      .header { display: flex; align-items: center; justify-content: space-between; }
      .logo { width: 140px; height: auto; }
      .title { text-align: center; font-size: 15px; font-weight: 700; margin: 18px 0 6px; }
      .subtitle { text-align: center; font-size: 11px; font-weight: 700; }
      .section-title { font-weight: 700; margin-top: 12px; font-size: 12px; }
      .text { font-size: 12px; line-height: 1.5; }
      .bullets { margin: 10px 0 0 18px; font-size: 12px; }
      .signature { display: flex; justify-content: space-between; margin-top: 36px; font-size: 12px; }
      .signature .block { width: 45%; }
      .footnote { font-size: 11px; margin-top: 12px; }
      @media print {
        body { padding-top: 60px; }
        .header { min-height: 60px; }
        .logo { position: fixed; top: 16px; left: 16px; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img id="report-logo" class="logo" src="${logoSrc}" alt="Logo" />
      <!-- <div class="text" style="text-align:right;">
        <strong>ALTERNATIVA VERDE 2023 C.A.</strong><br />
        RIF: J-50470892-5
      </div> -->
    </div>

    <div class="title">ACTA DE CONFIRMACIÓN DE SERVICIO Y DISPOSICIÓN FINAL DE RESIDUOS AVU</div>
    <div class="subtitle">ALTERNATIVA VERDE 2023, C.A. RIF: J-50470892-5 PROVIDENCIA MINEC N° 102</div>

    <p class="text">
      Quien suscribe, en representación del establecimiento comercial <strong>${generatorName}</strong>, identificado con el RIF <strong>${generatorRif}</strong>,
      hace constar mediante la presente la validación del servicio de recolección de Aceite Vegetal Usado (AVU) ejecutado por la empresa
      <strong>ALTERNATIVA VERDE 2023, C.A.</strong> durante el período correspondiente al mes de <strong>${monthLabel.toUpperCase()}</strong> de <strong>${filterYear}</strong>.
    </p>

    <div class="section-title">DETALLE DE RECEPCIÓN CONSOLIDADA:</div>
    <ul class="bullets">
      <li><strong>Volumen Total Retirado:</strong> <span style="font-size: 14px; font-weight: 700;">${totalVolume.toLocaleString()} Litros.</span></li>
      <li><strong>Soportes de Campo:</strong> Corresponde a los Tickets de Recolección: ${ticketNumbersText || 'Sin tickets'}</li>
    </ul>

    <ul class="bullets" style="margin-top: 14px;">
      <li><strong>Frecuencia de Retiro:</strong> ${modeLine}</li>
    </ul>

    <div class="section-title">DECLARACIÓN DE CONFORMIDAD:</div>
    <p class="text">
      El Generador declara que el material entregado es un residuo de origen vegetal, libre de contaminantes químicos, y reconoce que la empresa recolectora
      posee los permisos nacionales vigentes (MINEC / SACS) para su custodia técnica y aprovechamiento industrial. Esta validación se emite a los fines de dar
      cumplimiento a los protocolos de trazabilidad y auditoría ambiental exigidos por los entes rectores.
    </p>

    <p class="text">Se firma conforme en el estado ${centerState}, a los ${printDay} días del mes de ${printMonthLabel} de ${printYear}.</p>

    <div class="signature">
      <div class="block">
        <strong>POR EL GENERADOR</strong>
        <div style="margin-top: 18px;">__________________________</div>
      </div>
      <div class="block" style="text-align:right;">
        <strong>POR ALTERNATIVA VERDE 2023</strong>
        <div style="margin-top: 18px;">__________________________</div>
      </div>
    </div>
    <script>
      const img = document.getElementById('report-logo');
      const triggerPrint = () => setTimeout(() => window.print(), 200);
      if (img) {
        if (img.complete) {
          triggerPrint();
        } else {
          img.onload = triggerPrint;
          img.onerror = triggerPrint;
        }
      } else {
        triggerPrint();
      }
    </script>
  </body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const handleCenterChange = async (centerId: string) => {
    setChangingCenter(true);
    const updated = await putAppConfiguration({ collectionCenterId: centerId || null });
    setConfig(updated);
    const generatorsData = await fetchGenerators();
    setGenerators(generatorsData);
    setFilterGeneratorId('');
    await loadSummary();
    setChangingCenter(false);
  };

  const showDispatches = !filterGeneratorId;
  const stats = [
    { label: 'Total Recolectado', value: `${totalLiters.toLocaleString()} Lts`, icon: Droplet, color: 'emerald', trend: '+12%' },
    { label: 'Clientes Activos', value: totalGens, icon: Users, color: 'blue', trend: '+3' },
    { label: 'Tickets Emitidos', value: ticketCount, icon: Package, color: 'indigo', trend: '+8%' },
    ...(showDispatches ? [
      { label: 'Total Despachado', value: `${totalDispatched.toLocaleString()} Lts`, icon: TrendingUp, color: 'amber', trend: 'En curso' }
    ] : [])
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={LOGO_URL} 
            alt="Logo" 
            className="w-16 h-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 brand-font">
               Alternativa Verde Dashboard
            </h1>
            <p className="text-slate-500">Sistema de Gestión de Recolección de AVU - Ciclo 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-64">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Centro de Acopio Activo</label>
            <select
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg"
              value={config.collectionCenterId || ''}
              onChange={(e) => handleCenterChange(e.target.value)}
              disabled={changingCenter}
            >
              <option value="">-- Seleccione centro --</option>
              {centers.filter(c => c.isActive !== false).map(center => (
                <option key={center.id} value={center.id}>{center.name} ({center.city})</option>
              ))}
            </select>
          </div>
          <Link 
            to="/new-ticket"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Ticket
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
            <input
              type="date"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
            <input
              type="date"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">Todos</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Año</label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Todos</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Generador</label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={filterGeneratorId}
              onChange={(e) => setFilterGeneratorId(e.target.value)}
            >
              <option value="">Todos</option>
              {generators.sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              onClick={() => {
                setFilterDateFrom('');
                setFilterDateTo('');
                setFilterMonth('');
                setFilterYear('');
                setFilterGeneratorId('');
              }}
            >
              Limpiar filtros
            </button>
          </div>

          <div>
            <button
              className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              onClick={handleReport}
            >
              Generar acta
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Volumen de Recolección (Lts)</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Legend verticalAlign="top" height={24} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="litersIn" name="Entrada" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
                {showDispatches && (
                  <Area type="monotone" dataKey="litersOut" name="Salida" stroke="#f97316" strokeWidth={3} fillOpacity={0} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Últimos Tickets</h3>
          </div>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  {ticket.quantity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{ticket.generatorName}</p>
                  <p className="text-xs text-slate-500">{ticket.date} • {ticket.ticketNumber}</p>
                </div>
                <Link to={`/print/${ticket.id}`} className="p-2 text-slate-400 hover:text-emerald-600">
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
