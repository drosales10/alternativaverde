
export enum MaterialState {
  FILTRADO = 'Filtrado',
  BRUTO = 'Bruto',
  MEZCLA = 'Mezcla'
}

export interface Generator {
  id: string;
  name: string;
  rif: string;
  phone: string;
  address: string;
  sector: string;
  collectionMode?: string;
  collectionCenterId?: string | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  owner: string;
  isDefault: boolean;
  collectionCenterId?: string | null;
}

export interface CollectionCenter {
  id: string;
  name: string;
  state: string;
  city: string;
  address: string;
  isActive: boolean;
}

export interface CollectionCenterMember {
  id: string;
  centerId: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export interface AppConfiguration {
  collectionCenterId: string | null;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  date: string;
  generatorId: string;
  generatorName: string; // Cached for history
  materialType: string;
  quantity: number;
  materialState: MaterialState;
  collectionCenterId?: string | null;
  collectorMemberId?: string | null;
  collectorName: string;
  vehiclePlate: string;
  createdAt: string;
}

export interface Dispatch {
  id: string;
  date: string;
  description: string;
  presentation: string;
  dispatchedQuantity: number;
  destinationName: string;
  destinationRif: string;
  destinationAddress: string;
  vehicleId: string | null;
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  driverName: string;
  driverId: string;
  minecGuideNumber: string;
  collectionCenterId?: string | null;
  createdAt?: string;
}

export interface SeedDataRow {
  fecha: string;
  generador: string;
  sector: string;
  cantidad: number;
  recolector: string;
}
