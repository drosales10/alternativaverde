import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Check, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { AppConfiguration, CollectionCenter, Generator } from '../types';
import { fetchGenerators, postGenerator, putGenerator, deleteGeneratorApi, fetchCollectionCenters, fetchAppConfiguration } from '../utils/database';

const emptyGen = (): Generator => ({ id: '', name: '', rif: '', phone: '', address: '', sector: '', collectionMode: '', collectionCenterId: '' });

const collectionModes = ['Semanal', 'Quincenal', 'Mensual', 'Fortuito', 'Otro'];

const Generators: React.FC = () => {
  const [gens, setGens] = useState<Generator[]>([]);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [config, setConfig] = useState<AppConfiguration>({ collectionCenterId: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Generator>(emptyGen());
  const [sortKey, setSortKey] = useState<'name' | 'rif' | 'phone' | 'sector' | 'address' | 'mode' | 'center' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [data, centersData, configData] = await Promise.all([
        fetchGenerators(),
        fetchCollectionCenters(),
        fetchAppConfiguration()
      ]);
      if (!mounted) return;
      setGens(data);
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

  const handleChange = (k: keyof Generator, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAdd = async () => {
    if (!form.name.trim()) return alert('Nombre requerido');
    if (!form.collectionCenterId) return alert('Seleccione un Centro de Acopio.');
    const id = `gen_${Date.now()}`;
    const newGen: Generator = { ...form, id, collectionCenterId: form.collectionCenterId };
    const created = await postGenerator(newGen);
    setGens(prev => [created as Generator, ...prev]);
    setForm(emptyGen());
  };

  const startEdit = (g: Generator) => { setEditingId(g.id); setForm(g); };
  const cancelEdit = () => { setEditingId(null); setForm(emptyGen()); };

  const saveEdit = async () => {
    if (!editingId) return;
    const updated = await putGenerator(form);
    setGens(prev => prev.map(p => p.id === editingId ? (updated as Generator) : p));
    setEditingId(null);
    setForm(emptyGen());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar generador? Esta acción es irreversible.')) return;
    await deleteGeneratorApi(id);
    setGens(prev => prev.filter(g => g.id !== id));
  };

  const resolveCenterName = (centerId: string | null | undefined) => (
    centers.find(c => c.id === centerId)?.name || 'Sin centro'
  );

  const sortedGens = React.useMemo(() => {
    if (!sortKey) return gens;
    const copy = [...gens];
    const direction = sortDirection === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return direction * (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
        case 'rif':
          return direction * (a.rif || '').localeCompare(b.rif || '', 'es', { sensitivity: 'base' });
        case 'phone':
          return direction * (a.phone || '').localeCompare(b.phone || '', 'es', { sensitivity: 'base' });
        case 'sector':
          return direction * (a.sector || '').localeCompare(b.sector || '', 'es', { sensitivity: 'base' });
        case 'address':
          return direction * (a.address || '').localeCompare(b.address || '', 'es', { sensitivity: 'base' });
        case 'mode':
          return direction * (a.collectionMode || '').localeCompare(b.collectionMode || '', 'es', { sensitivity: 'base' });
        case 'center':
          return direction * resolveCenterName(a.collectionCenterId).localeCompare(resolveCenterName(b.collectionCenterId), 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
    return copy;
  }, [gens, sortKey, sortDirection, centers]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const sortLabels: Record<NonNullable<typeof sortKey>, string> = {
    name: 'Nombre',
    rif: 'RIF',
    phone: 'Telefono',
    sector: 'Sector',
    address: 'Direccion',
    mode: 'Modo de recoleccion',
    center: 'Centro de Acopio'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Generadores</h1>
          <p className="text-slate-500">Gestiona clientes (CRUD)</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">
          <input className="col-span-2 p-2 border rounded" placeholder="Nombre" value={form.name} onChange={e => handleChange('name', e.target.value)} />
          <input className="col-span-1 p-2 border rounded" placeholder="RIF" value={form.rif} onChange={e => handleChange('rif', e.target.value)} />
          <input className="col-span-1 p-2 border rounded" placeholder="Teléfono" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
          <input className="col-span-1 p-2 border rounded" placeholder="Sector" value={form.sector} onChange={e => handleChange('sector', e.target.value)} />
          <input className="col-span-1 p-2 border rounded" placeholder="Dirección" value={form.address} onChange={e => handleChange('address', e.target.value)} />
          <select
            className="col-span-1 p-2 border rounded"
            value={form.collectionMode || ''}
            onChange={e => handleChange('collectionMode', e.target.value)}
          >
            <option value="">Modo de recolección</option>
            {collectionModes.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
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
        <table className="w-full min-w-[1200px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-sm font-medium sticky left-0 z-30 bg-slate-50 min-w-[220px]">
                <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-2">
                  Nombre
                  {sortKey === 'name' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('rif')} className="flex items-center gap-2">
                  RIF
                  {sortKey === 'rif' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('phone')} className="flex items-center gap-2">
                  Teléfono
                  {sortKey === 'phone' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('sector')} className="flex items-center gap-2">
                  Sector
                  {sortKey === 'sector' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('address')} className="flex items-center gap-2">
                  Dirección
                  {sortKey === 'address' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-sm font-medium">
                <button type="button" onClick={() => toggleSort('mode')} className="flex items-center gap-2">
                  Modo
                  {sortKey === 'mode' ? (
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
              <th className="px-4 py-3 text-sm font-medium sticky right-0 z-30 bg-slate-50 min-w-[150px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center">Cargando...</td></tr>
            ) : gens.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center">No hay generadores.</td></tr>
            ) : sortedGens.map(g => (
              <tr key={g.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 text-sm sticky left-0 z-20 bg-white group-hover:bg-slate-50 min-w-[220px]">
                  {editingId === g.id ? (
                    <input className="p-2 border rounded w-full" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                  ) : g.name}
                </td>
                <td className="px-4 py-3 text-sm">{editingId === g.id ? <input className="p-2 border rounded w-full" value={form.rif} onChange={e => handleChange('rif', e.target.value)} /> : g.rif}</td>
                <td className="px-4 py-3 text-sm">{editingId === g.id ? <input className="p-2 border rounded w-full" value={form.phone} onChange={e => handleChange('phone', e.target.value)} /> : g.phone}</td>
                <td className="px-4 py-3 text-sm">{editingId === g.id ? <input className="p-2 border rounded w-full" value={form.sector} onChange={e => handleChange('sector', e.target.value)} /> : g.sector}</td>
                <td className="px-4 py-3 text-sm sticky right-0 z-20 bg-white group-hover:bg-slate-50 whitespace-nowrap min-w-[150px]">
                  {editingId === g.id ? (
                    <input className="p-2 border rounded w-full" value={form.address} onChange={e => handleChange('address', e.target.value)} />
                  ) : g.address}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === g.id ? (
                    <select
                      className="p-2 border rounded w-full"
                      value={form.collectionMode || ''}
                      onChange={e => handleChange('collectionMode', e.target.value)}
                    >
                      <option value="">Sin definir</option>
                      {collectionModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  ) : (g.collectionMode || 'Sin definir')}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === g.id ? (
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
                  ) : resolveCenterName(g.collectionCenterId)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === g.id ? (
                    <>
                      <button onClick={saveEdit} className="px-3 py-1 bg-emerald-600 text-white rounded mr-2"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="px-3 py-1 border rounded"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(g)} className="px-3 py-1 border rounded mr-2"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(g.id)} className="px-3 py-1 border rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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

export default Generators;
