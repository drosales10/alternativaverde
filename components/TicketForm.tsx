
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Truck, Package, Printer } from 'lucide-react';
import { fetchGenerators, postTicket, fetchTicketById, putTicket, fetchVehicles, fetchAppConfiguration, fetchCollectionCenterMembers, fetchCollectionCenters, fetchExpectedTicketNumber } from '../utils/database';
import { Ticket, MaterialState, Generator, Vehicle, AppConfiguration, CollectionCenter, CollectionCenterMember } from '../types';
import { MATERIAL_DESCRIPTION, LOGO_URL } from '../constants';

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [collectionCenters, setCollectionCenters] = useState<CollectionCenter[]>([]);
  const [collectorMembers, setCollectorMembers] = useState<CollectionCenterMember[]>([]);
  const [appConfiguration, setAppConfiguration] = useState<AppConfiguration>({ collectionCenterId: null });
  const [expectedTicketNumber, setExpectedTicketNumber] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    generatorId: '',
    quantity: '',
    materialState: MaterialState.BRUTO,
    collectorMemberId: '',
    collectorName: '',
    vehicleId: '',
    vehiclePlate: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { id } = useParams();
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const displayedTicketCode = editingTicket?.ticketNumber || expectedTicketNumber || 'Se generará al guardar';

  const formatDateForInput = (value: string) => {
    if (!value) return new Date().toISOString().split('T')[0];
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) return [parts[2], parts[1], parts[0]].join('-');
    }
    if (value.includes('-') && value.length >= 10) {
      const parts = value.split('-');
      if (parts.length === 3 && parts[0].length === 2) return [parts[2], parts[1], parts[0]].join('-');
      return value.slice(0, 10);
    }
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const gensPromise = fetchGenerators();
      const vehiclesPromise = fetchVehicles();
      const centersPromise = fetchCollectionCenters();
      const configPromise = fetchAppConfiguration();
      const ticketPromise = id ? fetchTicketById(id) : Promise.resolve(null);

      const [gens, vehiclesData, centers, config, tk] = await Promise.all([gensPromise, vehiclesPromise, centersPromise, configPromise, ticketPromise]);
      if (tk) setEditingTicket(tk);
      if (!mounted) return;
      setGenerators(gens);
      setVehicles(vehiclesData);
      setCollectionCenters(centers);
      setAppConfiguration(config);

      if (config.collectionCenterId) {
        const members = await fetchCollectionCenterMembers(config.collectionCenterId);
        if (!mounted) return;
        setCollectorMembers(members.filter(m => m.isActive !== false));
      } else {
        setCollectorMembers([]);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.generatorId) return alert('Seleccione un generador');
    if (vehicles.length > 0 && !formData.vehicleId) return alert('Seleccione un vehiculo');
    if (!appConfiguration.collectionCenterId) return alert('Debe configurar un centro de acopio en Configuración.');
    if (!formData.collectorMemberId) return alert('Seleccione un recolector.');

    const selectedGen = generators.find(g => g.id === formData.generatorId)!;
    const selectedCollector = collectorMembers.find(m => m.id === formData.collectorMemberId);
    if (!selectedCollector) return alert('Recolector inválido para el centro configurado.');
    if (editingTicket) {
      const updated: Ticket = {
        ...editingTicket,
        date: formData.date.split('-').reverse().join('/'),
        generatorId: selectedGen.id,
        generatorName: selectedGen.name,
        quantity: parseFloat(formData.quantity),
        materialState: formData.materialState,
        collectionCenterId: appConfiguration.collectionCenterId,
        collectorMemberId: selectedCollector.id,
        collectorName: selectedCollector.fullName,
        vehiclePlate: formData.vehiclePlate
      };
      (async () => {
        await putTicket(updated);
        navigate(`/print/${updated.id}`);
      })();
      return;
    }

    const newTicket: Ticket = {
      id: `t_${Date.now()}`,
      ticketNumber: '',
      date: formData.date.split('-').reverse().join('/'),
      generatorId: selectedGen.id,
      generatorName: selectedGen.name,
      materialType: MATERIAL_DESCRIPTION,
      quantity: parseFloat(formData.quantity),
      materialState: formData.materialState,
      collectionCenterId: appConfiguration.collectionCenterId,
      collectorMemberId: selectedCollector.id,
      collectorName: selectedCollector.fullName,
      vehiclePlate: formData.vehiclePlate,
      createdAt: new Date().toISOString()
    };

    (async () => {
      await postTicket(newTicket);
      navigate(`/print/${newTicket.id}`);
    })();
  };

  // When editing ticket loaded, prefill form
  useEffect(() => {
    if (editingTicket) {
      const plate = editingTicket.vehiclePlate?.toUpperCase();
      const matchedVehicle = vehicles.find(v => v.plate?.toUpperCase() === plate);
      setFormData({
        generatorId: editingTicket.generatorId,
        quantity: String(editingTicket.quantity),
        materialState: editingTicket.materialState,
        collectorMemberId: editingTicket.collectorMemberId || '',
        collectorName: editingTicket.collectorName,
        vehicleId: matchedVehicle?.id || '',
        vehiclePlate: editingTicket.vehiclePlate,
        date: formatDateForInput(editingTicket.date)
      });
    }
  }, [editingTicket, vehicles]);

  useEffect(() => {
    if (collectorMembers.length === 0) return;
    if (formData.collectorMemberId) {
      const exists = collectorMembers.some(m => m.id === formData.collectorMemberId);
      if (exists) return;
    }
    const preferred = collectorMembers[0];
    if (!preferred) return;
    setFormData(prev => ({
      ...prev,
      collectorMemberId: preferred.id,
      collectorName: preferred.fullName
    }));
  }, [collectorMembers, formData.collectorMemberId]);

  useEffect(() => {
    if (editingTicket) return;
    if (vehicles.length === 0) return;
    if (formData.vehicleId) return;
    const preferred = vehicles.find(v => v.isDefault) || vehicles[0];
    if (!preferred) return;
    setFormData(prev => ({
      ...prev,
      vehicleId: preferred.id,
      vehiclePlate: preferred.plate
    }));
  }, [vehicles, editingTicket, formData.vehicleId]);

  useEffect(() => {
    if (editingTicket) {
      setExpectedTicketNumber(null);
      return;
    }
    let mounted = true;
    (async () => {
      if (!appConfiguration.collectionCenterId) {
        if (mounted) setExpectedTicketNumber(null);
        return;
      }
      const preview = await fetchExpectedTicketNumber(formData.date, appConfiguration.collectionCenterId);
      if (!mounted) return;
      setExpectedTicketNumber(preview);
    })();
    return () => { mounted = false; };
  }, [editingTicket, formData.date, appConfiguration.collectionCenterId]);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <img src={LOGO_URL} alt="Logo" className="w-14 h-auto" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {editingTicket ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
          </h1>
          <p className="text-slate-500">
            {editingTicket
              ? `Modifique los datos del ticket ${editingTicket.ticketNumber}.`
              : 'Complete los datos de la carga para generar el recibo oficial.'}
          </p>
          {!editingTicket && expectedTicketNumber && (
            <p className="text-sm text-emerald-700 font-semibold mt-1">
              Correlativo esperado: {expectedTicketNumber}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Generator Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h2>DATOS DEL GENERADOR</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Seleccionar Cliente / Generador</label>
              <select
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.generatorId}
                onChange={(e) => setFormData({...formData, generatorId: e.target.value})}
              >
                <option value="">-- Seleccione un generador --</option>
                {generators.sort((a,b) => a.name.localeCompare(b.name)).map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.sector})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Load Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2>DATOS DE LA CARGA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">Código de Ticket (Auto)</label>
              <input
                type="text"
                disabled
                value={displayedTicketCode}
                className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono"
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">Tipo de Material</label>
              <input 
                type="text" 
                disabled 
                value={MATERIAL_DESCRIPTION} 
                className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Cantidad Recolectada (Litros)</label>
              <input
                required
                type="number"
                step="0.1"
                placeholder="Ej. 150"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Estado del Material</label>
              <div className="flex gap-4 p-2.5">
                {Object.values(MaterialState).map(state => (
                  <label key={state} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="materialState"
                      value={state}
                      checked={formData.materialState === state}
                      onChange={() => setFormData({...formData, materialState: state})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">{state}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logistics Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h2>DATOS DE LOGÍSTICA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Recolector</label>
              <select
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                value={formData.collectorMemberId}
                onChange={(e) => {
                  const selected = collectorMembers.find(m => m.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    collectorMemberId: e.target.value,
                    collectorName: selected?.fullName || ''
                  }));
                }}
                disabled={!appConfiguration.collectionCenterId || collectorMembers.length === 0}
              >
                <option value="">-- Seleccione un recolector --</option>
                {collectorMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.fullName} ({member.role})
                  </option>
                ))}
              </select>
              {!appConfiguration.collectionCenterId && (
                <p className="text-xs text-amber-700">Debe configurar el centro de acopio en Configuración.</p>
              )}
            </div>
            {vehicles.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Vehiculo</label>
                <select
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  value={formData.vehicleId}
                  onChange={(e) => {
                    const selected = vehicles.find(v => v.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      vehicleId: e.target.value,
                      vehiclePlate: selected?.plate || ''
                    }));
                  }}
                >
                  <option value="">-- Seleccione un vehiculo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Vehiculo (Placa)</label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Fecha de Recolección</label>
              <input
                required
                type="date"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pb-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Guardar y Ver Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
