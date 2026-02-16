import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Users, Edit, Trash2, X } from 'lucide-react';
import {
  fetchAppConfiguration,
  fetchCollectionCenterMembers,
  fetchCollectionCenters,
  deleteCollectionCenterApi,
  deleteCollectionCenterMemberApi,
  postCollectionCenter,
  postCollectionCenterMember,
  putCollectionCenter,
  putCollectionCenterMember
} from '../utils/database';
import { AppConfiguration, CollectionCenter, CollectionCenterMember } from '../types';
import { LOGO_URL } from '../constants';

const Configuration: React.FC = () => {
  const [centers, setCenters] = useState<CollectionCenter[]>([]);
  const [members, setMembers] = useState<CollectionCenterMember[]>([]);
  const [config, setConfig] = useState<AppConfiguration>({ collectionCenterId: null });
  const [loading, setLoading] = useState(true);
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [newCenter, setNewCenter] = useState({ name: '', state: '', city: '', address: '' });
  const [centerEditForm, setCenterEditForm] = useState({ name: '', state: '', city: '', address: '', isActive: true });
  const [newMember, setNewMember] = useState({ fullName: '', phone: '', role: 'Recolector' });

  const activeCenter = useMemo(() => centers.find(c => c.id === config.collectionCenterId) || null, [centers, config.collectionCenterId]);

  const reloadCenters = async () => {
    const [centersData, configData] = await Promise.all([fetchCollectionCenters(), fetchAppConfiguration()]);
    setCenters(centersData);
    setConfig(configData);
  };

  const reloadMembers = async (centerId: string | null) => {
    if (!centerId) {
      setMembers([]);
      return;
    }
    const rows = await fetchCollectionCenterMembers(centerId);
    setMembers(rows.filter(m => m.isActive !== false));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [centersData, configData] = await Promise.all([fetchCollectionCenters(), fetchAppConfiguration()]);
      if (!mounted) return;
      setCenters(centersData);
      setConfig(configData);
      if (configData.collectionCenterId) {
        const rows = await fetchCollectionCenterMembers(configData.collectionCenterId);
        if (!mounted) return;
        setMembers(rows.filter(m => m.isActive !== false));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenter.name.trim()) return;
    const center: CollectionCenter = {
      id: `cc_${Date.now()}`,
      name: newCenter.name.trim(),
      state: newCenter.state.trim(),
      city: newCenter.city.trim(),
      address: newCenter.address.trim(),
      isActive: true
    };
    await postCollectionCenter(center);
    setNewCenter({ name: '', state: '', city: '', address: '' });
    await reloadCenters();
  };

  const handleStartCenterEdit = (center: CollectionCenter) => {
    setEditingCenterId(center.id);
    setCenterEditForm({
      name: center.name,
      state: center.state,
      city: center.city,
      address: center.address,
      isActive: center.isActive
    });
  };

  const handleSaveCenterEdit = async () => {
    if (!editingCenterId) return;
    await putCollectionCenter({
      id: editingCenterId,
      name: centerEditForm.name.trim(),
      state: centerEditForm.state.trim(),
      city: centerEditForm.city.trim(),
      address: centerEditForm.address.trim(),
      isActive: centerEditForm.isActive
    });
    setEditingCenterId(null);
    await reloadCenters();
  };

  const handleDeleteCenter = async (id: string) => {
    if (!confirm('¿Eliminar centro de acopio?')) return;
    await deleteCollectionCenterApi(id);
    await reloadCenters();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.collectionCenterId) {
      alert('Configure primero el centro de acopio.');
      return;
    }
    if (!newMember.fullName.trim()) return;
    const member: CollectionCenterMember = {
      id: `ccm_${Date.now()}`,
      centerId: config.collectionCenterId,
      fullName: newMember.fullName.trim(),
      phone: newMember.phone.trim(),
      role: newMember.role.trim() || 'Recolector',
      isActive: true
    };
    await postCollectionCenterMember(member);
    setNewMember({ fullName: '', phone: '', role: 'Recolector' });
    await reloadMembers(config.collectionCenterId);
  };

  const startEditMember = (member: CollectionCenterMember) => {
    setEditingMemberId(member.id);
    setNewMember({
      fullName: member.fullName,
      phone: member.phone,
      role: member.role
    });
  };

  const saveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.collectionCenterId || !editingMemberId) return;
    await putCollectionCenterMember({
      id: editingMemberId,
      centerId: config.collectionCenterId,
      fullName: newMember.fullName.trim(),
      phone: newMember.phone.trim(),
      role: newMember.role.trim() || 'Recolector',
      isActive: true
    });
    setEditingMemberId(null);
    setNewMember({ fullName: '', phone: '', role: 'Recolector' });
    await reloadMembers(config.collectionCenterId);
  };

  const deleteMember = async (member: CollectionCenterMember) => {
    if (!confirm('¿Eliminar miembro del centro?')) return;
    await deleteCollectionCenterMemberApi(member.id, member.centerId);
    await reloadMembers(config.collectionCenterId);
  };

  const openMembersModal = async () => {
    if (!config.collectionCenterId) {
      alert('Primero debe definir un centro activo desde Dashboard.');
      return;
    }
    await reloadMembers(config.collectionCenterId);
    setIsMembersModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <img src={LOGO_URL} alt="Logo" className="w-14 h-auto" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-500">Gestione el CRUD de centros de acopio y miembros del centro activo.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold border-b pb-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h2>CENTRO DE ACOPIO ACTIVO (SOLO LECTURA)</h2>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando configuración...</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">La activación del centro se realiza en el Dashboard.</p>
            <button
              onClick={openMembersModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Users className="w-4 h-4" />
              Gestionar Miembros (Modal)
            </button>
          </div>
        )}

        {activeCenter && (
          <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="font-semibold text-slate-800">{activeCenter.name}</p>
            <p>{activeCenter.address}</p>
            <p>{activeCenter.city}, {activeCenter.state}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-800">Agregar Centro de Acopio</h2>
          <form className="space-y-3" onSubmit={handleAddCenter}>
            <input
              required
              placeholder="Nombre"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={newCenter.name}
              onChange={(e) => setNewCenter(prev => ({ ...prev, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Estado"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                value={newCenter.state}
                onChange={(e) => setNewCenter(prev => ({ ...prev, state: e.target.value }))}
              />
              <input
                placeholder="Ciudad"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                value={newCenter.city}
                onChange={(e) => setNewCenter(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <input
              placeholder="Dirección"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              value={newCenter.address}
              onChange={(e) => setNewCenter(prev => ({ ...prev, address: e.target.value }))}
            />
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Agregar Centro</button>
          </form>

          <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-left px-3 py-2">Ciudad</th>
                  <th className="text-left px-3 py-2">Dirección</th>
                  <th className="text-left px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {centers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>Sin centros de acopio.</td>
                  </tr>
                ) : centers.map(center => (
                  <tr key={center.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-2">
                      {editingCenterId === center.id ? (
                        <input className="w-full p-2 border rounded" value={centerEditForm.name} onChange={(e) => setCenterEditForm(prev => ({ ...prev, name: e.target.value }))} />
                      ) : center.name}
                    </td>
                    <td className="px-3 py-2">
                      {editingCenterId === center.id ? (
                        <input className="w-full p-2 border rounded" value={centerEditForm.state} onChange={(e) => setCenterEditForm(prev => ({ ...prev, state: e.target.value }))} />
                      ) : center.state}
                    </td>
                    <td className="px-3 py-2">
                      {editingCenterId === center.id ? (
                        <input className="w-full p-2 border rounded" value={centerEditForm.city} onChange={(e) => setCenterEditForm(prev => ({ ...prev, city: e.target.value }))} />
                      ) : center.city}
                    </td>
                    <td className="px-3 py-2">
                      {editingCenterId === center.id ? (
                        <input className="w-full p-2 border rounded" value={centerEditForm.address} onChange={(e) => setCenterEditForm(prev => ({ ...prev, address: e.target.value }))} />
                      ) : center.address}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      {editingCenterId === center.id ? (
                        <>
                          <button onClick={handleSaveCenterEdit} className="px-3 py-1 bg-emerald-600 text-white rounded">Guardar</button>
                          <button onClick={() => setEditingCenterId(null)} className="px-3 py-1 border rounded">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartCenterEdit(center)} className="p-2 border rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCenter(center.id)} className="p-2 border rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">CRUD Miembros - {activeCenter?.name || 'Centro activo'}</h2>
              <button onClick={() => { setIsMembersModalOpen(false); setEditingMemberId(null); setNewMember({ fullName: '', phone: '', role: 'Recolector' }); }} className="p-2 rounded hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <form className="space-y-3" onSubmit={editingMemberId ? saveEditMember : handleAddMember}>
                <input
                  required
                  placeholder="Nombre completo"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  value={newMember.fullName}
                  onChange={(e) => setNewMember(prev => ({ ...prev, fullName: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Teléfono"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <input
                    placeholder="Rol"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                    {editingMemberId ? 'Guardar Miembro' : 'Agregar Miembro'}
                  </button>
                  {editingMemberId && (
                    <button type="button" className="px-4 py-2 border rounded-lg" onClick={() => { setEditingMemberId(null); setNewMember({ fullName: '', phone: '', role: 'Recolector' }); }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2">Nombre</th>
                      <th className="text-left px-3 py-2">Centro de Acopio</th>
                      <th className="text-left px-3 py-2">Rol</th>
                      <th className="text-left px-3 py-2">Teléfono</th>
                      <th className="text-left px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={5}>Sin miembros para el centro activo.</td>
                      </tr>
                    ) : members.map(member => (
                      <tr key={member.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2">{member.fullName}</td>
                        <td className="px-3 py-2">{activeCenter?.name || 'Sin centro'}</td>
                        <td className="px-3 py-2">{member.role}</td>
                        <td className="px-3 py-2">{member.phone}</td>
                        <td className="px-3 py-2 space-x-2">
                          <button onClick={() => startEditMember(member)} className="p-2 border rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteMember(member)} className="p-2 border rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;
