
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft } from 'lucide-react';
import { fetchGenerators, fetchTicketById } from '../utils/database';
import { Ticket, Generator, MaterialState } from '../types';
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_ADDRESS, COMPANY_RIF, DECLARATION_TEXT, LOGO_URL } from '../constants';

const TicketPrintView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [generator, setGenerator] = useState<Generator | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const t = await fetchTicketById(id);
      if (!mounted) return;
      setTicket(t);
      if (t) {
        const g = await fetchGenerators();
        const found = g.find(x => x.id === t.generatorId) || null;
        if (!mounted) return;
        setGenerator(found);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (!ticket || !generator) return <div>Cargando ticket...</div>;

  const ticketCode = ticket.ticketNumber || 'CÓDIGO NO DISPONIBLE';

  const handlePrint = () => {
    window.print();
  };

  const TicketCard = ({ label }: { label: string }) => (
    <div className="w-[450px] bg-white border border-slate-300 shadow-sm p-4 text-[11px] leading-tight relative overflow-hidden flex flex-col print:border-slate-800 print:shadow-none print:w-auto print:max-w-none ticket-print">
      {/* Header Logo and Text */}
      <div className="relative flex items-center gap-4 mb-4 border-b pb-3 border-slate-100 print:border-slate-300">
        <img 
          src={LOGO_URL} 
          alt="Alternativa Verde Logo" 
          className="w-28 h-auto"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight uppercase">
            
          </h1>
          <h1 className="text-lg font-bold text-[#144b2f] leading-none tracking-tight uppercase">
             <span className="text-slate-900 text-[10px] align-top"></span>
          </h1>
          <p className="text-[10px] font-bold text-slate-800 mt-1">
            
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-extrabold text-[#144b2f] leading-none uppercase">Ticket de Recepción</h2>
          <span className="text-base font-extrabold text-slate-800 leading-none uppercase">de Material</span>
        </div>
        <div className="border-2 border-slate-800 rounded px-2 py-1 bg-slate-50 print:bg-white">
          <span className="font-bold text-slate-800 text-sm">Código: {ticketCode}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3 flex-1">
        {/* Generador */}
        <div>
          <div className="bg-[#0c2a47] text-white px-2 py-0.5 rounded-t-md flex items-center gap-1 font-bold print:bg-[#0c2a47] print:text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            DATOS DEL GENERADOR
          </div>
          <div className="border border-[#0c2a47] p-2 bg-[#f0f4f8] space-y-1 print:bg-slate-50">
            <p><span className="font-bold text-slate-700">Nombre/Razón Social:</span> <span className="border-b border-slate-400 flex-1 inline-block min-w-[200px] pl-1 font-mono text-black">{generator.name}</span></p>
            <div className="flex gap-4">
              <p className="flex-1"><span className="font-bold text-slate-700">RIF:</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[100px] font-mono text-black">{generator.rif}</span></p>
              <p className="flex-1"><span className="font-bold text-slate-700">Teléfono:</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[100px] font-mono text-black">{generator.phone}</span></p>
            </div>
            <p><span className="font-bold text-slate-700">Dirección:</span> <span className="border-b border-slate-400 flex-1 inline-block min-w-[200px] pl-1 font-mono text-black">{generator.address}</span></p>
          </div>
        </div>

        {/* Carga */}
        <div>
          <div className="bg-[#0c2a47] text-white px-2 py-0.5 rounded-t-md flex items-center gap-1 font-bold print:bg-[#0c2a47] print:text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            DATOS DE LA CARGA
          </div>
          <div className="border border-[#0c2a47] p-2 bg-[#f0f4f8] space-y-1 print:bg-slate-50">
            <p><span className="font-bold text-slate-700">Código de Ticket:</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[220px] font-mono text-black">{ticketCode}</span></p>
            <p><span className="font-bold text-slate-700">Tipo de Material:</span> <span className="border-b border-slate-400 flex-1 inline-block min-w-[200px] pl-1 font-mono text-black">{ticket.materialType}</span></p>
            <p><span className="font-bold text-slate-700">Cantidad Recolectada:</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[100px] font-mono font-bold text-lg text-black">{ticket.quantity}</span> <span className="font-bold">Litros.</span></p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Estado del Material:</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1 font-mono text-black">[ {ticket.materialState === MaterialState.FILTRADO ? 'X' : ' '} ] Filtrado</span>
                <span className="flex items-center gap-1 font-mono text-black">[ {ticket.materialState === MaterialState.BRUTO ? 'X' : ' '} ] Bruto</span>
                <span className="flex items-center gap-1 font-mono text-black">[ {ticket.materialState === MaterialState.MEZCLA ? 'X' : ' '} ] Mezcla</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logistica */}
        <div>
          <div className="bg-[#0c2a47] text-white px-2 py-0.5 rounded-t-md flex items-center gap-1 font-bold print:bg-[#0c2a47] print:text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            DATOS DE LOGÍSTICA
          </div>
          <div className="border border-[#0c2a47] p-2 bg-[#f0f4f8] space-y-1 print:bg-slate-50">
            <p><span className="font-bold text-slate-700">Nombre del Recolector:</span> <span className="border-b border-slate-400 flex-1 inline-block min-w-[200px] pl-1 font-mono text-black">{ticket.collectorName}</span></p>
            <div className="flex gap-4">
              <p className="flex-1"><span className="font-bold text-slate-700">Vehículo (Placa):</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[100px] font-mono text-black">{ticket.vehiclePlate}</span></p>
              <p className="flex-1"><span className="font-bold text-slate-700">Fecha:</span> <span className="border-b border-slate-400 pl-1 inline-block min-w-[100px] font-mono text-black">{ticket.date}</span></p>
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="bg-[#fff9e6] border border-slate-300 rounded p-2 text-[9px] text-justify font-medium text-slate-800 leading-tight italic print:bg-[#fff9e6]">
          {DECLARATION_TEXT}
        </div>

        {/* Signatures */}
        <div className="flex justify-between gap-8 pt-8 pb-2">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full border-t border-slate-800 pt-1 text-center font-bold text-[9px]">
              FIRMA Y SELLO<br/>DEL CLIENTE
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full border-t border-slate-800 pt-1 text-center font-bold text-[9px]">
              FIRMA DEL<br/>RECOLECTOR
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-end text-[8.5px] text-slate-600">
        <div className="max-w-[220px]">
          <p className="font-bold text-slate-800">{COMPANY_NAME}</p>
          <p>{COMPANY_ADDRESS}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#144b2f]">{COMPANY_EMAIL}</p>
          <p className="text-[7px] text-slate-400 uppercase mt-1">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 print:pb-0 print:w-full print:max-w-none">
      <div className="no-print flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button 
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver al Historial
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200">
            <Printer className="w-5 h-5" />
            Imprimir Ticket
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-start overflow-x-auto tickets-print-container">
        <div>
          <TicketCard label="ORIGINAL: CLIENTE" />
        </div>
        <div>
          <TicketCard label="COPIA: ADMINISTRACIÓN" />
        </div>
      </div>

      <div className="no-print mt-12 p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex gap-3">
        <div className="bg-emerald-100 p-2 rounded-full h-fit">✓</div>
        <p>
          Vista previa generada. Utilice el botón <strong>Imprimir Ticket</strong> para generar la versión en papel.
          <br/>Se imprimirán automáticamente dos copias (Original y Copia).
        </p>
      </div>
    </div>
  );
};

export default TicketPrintView;
