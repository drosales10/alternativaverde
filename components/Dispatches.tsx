import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, X, Check, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Dispatch, Vehicle } from '../types';
import { fetchDispatches, postDispatch, putDispatch, deleteDispatchApi, fetchVehicles } from '../utils/database';

const emptyDispatch = (): Dispatch => ({
  id: '',
  date: '',
  description: '',
  presentation: '',
  dispatchedQuantity: 0,
  destinationName: '',
  destinationRif: '',
  destinationAddress: '',
  vehicleId: '',
  driverName: '',
  driverId: '',
  minecGuideNumber: ''
});

const Dispatches: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Dispatch>(emptyDispatch());
  const [sortKey, setSortKey] = useState<'date' | 'description' | 'presentation' | 'quantity' | 'destinationName' | 'destinationRif' | 'destinationAddress' | 'brand' | 'model' | 'plate' | 'driverName' | 'driverId' | 'minecGuideNumber' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [items, vehicleData] = await Promise.all([
        fetchDispatches(),
        fetchVehicles()
      ]);
      if (!mounted) return;
      setDispatches(items);
      setVehicles(vehicleData);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (k: keyof Dispatch, v: string | number) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleAdd = async () => {
    if (!form.date.trim()) return alert('Fecha requerida');
    if (!form.dispatchedQuantity) return alert('Cantidad requerida');
    const id = `disp_${Date.now()}`;
    const newItem: Dispatch = {
      ...form,
      id,
      dispatchedQuantity: Number(form.dispatchedQuantity || 0),
      vehicleId: form.vehicleId || null
    };
    const created = await postDispatch(newItem);
    setDispatches(prev => [created as Dispatch, ...prev]);
    setForm(emptyDispatch());
  };

  const startEdit = (dispatch: Dispatch) => {
    setEditingId(dispatch.id);
    setForm({
      ...dispatch,
      dispatchedQuantity: Number(dispatch.dispatchedQuantity || 0),
      vehicleId: dispatch.vehicleId || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyDispatch());
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const updated = await putDispatch({
      ...form,
      id: editingId,
      dispatchedQuantity: Number(form.dispatchedQuantity || 0),
      vehicleId: form.vehicleId || null
    });
    setDispatches(prev => prev.map(d => (d.id === editingId ? (updated as Dispatch) : d)));
    setEditingId(null);
    setForm(emptyDispatch());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar salida? Esta acción es irreversible.')) return;
    await deleteDispatchApi(id);
    setDispatches(prev => prev.filter(d => d.id !== id));
  };

  const vehicleById = (id?: string | null) => vehicles.find(v => v.id === id);

  const parseDateValue = (value: string) => {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const parts = value.split('/');
    if (parts.length !== 3) return 0;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) return 0;
    return new Date(year, month - 1, day).getTime();
  };

  const sortedDispatches = React.useMemo(() => {
    if (!sortKey) return dispatches;
    const copy = [...dispatches];
    const direction = sortDirection === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      const vehicleA = vehicleById(a.vehicleId);
      const vehicleB = vehicleById(b.vehicleId);
      switch (sortKey) {
        case 'date':
          return direction * (parseDateValue(a.date || '') - parseDateValue(b.date || ''));
        case 'description':
          return direction * (a.description || '').localeCompare(b.description || '', 'es', { sensitivity: 'base' });
        case 'presentation':
          return direction * (a.presentation || '').localeCompare(b.presentation || '', 'es', { sensitivity: 'base' });
        case 'quantity':
          return direction * (Number(a.dispatchedQuantity || 0) - Number(b.dispatchedQuantity || 0));
        case 'destinationName':
          return direction * (a.destinationName || '').localeCompare(b.destinationName || '', 'es', { sensitivity: 'base' });
        case 'destinationRif':
          return direction * (a.destinationRif || '').localeCompare(b.destinationRif || '', 'es', { sensitivity: 'base' });
        case 'destinationAddress':
          return direction * (a.destinationAddress || '').localeCompare(b.destinationAddress || '', 'es', { sensitivity: 'base' });
        case 'brand':
          return direction * ((vehicleA?.brand || a.vehicleBrand || '').localeCompare(vehicleB?.brand || b.vehicleBrand || '', 'es', { sensitivity: 'base' }));
        case 'model':
          return direction * ((vehicleA?.model || a.vehicleModel || '').localeCompare(vehicleB?.model || b.vehicleModel || '', 'es', { sensitivity: 'base' }));
        case 'plate':
          return direction * ((vehicleA?.plate || a.vehiclePlate || '').localeCompare(vehicleB?.plate || b.vehiclePlate || '', 'es', { sensitivity: 'base' }));
        case 'driverName':
          return direction * (a.driverName || '').localeCompare(b.driverName || '', 'es', { sensitivity: 'base' });
        case 'driverId':
          return direction * (a.driverId || '').localeCompare(b.driverId || '', 'es', { sensitivity: 'base' });
        case 'minecGuideNumber':
          return direction * (a.minecGuideNumber || '').localeCompare(b.minecGuideNumber || '', 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
    return copy;
  }, [dispatches, sortKey, sortDirection, vehicles]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const sortLabels: Record<NonNullable<typeof sortKey>, string> = {
    date: 'Fecha',
    description: 'Descripcion',
    presentation: 'Presentacion',
    quantity: 'Cantidad',
    destinationName: 'Destino Razon Social',
    destinationRif: 'Destino RIF',
    destinationAddress: 'Destino Direccion',
    brand: 'Marca',
    model: 'Modelo',
    plate: 'Placa',
    driverName: 'Nombre Chofer',
    driverId: 'Cedula',
    minecGuideNumber: 'Numero Guia MINEC'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Salidas</h1>
          <p className="text-slate-500">Control de despachos AVU</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <input
            type="date"
            className="p-2 border rounded"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
          />
          <input
            className="p-2 border rounded"
            placeholder="Descripcion"
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
          />
          <input
            className="p-2 border rounded"
            placeholder="Presentacion"
            value={form.presentation}
            onChange={e => handleChange('presentation', e.target.value)}
          />
          <input
            type="number"
            className="p-2 border rounded"
            placeholder="Cantidad despacho (lt)"
            value={form.dispatchedQuantity || ''}
            onChange={e => handleChange('dispatchedQuantity', Number(e.target.value))}
          />
          <input
            className="p-2 border rounded"
            placeholder="Destino Razon Social"
            value={form.destinationName}
            onChange={e => handleChange('destinationName', e.target.value)}
          />
          <input
            className="p-2 border rounded"
            placeholder="Destino RIF"
            value={form.destinationRif}
            onChange={e => handleChange('destinationRif', e.target.value)}
          />
          <input
            className="p-2 border rounded md:col-span-2"
            placeholder="Destino Direccion"
            value={form.destinationAddress}
            onChange={e => handleChange('destinationAddress', e.target.value)}
          />
          <select
            className="p-2 border rounded"
            value={form.vehicleId || ''}
            onChange={e => handleChange('vehicleId', e.target.value)}
          >
            <option value="">Vehiculo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
            ))}
          </select>
          <input
            className="p-2 border rounded"
            placeholder="Nombre Chofer"
            value={form.driverName}
            onChange={e => handleChange('driverName', e.target.value)}
          />
          <input
            className="p-2 border rounded"
            placeholder="Cedula"
            value={form.driverId}
            onChange={e => handleChange('driverId', e.target.value)}
          />
          <input
            className="p-2 border rounded"
            placeholder="Numero Guia MINEC"
            value={form.minecGuideNumber}
            onChange={e => handleChange('minecGuideNumber', e.target.value)}
          />
          <div className="flex gap-2">
            {editingId ? (
              <>
                <button onClick={saveEdit} className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2">
                  <Check className="w-4 h-4" />Guardar
                </button>
                <button onClick={cancelEdit} className="px-3 py-2 border rounded flex items-center gap-2">
                  <X className="w-4 h-4" />Cancelar
                </button>
              </>
            ) : (
              <button onClick={handleAdd} className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2">
                <Plus className="w-4 h-4" />Agregar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
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
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('date')} className="flex items-center gap-2">
                  Fecha
                  {sortKey === 'date' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('description')} className="flex items-center gap-2">
                  Descripcion
                  {sortKey === 'description' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('presentation')} className="flex items-center gap-2">
                  Presentacion
                  {sortKey === 'presentation' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('quantity')} className="flex items-center gap-2">
                  Cantidad (lt)
                  {sortKey === 'quantity' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('destinationName')} className="flex items-center gap-2">
                  Destino Razon Social
                  {sortKey === 'destinationName' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('destinationRif')} className="flex items-center gap-2">
                  Destino RIF
                  {sortKey === 'destinationRif' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('destinationAddress')} className="flex items-center gap-2">
                  Destino Direccion
                  {sortKey === 'destinationAddress' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('brand')} className="flex items-center gap-2">
                  Marca
                  {sortKey === 'brand' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('model')} className="flex items-center gap-2">
                  Modelo
                  {sortKey === 'model' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('plate')} className="flex items-center gap-2">
                  Placa
                  {sortKey === 'plate' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('driverName')} className="flex items-center gap-2">
                  Nombre Chofer
                  {sortKey === 'driverName' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('driverId')} className="flex items-center gap-2">
                  Cedula
                  {sortKey === 'driverId' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('minecGuideNumber')} className="flex items-center gap-2">
                  Numero Guia MINEC
                  {sortKey === 'minecGuideNumber' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="p-6 text-center">Cargando...</td></tr>
            ) : dispatches.length === 0 ? (
              <tr><td colSpan={14} className="p-6 text-center">No hay salidas.</td></tr>
            ) : sortedDispatches.map(d => {
              const vehicle = vehicleById(d.vehicleId);
              return (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        type="date"
                        className="p-2 border rounded w-full"
                        value={form.date}
                        onChange={e => handleChange('date', e.target.value)}
                      />
                    ) : d.date}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.description}
                        onChange={e => handleChange('description', e.target.value)}
                      />
                    ) : d.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.presentation}
                        onChange={e => handleChange('presentation', e.target.value)}
                      />
                    ) : d.presentation}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        type="number"
                        className="p-2 border rounded w-full"
                        value={form.dispatchedQuantity || ''}
                        onChange={e => handleChange('dispatchedQuantity', Number(e.target.value))}
                      />
                    ) : d.dispatchedQuantity}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.destinationName}
                        onChange={e => handleChange('destinationName', e.target.value)}
                      />
                    ) : d.destinationName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.destinationRif}
                        onChange={e => handleChange('destinationRif', e.target.value)}
                      />
                    ) : d.destinationRif}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.destinationAddress}
                        onChange={e => handleChange('destinationAddress', e.target.value)}
                      />
                    ) : d.destinationAddress}
                  </td>
                  <td className="px-4 py-3 text-sm">{vehicle?.brand || d.vehicleBrand || ''}</td>
                  <td className="px-4 py-3 text-sm">{vehicle?.model || d.vehicleModel || ''}</td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <select
                        className="p-2 border rounded w-full"
                        value={form.vehicleId || ''}
                        onChange={e => handleChange('vehicleId', e.target.value)}
                      >
                        <option value="">Vehiculo</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                        ))}
                      </select>
                    ) : (vehicle?.plate || d.vehiclePlate || '')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.driverName}
                        onChange={e => handleChange('driverName', e.target.value)}
                      />
                    ) : d.driverName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.driverId}
                        onChange={e => handleChange('driverId', e.target.value)}
                      />
                    ) : d.driverId}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <input
                        className="p-2 border rounded w-full"
                        value={form.minecGuideNumber}
                        onChange={e => handleChange('minecGuideNumber', e.target.value)}
                      />
                    ) : d.minecGuideNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === d.id ? (
                      <>
                        <button onClick={saveEdit} className="px-3 py-1 bg-emerald-600 text-white rounded mr-2">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="px-3 py-1 border rounded mr-2">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(d)} className="px-3 py-1 border rounded mr-2">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="px-3 py-1 border rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dispatches;
