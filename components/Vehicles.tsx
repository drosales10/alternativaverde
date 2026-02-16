import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Check, Star, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { AppConfiguration, CollectionCenter, Vehicle } from '../types';
import { fetchVehicles, postVehicle, putVehicle, deleteVehicleApi, fetchCollectionCenters, fetchAppConfiguration } from '../utils/database';

const emptyVehicle = (): Vehicle => ({
  id: '',
  plate: '',
  brand: '',
  model: '',
  owner: '',
  isDefault: false,
  collectionCenterId: ''
});

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [config, setConfig] = useState<AppConfiguration>({ collectionCenterId: null });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Vehicle>(emptyVehicle());
  const [sortKey, setSortKey] = useState<'plate' | 'brand' | 'model' | 'owner' | 'center' | 'isDefault' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [data, centersData, configData] = await Promise.all([
        fetchVehicles(),
        fetchCollectionCenters(),
        fetchAppConfiguration()
      ]);
      if (!mounted) return;
      setVehicles(data);
      setCenters(centersData);
      setConfig(configData);
      setLoading(false);
      if (!editingId) {
        setForm(prev => ({
          ...prev,
          collectionCenterId: prev.collectionCenterId || configData.collectionCenterId || ''
        }));
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleChange = (k: keyof Vehicle, v: string | boolean) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleAdd = async () => {
    if (!form.plate.trim()) return alert('Placa requerida');
    if (!form.collectionCenterId) return alert('Seleccione un Centro de Acopio.');
    const id = `veh_${Date.now()}`;
    const newVehicle: Vehicle = { ...form, id, plate: form.plate.trim().toUpperCase(), collectionCenterId: form.collectionCenterId };
    const created = await postVehicle(newVehicle);
    const normalized = created as Vehicle;
    setVehicles(prev => {
      const updated = normalized.isDefault ? prev.map(v => ({ ...v, isDefault: false })) : prev;
      return [normalized, ...updated];
    });
    setForm(emptyVehicle());
  };

  const startEdit = (v: Vehicle) => { setEditingId(v.id); setForm(v); };
  const cancelEdit = () => { setEditingId(null); setForm(emptyVehicle()); };

  const saveEdit = async () => {
    if (!editingId) return;
    const updated = await putVehicle({ ...form, plate: form.plate.trim().toUpperCase() });
    setVehicles(prev => {
      const updatedList = prev.map(v => (v.id === editingId ? (updated as Vehicle) : v));
      if (!(updated as Vehicle)?.isDefault) return updatedList;
      return updatedList.map(v => ({ ...v, isDefault: v.id === editingId }));
    });
    setEditingId(null);
    setForm(emptyVehicle());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar vehiculo? Esta accion es irreversible.')) return;
    await deleteVehicleApi(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const resolveCenterName = (centerId: string | null | undefined) => (
    centers.find(c => c.id === centerId)?.name || 'Sin centro'
  );

  const sortedVehicles = React.useMemo(() => {
    if (!sortKey) return vehicles;
    const copy = [...vehicles];
    const direction = sortDirection === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'plate':
          return direction * (a.plate || '').localeCompare(b.plate || '', 'es', { sensitivity: 'base' });
        case 'brand':
          return direction * (a.brand || '').localeCompare(b.brand || '', 'es', { sensitivity: 'base' });
        case 'model':
          return direction * (a.model || '').localeCompare(b.model || '', 'es', { sensitivity: 'base' });
        case 'owner':
          return direction * (a.owner || '').localeCompare(b.owner || '', 'es', { sensitivity: 'base' });
        case 'center':
          return direction * resolveCenterName(a.collectionCenterId).localeCompare(resolveCenterName(b.collectionCenterId), 'es', { sensitivity: 'base' });
        case 'isDefault':
          return direction * ((a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0));
        default:
          return 0;
      }
    });
    return copy;
  }, [vehicles, sortKey, sortDirection, centers]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const sortLabels: Record<NonNullable<typeof sortKey>, string> = {
    plate: 'Placa',
    brand: 'Marca',
    model: 'Modelo',
    owner: 'Propietario',
    center: 'Centro de Acopio',
    isDefault: 'Predeterminado'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Vehiculos</h1>
          <p className="text-slate-500">Gestiona la flota y el vehiculo predeterminado</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
          <input className="col-span-1 p-2 border rounded" placeholder="Placa" value={form.plate} onChange={e => handleChange('plate', e.target.value)} />
          <input className="col-span-2 p-2 border rounded" placeholder="Marca" value={form.brand} onChange={e => handleChange('brand', e.target.value)} />
          <input className="col-span-2 p-2 border rounded" placeholder="Modelo" value={form.model} onChange={e => handleChange('model', e.target.value)} />
          <input className="col-span-1 p-2 border rounded" placeholder="Propietario" value={form.owner} onChange={e => handleChange('owner', e.target.value)} />
          <select
            className="col-span-1 p-2 border rounded"
            value={form.collectionCenterId || ''}
            onChange={e => handleChange('collectionCenterId', e.target.value)}
          >
            <option value="">Centro de Acopio</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>{center.name}</option>
            ))}
          </select>
          <label className="col-span-1 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => handleChange('isDefault', e.target.checked)}
            />
            Predeterminado
          </label>
          <div className="col-span-1 flex gap-2">
            {editingId ? (
              <>
                <button onClick={saveEdit} className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"><Check className="w-4 h-4" />Guardar</button>
                <button onClick={cancelEdit} className="px-3 py-2 border rounded flex items-center gap-2"><X className="w-4 h-4" />Cancelar</button>
              </>
            ) : (
              <button onClick={handleAdd} className="px-3 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"><Plus className="w-4 h-4" />Agregar</button>
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
                <button type="button" onClick={() => toggleSort('owner')} className="flex items-center gap-2">
                  Propietario
                  {sortKey === 'owner' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('center')} className="flex items-center gap-2">
                  Centro de Acopio
                  {sortKey === 'center' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('isDefault')} className="flex items-center gap-2">
                  Predeterminado
                  {sortKey === 'isDefault' ? (
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
              <tr><td colSpan={7} className="p-6 text-center">Cargando...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center">No hay vehiculos.</td></tr>
            ) : sortedVehicles.map(v => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <input className="p-2 border rounded w-full" value={form.plate} onChange={e => handleChange('plate', e.target.value)} />
                  ) : v.plate}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <input className="p-2 border rounded w-full" value={form.brand} onChange={e => handleChange('brand', e.target.value)} />
                  ) : v.brand}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <input className="p-2 border rounded w-full" value={form.model} onChange={e => handleChange('model', e.target.value)} />
                  ) : v.model}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <input className="p-2 border rounded w-full" value={form.owner} onChange={e => handleChange('owner', e.target.value)} />
                  ) : v.owner}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <select
                      className="p-2 border rounded w-full"
                      value={form.collectionCenterId || ''}
                      onChange={e => handleChange('collectionCenterId', e.target.value)}
                    >
                      <option value="">Sin centro</option>
                      {centers.map(center => (
                        <option key={center.id} value={center.id}>{center.name}</option>
                      ))}
                    </select>
                  ) : resolveCenterName(v.collectionCenterId)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={e => handleChange('isDefault', e.target.checked)}
                      />
                      Predeterminado
                    </label>
                  ) : (
                    v.isDefault ? <Star className="w-4 h-4 text-amber-500" /> : <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === v.id ? (
                    <>
                      <button onClick={saveEdit} className="px-3 py-1 bg-emerald-600 text-white rounded mr-2"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="px-3 py-1 border rounded"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(v)} className="px-3 py-1 border rounded mr-2"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="px-3 py-1 border rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vehicles;
