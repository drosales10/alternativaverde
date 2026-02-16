import { Ticket, Generator, MaterialState, Vehicle, CollectionCenter, CollectionCenterMember, AppConfiguration, Dispatch } from '../types';
import { RAW_SEED_DATA, MATERIAL_DESCRIPTION } from '../constants';

const API_BASE = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '') : '';

const DB_KEYS = {
  TICKETS: 'av_tickets',
  GENERATORS: 'av_generators',
  VEHICLES: 'av_vehicles',
  DISPATCHES: 'av_dispatches',
  COLLECTION_CENTERS: 'av_collection_centers',
  COLLECTION_CENTER_MEMBERS: 'av_collection_center_members',
  APP_CONFIGURATION: 'av_app_configuration'
};

const CACHE_TTL_MS = 2 * 60 * 1000;
const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const TICKETS_PAGE_CACHE_TTL_MS = 15 * 1000;
let generatorsCache: Generator[] | null = null;
let generatorsCacheAt = 0;
let vehiclesCache: Vehicle[] | null = null;
let vehiclesCacheAt = 0;
const generatorsByCenterCache = new Map<string, { at: number; items: Generator[] }>();
const vehiclesByCenterCache = new Map<string, { at: number; items: Vehicle[] }>();
let collectionCentersCache: CollectionCenter[] | null = null;
let collectionCentersCacheAt = 0;
const collectionCenterMembersCache = new Map<string, { at: number; items: CollectionCenterMember[] }>();
let appConfigurationCache: AppConfiguration | null = null;
let appConfigurationCacheAt = 0;
let dashboardCache: {
  key: string;
  totalLiters: number;
  ticketCount: number;
  totalGens: number;
  lastFive: Ticket[];
  chartData: { date: string; liters: number }[];
} | null = null;
let dashboardCacheAt = 0;
const ticketsPageCache = new Map<string, { at: number; data: { items: Ticket[]; total: number } }>();

const normalizeTicket = (r: any): Ticket => ({
  id: r.id,
  ticketNumber: r.ticket_number || r.ticketNumber,
  date: r.date,
  generatorId: r.generator_id || r.generatorId,
  generatorName: r.generator_name || r.generatorName,
  materialType: r.material_type || r.materialType,
  quantity: r.quantity,
  materialState: r.material_state || r.materialState,
  collectionCenterId: r.collection_center_id || r.collectionCenterId || null,
  collectorMemberId: r.collector_member_id || r.collectorMemberId || null,
  collectorName: r.collector_name || r.collectorName,
  vehiclePlate: r.vehicle_plate || r.vehiclePlate,
  createdAt: r.created_at || r.createdAt
});

const normalizeTickets = (rows: any[]): Ticket[] => rows.map(normalizeTicket);

const normalizeGenerator = (r: any): Generator => ({
  id: r.id,
  name: r.name,
  rif: r.rif || '',
  phone: r.phone || '',
  address: r.address || '',
  sector: r.sector || '',
  collectionMode: r.collection_mode || r.collectionMode || '',
  collectionCenterId: r.collection_center_id || r.collectionCenterId || null
});

const normalizeGenerators = (rows: any[]): Generator[] => rows.map(normalizeGenerator);

const normalizeVehicle = (r: any): Vehicle => ({
  id: r.id,
  plate: r.plate,
  brand: r.brand || '',
  model: r.model || '',
  owner: r.owner || '',
  isDefault: r.is_default ?? r.isDefault ?? false,
  collectionCenterId: r.collection_center_id || r.collectionCenterId || null
});

const normalizeDispatch = (r: any): Dispatch => ({
  id: r.id,
  date: r.date,
  description: r.description || '',
  presentation: r.presentation || '',
  dispatchedQuantity: Number(r.dispatched_quantity ?? r.dispatchedQuantity ?? 0),
  destinationName: r.destination_name || r.destinationName || '',
  destinationRif: r.destination_rif || r.destinationRif || '',
  destinationAddress: r.destination_address || r.destinationAddress || '',
  vehicleId: r.vehicle_id || r.vehicleId || null,
  vehiclePlate: r.vehicle_plate || r.vehiclePlate || '',
  vehicleBrand: r.vehicle_brand || r.vehicleBrand || '',
  vehicleModel: r.vehicle_model || r.vehicleModel || '',
  driverName: r.driver_name || r.driverName || '',
  driverId: r.driver_id || r.driverId || '',
  minecGuideNumber: r.minec_guide_number || r.minecGuideNumber || '',
  collectionCenterId: r.collection_center_id || r.collectionCenterId || null,
  createdAt: r.created_at || r.createdAt
});

const normalizeDispatches = (rows: any[]): Dispatch[] => rows.map(normalizeDispatch);

const normalizeVehicles = (rows: any[]): Vehicle[] => rows.map(normalizeVehicle);

const normalizeCollectionCenter = (r: any): CollectionCenter => ({
  id: r.id,
  name: r.name,
  state: r.state || '',
  city: r.city || '',
  address: r.address || '',
  isActive: r.is_active ?? r.isActive ?? true
});

const normalizeCollectionCenterMember = (r: any): CollectionCenterMember => ({
  id: r.id,
  centerId: r.center_id || r.centerId,
  fullName: r.full_name || r.fullName,
  cedula: r.cedula || r.cedula_id || r.cedulaId || '',
  phone: r.phone || '',
  role: r.role || 'Recolector',
  isActive: r.is_active ?? r.isActive ?? true
});

const normalizeConfiguration = (r: any): AppConfiguration => ({
  collectionCenterId: r.collection_center_id || r.collectionCenterId || null
});

const normalizeCollectionCenters = (rows: any[]): CollectionCenter[] => rows.map(normalizeCollectionCenter);
const normalizeCollectionCenterMembers = (rows: any[]): CollectionCenterMember[] => rows.map(normalizeCollectionCenterMember);

export const getStoredTickets = (): Ticket[] => {
  const data = localStorage.getItem(DB_KEYS.TICKETS);
  return data ? JSON.parse(data) : [];
};

export const getStoredGenerators = (): Generator[] => {
  const data = localStorage.getItem(DB_KEYS.GENERATORS);
  return data ? JSON.parse(data) : [];
};

export const getStoredVehicles = (): Vehicle[] => {
  const data = localStorage.getItem(DB_KEYS.VEHICLES);
  return data ? JSON.parse(data) : [];
};

export const getStoredDispatches = (): Dispatch[] => {
  const data = localStorage.getItem(DB_KEYS.DISPATCHES);
  return data ? JSON.parse(data) : [];
};

export const getStoredCollectionCenters = (): CollectionCenter[] => {
  const data = localStorage.getItem(DB_KEYS.COLLECTION_CENTERS);
  return data ? JSON.parse(data) : [];
};

export const getStoredCollectionCenterMembers = (): CollectionCenterMember[] => {
  const data = localStorage.getItem(DB_KEYS.COLLECTION_CENTER_MEMBERS);
  return data ? JSON.parse(data) : [];
};

export const getStoredAppConfiguration = (): AppConfiguration => {
  const data = localStorage.getItem(DB_KEYS.APP_CONFIGURATION);
  if (data) return JSON.parse(data);
  return { collectionCenterId: null };
};

export const getStoredTicketCount = (): number => getStoredTickets().length;

const resolveActiveCenterId = async (): Promise<string | null> => {
  if (appConfigurationCache && Date.now() - appConfigurationCacheAt < CACHE_TTL_MS) {
    return appConfigurationCache.collectionCenterId;
  }
  try {
    const config = await fetchAppConfiguration();
    return config.collectionCenterId;
  } catch {
    return getStoredAppConfiguration().collectionCenterId;
  }
};

export const fetchGenerators = async (): Promise<Generator[]> => {
  const now = Date.now();
  const centerId = await resolveActiveCenterId();
  const key = centerId || '__all__';
  const byCenterCached = generatorsByCenterCache.get(key);
  if (byCenterCached && now - byCenterCached.at < CACHE_TTL_MS) {
    return byCenterCached.items;
  }
  if (!centerId && generatorsCache && now - generatorsCacheAt < CACHE_TTL_MS) {
    return generatorsCache;
  }
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    const endpoint = query.toString() ? `${API_BASE}/api/generators?${query.toString()}` : `${API_BASE}/api/generators`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch generators failed');
    const data = normalizeGenerators(await res.json());
    generatorsByCenterCache.set(key, { at: now, items: data });
    if (!centerId) {
      generatorsCache = data;
      generatorsCacheAt = now;
    }
    return data;
  } catch (e) {
    const fallback = normalizeGenerators(getStoredGenerators());
    const filtered = centerId ? fallback.filter(g => g.collectionCenterId === centerId) : fallback;
    generatorsByCenterCache.set(key, { at: now, items: filtered });
    if (!centerId) {
      generatorsCache = fallback;
      generatorsCacheAt = now;
    }
    return filtered;
  }
};

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  const now = Date.now();
  const centerId = await resolveActiveCenterId();
  const key = centerId || '__all__';
  const byCenterCached = vehiclesByCenterCache.get(key);
  if (byCenterCached && now - byCenterCached.at < CACHE_TTL_MS) {
    return byCenterCached.items;
  }
  if (!centerId && vehiclesCache && now - vehiclesCacheAt < CACHE_TTL_MS) {
    return vehiclesCache;
  }
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    const endpoint = query.toString() ? `${API_BASE}/api/vehicles?${query.toString()}` : `${API_BASE}/api/vehicles`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch vehicles failed');
    const data = await res.json();
    const normalized = normalizeVehicles(data || []);
    vehiclesByCenterCache.set(key, { at: now, items: normalized });
    if (!centerId) {
      vehiclesCache = normalized;
      vehiclesCacheAt = now;
    }
    return normalized;
  } catch (e) {
    const fallback = normalizeVehicles(getStoredVehicles());
    const filtered = centerId ? fallback.filter(v => v.collectionCenterId === centerId) : fallback;
    vehiclesByCenterCache.set(key, { at: now, items: filtered });
    if (!centerId) {
      vehiclesCache = fallback;
      vehiclesCacheAt = now;
    }
    return filtered;
  }
};

export const fetchCollectionCenters = async (): Promise<CollectionCenter[]> => {
  const now = Date.now();
  if (collectionCentersCache && now - collectionCentersCacheAt < CACHE_TTL_MS) return collectionCentersCache;
  try {
    const res = await fetch(`${API_BASE}/api/collection-centers`);
    if (!res.ok) throw new Error('fetch collection centers failed');
    const data = normalizeCollectionCenters(await res.json());
    collectionCentersCache = data;
    collectionCentersCacheAt = now;
    return data;
  } catch (e) {
    const fallback = getStoredCollectionCenters();
    collectionCentersCache = fallback;
    collectionCentersCacheAt = now;
    return fallback;
  }
};

export const fetchCollectionCenterMembers = async (centerId: string): Promise<CollectionCenterMember[]> => {
  if (!centerId) return [];
  const now = Date.now();
  const cached = collectionCenterMembersCache.get(centerId);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.items;
  try {
    const res = await fetch(`${API_BASE}/api/collection-centers/${centerId}/members`);
    if (!res.ok) throw new Error('fetch center members failed');
    const data = normalizeCollectionCenterMembers(await res.json());
    collectionCenterMembersCache.set(centerId, { at: now, items: data });
    return data;
  } catch (e) {
    const fallback = getStoredCollectionCenterMembers().filter(m => m.centerId === centerId);
    collectionCenterMembersCache.set(centerId, { at: now, items: fallback });
    return fallback;
  }
};

export const fetchAppConfiguration = async (): Promise<AppConfiguration> => {
  const now = Date.now();
  if (appConfigurationCache && now - appConfigurationCacheAt < CACHE_TTL_MS) return appConfigurationCache;
  try {
    const res = await fetch(`${API_BASE}/api/configuration`);
    if (!res.ok) throw new Error('fetch configuration failed');
    const data = normalizeConfiguration(await res.json());
    appConfigurationCache = data;
    appConfigurationCacheAt = now;
    return data;
  } catch (e) {
    const fallback = getStoredAppConfiguration();
    appConfigurationCache = fallback;
    appConfigurationCacheAt = now;
    return fallback;
  }
};

const assignCenterToUnassigned = (centerId: string | null) => {
  if (!centerId) return;
  const centers = getStoredCollectionCenters();
  const centerExists = centers.some(c => c.id === centerId);
  if (!centerExists) return;

  const gens = getStoredGenerators();
  const updatedGens = gens.map(g => (g.collectionCenterId == null ? { ...g, collectionCenterId: centerId } : g));
  if (updatedGens.some((g, i) => g !== gens[i])) {
    localStorage.setItem(DB_KEYS.GENERATORS, JSON.stringify(updatedGens));
  }

  const vehicles = getStoredVehicles();
  const updatedVehicles = vehicles.map(v => (v.collectionCenterId == null ? { ...v, collectionCenterId: centerId } : v));
  if (updatedVehicles.some((v, i) => v !== vehicles[i])) {
    localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(updatedVehicles));
  }

  const tickets = getStoredTickets();
  const updatedTickets = tickets.map(t => (t.collectionCenterId == null ? { ...t, collectionCenterId: centerId } : t));
  if (updatedTickets.some((t, i) => t !== tickets[i])) {
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(updatedTickets));
  }
};

export const putAppConfiguration = async (config: AppConfiguration): Promise<AppConfiguration> => {
  try {
    const res = await fetch(`${API_BASE}/api/configuration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('put configuration failed');
    const updated = normalizeConfiguration(await res.json());
    appConfigurationCache = updated;
    appConfigurationCacheAt = Date.now();
    return updated;
  } catch (e) {
    localStorage.setItem(DB_KEYS.APP_CONFIGURATION, JSON.stringify(config));
    assignCenterToUnassigned(config.collectionCenterId || null);
    appConfigurationCache = config;
    appConfigurationCacheAt = Date.now();
    return config;
  }
};

export const postCollectionCenter = async (center: CollectionCenter): Promise<CollectionCenter | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-centers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(center)
    });
    if (!res.ok) throw new Error('post collection center failed');
    collectionCentersCache = null;
    return normalizeCollectionCenter(await res.json());
  } catch (e) {
    const current = getStoredCollectionCenters();
    const next = current.concat(center);
    localStorage.setItem(DB_KEYS.COLLECTION_CENTERS, JSON.stringify(next));
    collectionCentersCache = next;
    collectionCentersCacheAt = Date.now();
    return center;
  }
};

export const putCollectionCenter = async (center: CollectionCenter): Promise<CollectionCenter | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-centers/${center.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(center)
    });
    if (!res.ok) throw new Error('put collection center failed');
    collectionCentersCache = null;
    return normalizeCollectionCenter(await res.json());
  } catch (e) {
    const current = getStoredCollectionCenters();
    const next = current.map(c => (c.id === center.id ? center : c));
    localStorage.setItem(DB_KEYS.COLLECTION_CENTERS, JSON.stringify(next));
    collectionCentersCache = next;
    collectionCentersCacheAt = Date.now();
    return center;
  }
};

export const deleteCollectionCenterApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-centers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete collection center failed');
    collectionCentersCache = null;
    return true;
  } catch (e) {
    const current = getStoredCollectionCenters();
    const next = current.filter(c => c.id !== id);
    localStorage.setItem(DB_KEYS.COLLECTION_CENTERS, JSON.stringify(next));
    collectionCentersCache = next;
    collectionCentersCacheAt = Date.now();
    return true;
  }
};

export const postCollectionCenterMember = async (member: CollectionCenterMember): Promise<CollectionCenterMember | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-center-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (!res.ok) throw new Error('post collection center member failed');
    collectionCenterMembersCache.delete(member.centerId);
    return normalizeCollectionCenterMember(await res.json());
  } catch (e) {
    const current = getStoredCollectionCenterMembers();
    const next = current.concat(member);
    localStorage.setItem(DB_KEYS.COLLECTION_CENTER_MEMBERS, JSON.stringify(next));
    collectionCenterMembersCache.delete(member.centerId);
    return member;
  }
};

export const putCollectionCenterMember = async (member: CollectionCenterMember): Promise<CollectionCenterMember | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-center-members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (!res.ok) throw new Error('put collection center member failed');
    collectionCenterMembersCache.clear();
    return normalizeCollectionCenterMember(await res.json());
  } catch (e) {
    const current = getStoredCollectionCenterMembers();
    const next = current.map(m => (m.id === member.id ? member : m));
    localStorage.setItem(DB_KEYS.COLLECTION_CENTER_MEMBERS, JSON.stringify(next));
    collectionCenterMembersCache.clear();
    return member;
  }
};

export const deleteCollectionCenterMemberApi = async (id: string, centerId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/collection-center-members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete collection center member failed');
    collectionCenterMembersCache.delete(centerId);
    return true;
  } catch (e) {
    const current = getStoredCollectionCenterMembers();
    const next = current.filter(m => m.id !== id);
    localStorage.setItem(DB_KEYS.COLLECTION_CENTER_MEMBERS, JSON.stringify(next));
    collectionCenterMembersCache.delete(centerId);
    return true;
  }
};

export const fetchTicketsPage = async (params?: {
  limit?: number;
  offset?: number;
  search?: string;
  date?: string;
  collectionCenterId?: string | null;
  sortKey?: 'ticketNumber' | 'date' | 'center' | 'generatorName' | 'quantity' | 'collectorName';
  sortDir?: 'asc' | 'desc';
  skipCache?: boolean;
}): Promise<{ items: Ticket[]; total: number }> => {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const search = params?.search?.trim() || '';
  const date = params?.date?.trim() || '';
  const sortKey = params?.sortKey;
  const sortDir = params?.sortDir === 'asc' ? 'asc' : 'desc';
  const skipCache = !!params?.skipCache;
  const centerId = params?.collectionCenterId !== undefined
    ? params.collectionCenterId
    : await resolveActiveCenterId();

  const cacheKey = `${centerId || 'all'}:${limit}:${offset}:${search}:${date}:${sortKey || 'none'}:${sortDir}`;
  const cached = ticketsPageCache.get(cacheKey);
  const now = Date.now();
  if (!skipCache && cached && now - cached.at < TICKETS_PAGE_CACHE_TTL_MS) {
    return cached.data;
  }

  const query = new URLSearchParams();
  query.set('limit', String(limit));
  query.set('offset', String(offset));
  if (search) query.set('search', search);
  if (date) query.set('date', date);
  if (centerId) query.set('collectionCenterId', centerId);
  if (sortKey) query.set('sortKey', sortKey);
  if (sortKey) query.set('sortDir', sortDir);

  try {
    const res = await fetch(`${API_BASE}/api/tickets?${query.toString()}`);
    if (!res.ok) throw new Error('fetch tickets failed');
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : payload.items;
    const items = normalizeTickets(rows || []);
    const data = { items, total: payload.total ?? items.length };
    ticketsPageCache.set(cacheKey, { at: now, data });
    return data;
  } catch (e) {
    const all = getStoredTickets();
    const filtered = all.filter(t => {
      const matchCenter = !centerId || t.collectionCenterId === centerId;
      const matchSearch = !search || t.generatorName.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.toLowerCase().includes(search.toLowerCase());
      const matchDate = !date || t.date.includes(date);
      return matchCenter && matchSearch && matchDate;
    });
    const centers = getStoredCollectionCenters();
    const resolveCenterName = (centerValue: string | null | undefined) => (
      centers.find(c => c.id === centerValue)?.name || centerValue || 'Sin centro'
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
    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1;
      if (!sortKey) {
        return direction * b.createdAt.localeCompare(a.createdAt);
      }
      switch (sortKey) {
        case 'ticketNumber':
          return direction * (a.ticketNumber || '').localeCompare(b.ticketNumber || '', 'es', { numeric: true, sensitivity: 'base' });
        case 'date':
          return direction * (parseDateValue(a.date || '') - parseDateValue(b.date || ''));
        case 'center':
          return direction * resolveCenterName(a.collectionCenterId).localeCompare(resolveCenterName(b.collectionCenterId), 'es', { sensitivity: 'base' });
        case 'generatorName':
          return direction * (a.generatorName || '').localeCompare(b.generatorName || '', 'es', { sensitivity: 'base' });
        case 'quantity':
          return direction * ((a.quantity || 0) - (b.quantity || 0));
        case 'collectorName':
          return direction * (a.collectorName || '').localeCompare(b.collectorName || '', 'es', { sensitivity: 'base' });
        default:
          return direction * b.createdAt.localeCompare(a.createdAt);
      }
    });
    const items = sorted.slice(offset, offset + limit);
    const data = { items, total: filtered.length };
    ticketsPageCache.set(cacheKey, { at: now, data });
    return data;
  }
};

export const fetchTicketCount = async (): Promise<number> => {
  const centerId = await resolveActiveCenterId();
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    const endpoint = query.toString() ? `${API_BASE}/api/tickets/count?${query.toString()}` : `${API_BASE}/api/tickets/count`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch ticket count failed');
    const payload = await res.json();
    return payload.total || 0;
  } catch (e) {
    if (!centerId) return getStoredTicketCount();
    return getStoredTickets().filter(t => t.collectionCenterId === centerId).length;
  }
};

export const fetchDashboardSummary = async (): Promise<{
  totalLiters: number;
  totalDispatched: number;
  ticketCount: number;
  totalGens: number;
  lastFive: Ticket[];
  chartData: { date: string; litersIn: number; litersOut: number }[];
}> => {
  return fetchDashboardSummaryWithFilters({});
};

export const fetchDashboardSummaryWithFilters = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  month?: number | null;
  year?: number | null;
  generatorIds?: string[];
}): Promise<{
  totalLiters: number;
  totalDispatched: number;
  ticketCount: number;
  totalGens: number;
  lastFive: Ticket[];
  chartData: { date: string; litersIn: number; litersOut: number }[];
}> => {
  const now = Date.now();
  const centerId = await resolveActiveCenterId();
  const dateFrom = filters?.dateFrom?.trim() || '';
  const dateTo = filters?.dateTo?.trim() || '';
  const month = filters?.month && filters.month >= 1 && filters.month <= 12 ? filters.month : null;
  const year = filters?.year && filters.year > 0 ? filters.year : null;
  const generatorIds = (filters?.generatorIds || []).filter(Boolean);
  const cacheKey = `${centerId || 'all'}:${dateFrom}:${dateTo}:${month || ''}:${year || ''}:${generatorIds.join(',')}`;
  if (dashboardCache && dashboardCache.key === cacheKey && now - dashboardCacheAt < DASHBOARD_CACHE_TTL_MS) return dashboardCache;
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    if (dateFrom) query.set('dateFrom', dateFrom);
    if (dateTo) query.set('dateTo', dateTo);
    if (month) query.set('month', String(month));
    if (year) query.set('year', String(year));
    if (generatorIds.length) query.set('generatorIds', generatorIds.join(','));
    const endpoint = query.toString() ? `${API_BASE}/api/dashboard?${query.toString()}` : `${API_BASE}/api/dashboard`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch dashboard failed');
    const payload = await res.json();
    const data = {
      key: cacheKey,
      totalLiters: payload.totalLiters || 0,
      totalDispatched: payload.totalDispatched || 0,
      ticketCount: payload.ticketCount || 0,
      totalGens: payload.totalGens || 0,
      lastFive: normalizeTickets(payload.lastFive || []),
      chartData: payload.chartData || []
    };
    dashboardCache = data;
    dashboardCacheAt = now;
    return data;
  } catch (e) {
    const parseTicketDate = (ticketDate: string) => {
      if (!ticketDate) return 0;
      if (ticketDate.includes('-')) {
        const [yearValue, monthValue, dayValue] = ticketDate.split('-').map(v => Number.parseInt(v, 10));
        return new Date(yearValue || 0, (monthValue || 1) - 1, dayValue || 1).getTime();
      }
      const parts = ticketDate.split('/');
      if (parts.length !== 3) return 0;
      const dayNum = Number.parseInt(parts[0], 10);
      const monthNum = Number.parseInt(parts[1], 10);
      const yearNum = Number.parseInt(parts[2], 10);
      return new Date(yearNum || 0, (monthNum || 1) - 1, dayNum || 1).getTime();
    };
    const dateFromTime = dateFrom ? parseTicketDate(dateFrom) : 0;
    const dateToTime = dateTo ? parseTicketDate(dateTo) : 0;

    const tickets = getStoredTickets().filter(t => {
      if (centerId && t.collectionCenterId !== centerId) return false;
      if (generatorIds.length && !generatorIds.includes(t.generatorId)) return false;
      const ticketTime = parseTicketDate(t.date);
      if (dateFromTime && ticketTime < dateFromTime) return false;
      if (dateToTime && ticketTime > dateToTime) return false;
      const parsedDate = new Date(ticketTime || 0);
      const ticketMonth = parsedDate.getMonth() + 1;
      const ticketYear = parsedDate.getFullYear();
      if (month && ticketMonth !== month) return false;
      if (year && ticketYear !== year) return false;
      return true;
    });
    const dispatches = getStoredDispatches().filter(d => {
      if (centerId && d.collectionCenterId !== centerId) return false;
      const dispatchTime = parseTicketDate(d.date);
      if (dateFromTime && dispatchTime < dateFromTime) return false;
      if (dateToTime && dispatchTime > dateToTime) return false;
      const parsedDate = new Date(dispatchTime || 0);
      const dispatchMonth = parsedDate.getMonth() + 1;
      const dispatchYear = parsedDate.getFullYear();
      if (month && dispatchMonth !== month) return false;
      if (year && dispatchYear !== year) return false;
      return true;
    });
    const totalGens = new Set(tickets.map(t => t.generatorId)).size;
    const totalLiters = tickets.reduce((acc, t) => acc + t.quantity, 0);
    const totalDispatched = dispatches.reduce((acc, d) => acc + Number(d.dispatchedQuantity || 0), 0);
    const lastFive = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const chartMap = new Map<string, { date: string; litersIn: number; litersOut: number }>();
    tickets.forEach(t => {
      const existing = chartMap.get(t.date) || { date: t.date, litersIn: 0, litersOut: 0 };
      existing.litersIn += t.quantity;
      chartMap.set(t.date, existing);
    });
    dispatches.forEach(d => {
      const existing = chartMap.get(d.date) || { date: d.date, litersIn: 0, litersOut: 0 };
      existing.litersOut += Number(d.dispatchedQuantity || 0);
      chartMap.set(d.date, existing);
    });
    const chartData = Array.from(chartMap.values()).sort((a, b) => {
      const aParts = a.date.split('/').map(v => Number.parseInt(v, 10));
      const bParts = b.date.split('/').map(v => Number.parseInt(v, 10));
      const aTime = new Date(aParts[2], (aParts[1] || 1) - 1, aParts[0] || 1).getTime();
      const bTime = new Date(bParts[2], (bParts[1] || 1) - 1, bParts[0] || 1).getTime();
      return aTime - bTime;
    });
    const data = {
      key: cacheKey,
      totalLiters,
      totalDispatched,
      ticketCount: tickets.length,
      totalGens,
      lastFive,
      chartData
    };
    dashboardCache = data;
    dashboardCacheAt = now;
    return data;
  }
};

export const fetchTickets = async (): Promise<Ticket[]> => {
  const centerId = await resolveActiveCenterId();
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    const endpoint = query.toString() ? `${API_BASE}/api/tickets?${query.toString()}` : `${API_BASE}/api/tickets`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch tickets failed');
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (payload?.items || []);
    return normalizeTickets(rows || []);
  } catch (e) {
    const fallback = getStoredTickets();
    return centerId ? fallback.filter(t => t.collectionCenterId === centerId) : fallback;
  }
};

export const fetchReportTicketsWithFilters = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  month?: number | null;
  year?: number | null;
  generatorIds?: string[];
}): Promise<Ticket[]> => {
  const centerId = await resolveActiveCenterId();
  const dateFrom = filters?.dateFrom?.trim() || '';
  const dateTo = filters?.dateTo?.trim() || '';
  const month = filters?.month && filters.month >= 1 && filters.month <= 12 ? filters.month : null;
  const year = filters?.year && filters.year > 0 ? filters.year : null;
  const generatorIds = (filters?.generatorIds || []).filter(Boolean);

  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    if (dateFrom) query.set('dateFrom', dateFrom);
    if (dateTo) query.set('dateTo', dateTo);
    if (month) query.set('month', String(month));
    if (year) query.set('year', String(year));
    if (generatorIds.length) query.set('generatorIds', generatorIds.join(','));
    const endpoint = query.toString() ? `${API_BASE}/api/tickets/report?${query.toString()}` : `${API_BASE}/api/tickets/report`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch report tickets failed');
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : payload.items;
    return normalizeTickets(rows || []);
  } catch (e) {
    const parseTicketDate = (ticketDate: string) => {
      if (!ticketDate) return 0;
      if (ticketDate.includes('-')) {
        const [yearValue, monthValue, dayValue] = ticketDate.split('-').map(v => Number.parseInt(v, 10));
        return new Date(yearValue || 0, (monthValue || 1) - 1, dayValue || 1).getTime();
      }
      const parts = ticketDate.split('/');
      if (parts.length !== 3) return 0;
      const dayNum = Number.parseInt(parts[0], 10);
      const monthNum = Number.parseInt(parts[1], 10);
      const yearNum = Number.parseInt(parts[2], 10);
      return new Date(yearNum || 0, (monthNum || 1) - 1, dayNum || 1).getTime();
    };
    const dateFromTime = dateFrom ? parseTicketDate(dateFrom) : 0;
    const dateToTime = dateTo ? parseTicketDate(dateTo) : 0;

    const fallback = getStoredTickets().filter(t => {
      if (centerId && t.collectionCenterId !== centerId) return false;
      if (generatorIds.length && !generatorIds.includes(t.generatorId)) return false;
      const ticketTime = parseTicketDate(t.date);
      if (dateFromTime && ticketTime < dateFromTime) return false;
      if (dateToTime && ticketTime > dateToTime) return false;
      const parsedDate = new Date(ticketTime || 0);
      const ticketMonth = parsedDate.getMonth() + 1;
      const ticketYear = parsedDate.getFullYear();
      if (month && ticketMonth !== month) return false;
      if (year && ticketYear !== year) return false;
      return true;
    });
    return centerId ? fallback.filter(t => t.collectionCenterId === centerId) : fallback;
  }
};

export const fetchTicketById = async (id: string): Promise<Ticket | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/tickets/${id}`);
    if (!res.ok) throw new Error('fetch ticket failed');
    const r = await res.json();
    if (!r) return null;
    return normalizeTicket(r);
  } catch (e) {
    return getStoredTickets().find(t => t.id === id) || null;
  }
};

export const fetchExpectedTicketNumber = async (date: string, collectionCenterId?: string | null): Promise<string | null> => {
  const centerId = collectionCenterId || await resolveActiveCenterId();
  if (!centerId) return null;

  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    if (date) query.set('date', date);
    const res = await fetch(`${API_BASE}/api/tickets/preview-number?${query.toString()}`);
    if (!res.ok) throw new Error('fetch ticket preview failed');
    const payload = await res.json();
    return payload.expectedTicketNumber || null;
  } catch (e) {
    const centers = getStoredCollectionCenters();
    const center = centers.find(c => c.id === centerId);
    const normalized = (center?.state || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase();
    const stateCode = (normalized.length >= 3 ? normalized.slice(0, 3) : normalized.padEnd(3, 'X'));
    const year = (() => {
      if (date?.includes('-')) return Number.parseInt(date.slice(0, 4), 10) || new Date().getFullYear();
      if (date?.includes('/')) return Number.parseInt(date.split('/')[2] || '', 10) || new Date().getFullYear();
      return new Date().getFullYear();
    })();
    const prefix = `AV-${stateCode}-${year}`;
    const all = getStoredTickets().filter(t => t.ticketNumber?.startsWith(`${prefix}-`));
    const maxSeq = all.reduce((max, t) => {
      const m = t.ticketNumber.match(/-(\d+)$/);
      const seq = m ? Number.parseInt(m[1], 10) : 0;
      return Math.max(max, seq);
    }, 0);
    return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
  }
};

export const postTicket = async (ticket: Ticket): Promise<Ticket | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    if (!res.ok) throw new Error('post ticket failed');
    return await res.json();
  } catch (e) {
    saveTicket(ticket);
    return ticket;
  }
};

export const putGenerator = async (gen: Generator): Promise<Generator | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/generators/${gen.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gen)
    });
    if (!res.ok) throw new Error('put generator failed');
    generatorsCache = null;
    return normalizeGenerator(await res.json());
  } catch (e) {
    updateGenerator(gen);
    generatorsCache = null;
    return gen;
  }
};

export const postGenerator = async (gen: Generator): Promise<Generator | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/generators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gen)
    });
    if (!res.ok) throw new Error('post generator failed');
    generatorsCache = null;
    generatorsByCenterCache.clear();
    return normalizeGenerator(await res.json());
  } catch (e) {
    const centerId = gen.collectionCenterId ?? getStoredAppConfiguration().collectionCenterId;
    const toSave = { ...gen, collectionCenterId: centerId };
    const gens = getStoredGenerators();
    gens.push(toSave);
    localStorage.setItem(DB_KEYS.GENERATORS, JSON.stringify(gens));
    generatorsCache = null;
    generatorsByCenterCache.clear();
    return toSave;
  }
};

export const postVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
    if (!res.ok) throw new Error('post vehicle failed');
    const created = normalizeVehicle(await res.json());
    vehiclesCache = null;
    vehiclesByCenterCache.clear();
    return created;
  } catch (e) {
    const centerId = vehicle.collectionCenterId ?? getStoredAppConfiguration().collectionCenterId;
    const toSave = { ...vehicle, collectionCenterId: centerId };
    const vehicles = getStoredVehicles();
    const next = toSave.isDefault
      ? vehicles.map(v => ({ ...v, isDefault: v.collectionCenterId === centerId ? false : v.isDefault })).concat(toSave)
      : vehicles.concat(toSave);
    localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(next));
    vehiclesCache = next;
    vehiclesByCenterCache.clear();
    return toSave;
  }
};

export const putVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
    if (!res.ok) throw new Error('put vehicle failed');
    const updated = normalizeVehicle(await res.json());
    vehiclesCache = null;
    vehiclesByCenterCache.clear();
    return updated;
  } catch (e) {
    const centerId = vehicle.collectionCenterId ?? getStoredAppConfiguration().collectionCenterId;
    const toSave = { ...vehicle, collectionCenterId: centerId };
    const vehicles = getStoredVehicles();
    const next = vehicles.map(v => ({
      ...v,
      isDefault: toSave.isDefault && v.collectionCenterId === centerId ? false : v.isDefault
    })).map(v => (v.id === toSave.id ? toSave : v));
    localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(next));
    vehiclesCache = next;
    vehiclesByCenterCache.clear();
    return toSave;
  }
};

export const fetchDispatches = async (params?: { collectionCenterId?: string | null }): Promise<Dispatch[]> => {
  const centerId = params?.collectionCenterId !== undefined
    ? params.collectionCenterId
    : await resolveActiveCenterId();
  try {
    const query = new URLSearchParams();
    if (centerId) query.set('collectionCenterId', centerId);
    const endpoint = query.toString() ? `${API_BASE}/api/dispatches?${query.toString()}` : `${API_BASE}/api/dispatches`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('fetch dispatches failed');
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : payload.items;
    return normalizeDispatches(rows || []);
  } catch (e) {
    const fallback = getStoredDispatches();
    return centerId ? fallback.filter(d => d.collectionCenterId === centerId) : fallback;
  }
};

export const postDispatch = async (dispatch: Dispatch): Promise<Dispatch | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatch)
    });
    if (!res.ok) throw new Error('post dispatch failed');
    return normalizeDispatch(await res.json());
  } catch (e) {
    const centerId = dispatch.collectionCenterId ?? getStoredAppConfiguration().collectionCenterId;
    const toSave = { ...dispatch, collectionCenterId: centerId };
    const items = getStoredDispatches();
    items.unshift(toSave);
    localStorage.setItem(DB_KEYS.DISPATCHES, JSON.stringify(items));
    return toSave;
  }
};

export const putDispatch = async (dispatch: Dispatch): Promise<Dispatch | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/dispatches/${dispatch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatch)
    });
    if (!res.ok) throw new Error('put dispatch failed');
    return normalizeDispatch(await res.json());
  } catch (e) {
    const items = getStoredDispatches();
    const idx = items.findIndex(d => d.id === dispatch.id);
    if (idx !== -1) {
      items[idx] = dispatch;
      localStorage.setItem(DB_KEYS.DISPATCHES, JSON.stringify(items));
    }
    return dispatch;
  }
};

export const deleteDispatchApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/dispatches/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete dispatch failed');
    return true;
  } catch (e) {
    const items = getStoredDispatches().filter(d => d.id !== id);
    localStorage.setItem(DB_KEYS.DISPATCHES, JSON.stringify(items));
    return true;
  }
};

export const deleteVehicleApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/vehicles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete vehicle failed');
    vehiclesCache = null;
    vehiclesByCenterCache.clear();
    return true;
  } catch (e) {
    const vehicles = getStoredVehicles().filter(v => v.id !== id);
    localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(vehicles));
    vehiclesCache = vehicles;
    vehiclesByCenterCache.clear();
    return true;
  }
};

export const putTicket = async (ticket: Ticket): Promise<Ticket | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    if (!res.ok) throw new Error('put ticket failed');
    return await res.json();
  } catch (e) {
    const tickets = getStoredTickets();
    const idx = tickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      tickets[idx] = ticket;
      localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    }
    return ticket;
  }
};

export const deleteTicketApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete ticket failed');
    return true;
  } catch (e) {
    const tickets = getStoredTickets().filter(t => t.id !== id);
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    return true;
  }
};

export const deleteGeneratorApi = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/api/generators/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete generator failed');
    generatorsCache = null;
    generatorsByCenterCache.clear();
    return true;
  } catch (e) {
    const gens = getStoredGenerators().filter(g => g.id !== id);
    localStorage.setItem(DB_KEYS.GENERATORS, JSON.stringify(gens));
    generatorsCache = null;
    generatorsByCenterCache.clear();
    return true;
  }
};

export const initializeDB = () => {
  const existingGenerators = getStoredGenerators();
  const existingTickets = getStoredTickets();
  const existingVehicles = getStoredVehicles();
  const existingCenters = getStoredCollectionCenters();
  const existingMembers = getStoredCollectionCenterMembers();
  const existingConfig = getStoredAppConfiguration();

  if (existingCenters.length === 0) {
    const centers: CollectionCenter[] = [
      {
        id: 'cc_local_1',
        name: 'Centro de Acopio Puerto Ordaz',
        state: 'Bolívar',
        city: 'Puerto Ordaz',
        address: 'Zona Industrial Unare II',
        isActive: true
      },
      {
        id: 'cc_local_2',
        name: 'Centro de Acopio Caracas',
        state: 'Distrito Capital',
        city: 'Caracas',
        address: 'Av. Intercomunal Petare',
        isActive: true
      }
    ];
    localStorage.setItem(DB_KEYS.COLLECTION_CENTERS, JSON.stringify(centers));
  }

  if (existingMembers.length === 0) {
    const members: CollectionCenterMember[] = [
      {
        id: 'ccm_local_1',
        centerId: 'cc_local_1',
        fullName: 'Rafael Díaz',
        phone: '0414-5550001',
        role: 'Recolector',
        isActive: true
      },
      {
        id: 'ccm_local_2',
        centerId: 'cc_local_1',
        fullName: 'María González',
        phone: '0414-5550002',
        role: 'Recolector',
        isActive: true
      },
      {
        id: 'ccm_local_3',
        centerId: 'cc_local_2',
        fullName: 'Luis Hernández',
        phone: '0412-5550003',
        role: 'Recolector',
        isActive: true
      }
    ];
    localStorage.setItem(DB_KEYS.COLLECTION_CENTER_MEMBERS, JSON.stringify(members));
  }

  if (!existingConfig.collectionCenterId) {
    localStorage.setItem(DB_KEYS.APP_CONFIGURATION, JSON.stringify({ collectionCenterId: 'cc_local_1' }));
  }

  if (existingVehicles.length === 0) {
    const vehicles: Vehicle[] = [
      { id: 'veh_local_1', plate: 'A12BC3D', brand: 'Toyota', model: 'Hilux', owner: 'Alternativa Verde', isDefault: true, collectionCenterId: 'cc_local_1' },
      { id: 'veh_local_2', plate: 'B41ZX9Q', brand: 'Ford', model: 'Ranger', owner: 'Alternativa Verde', isDefault: false, collectionCenterId: 'cc_local_1' },
      { id: 'veh_local_3', plate: 'C22RT7K', brand: 'Chevrolet', model: 'N300', owner: 'Alternativa Verde', isDefault: true, collectionCenterId: 'cc_local_2' }
    ];
    localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(vehicles));
  }

  if (existingGenerators.length === 0) {
    const generatorsMap = new Map<string, Generator>();
    const centers = ['cc_local_1', 'cc_local_2'];

    RAW_SEED_DATA.forEach((row, index) => {
      if (!generatorsMap.has(row.generador)) {
        generatorsMap.set(row.generador, {
          id: `gen_${index}`,
          name: row.generador,
          rif: `J-${Math.floor(Math.random() * 90000000) + 10000000}-0`,
          phone: '0414-0000000',
          address: `${row.sector}, Puerto Ordaz`,
          sector: row.sector,
          collectionCenterId: centers[index % centers.length]
        });
      }
    });

    const generators = Array.from(generatorsMap.values());
    localStorage.setItem(DB_KEYS.GENERATORS, JSON.stringify(generators));

    if (existingTickets.length === 0) {
      const tickets: Ticket[] = RAW_SEED_DATA.map((row, index) => {
        const gen = generators.find(g => g.name === row.generador)!;
        const ticketId = index + 1;
        const centerId = gen.collectionCenterId || 'cc_local_1';
        const collector = centerId === 'cc_local_2' ? { id: 'ccm_local_3', name: 'Luis Hernández' } : { id: 'ccm_local_1', name: 'Rafael Díaz' };
        const vehiclePlate = centerId === 'cc_local_2' ? 'C22RT7K' : 'A12BC3D';
        return {
          id: `t_${ticketId}`,
          ticketNumber: `AV-BOL-2026-${String(ticketId).padStart(4, '0')}`,
          date: row.fecha,
          generatorId: gen.id,
          generatorName: gen.name,
          materialType: MATERIAL_DESCRIPTION,
          quantity: row.cantidad,
          materialState: MaterialState.BRUTO,
          collectionCenterId: centerId,
          collectorMemberId: collector.id,
          collectorName: collector.name,
          vehiclePlate,
          createdAt: new Date().toISOString()
        };
      });
      localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    }
  }
};

export const saveTicket = (ticket: Ticket) => {
  const tickets = getStoredTickets();
  tickets.push(ticket);
  localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
};

export const updateGenerator = (gen: Generator) => {
  const generators = getStoredGenerators();
  const index = generators.findIndex(g => g.id === gen.id);
  if (index !== -1) {
    generators[index] = gen;
    localStorage.setItem(DB_KEYS.GENERATORS, JSON.stringify(generators));
  }
};
