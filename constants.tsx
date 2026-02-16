
import { SeedDataRow, MaterialState } from './types';

export const COMPANY_NAME = "Alternativa Verde 2023 C.A.";
export const COMPANY_RIF = "J-504708925";
export const COMPANY_EMAIL = "alternativaverde2023@gmail.com";
export const COMPANY_ADDRESS = "AV 1, Sector E, Local Nº Parcela E-15 A. Urb. Santa Cruz, Edo. Aragua 2123";

/**
 * LOGO_URL: Referencia al archivo local.
 * Se asume que logo_av.png está en el directorio raíz.
 */
// Apunta al asset dentro de `src/assets` y resuelve correctamente en dev/build
export const LOGO_URL = new URL('./src/assets/logo_av.png', import.meta.url).href;

export const RAW_SEED_DATA: SeedDataRow[] = [
  { fecha: '2/01/2026', generador: 'Restaurant El Gran Cacique', sector: 'El Caimito', cantidad: 50, recolector: 'Rafael Díaz' },
  { fecha: '3/01/2026', generador: 'Club Caronoco', sector: 'Campo C', cantidad: 150, recolector: 'Rafael Díaz' },
  { fecha: '8/01/2026', generador: 'Restaurant El Gran Cacique', sector: 'El Caimito', cantidad: 54, recolector: 'Rafael Díaz' },
  { fecha: '8/01/2026', generador: 'Club Caronoco', sector: 'Campo C', cantidad: 50, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Aladyn', sector: 'Alta Vista', cantidad: 330, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Palace Cantó', sector: 'C.C. Costa Granada', cantidad: 150, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Pollos Rys', sector: 'Unare I', cantidad: 100, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Chido Pizzas', sector: 'C.C. Alta Vista II', cantidad: 4, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Roof Burger', sector: 'Calle Hambre', cantidad: 12, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'F. Jaimes', sector: 'Av. Atlántica', cantidad: 60, recolector: 'Rafael Díaz' },
  { fecha: '9/01/2026', generador: 'Dores Puerto Ordaz', sector: 'Alta Vista', cantidad: 70, recolector: 'Rafael Díaz' },
  { fecha: '10/01/2026', generador: 'Phoenix Asian Fast Food', sector: 'Redoma La Piña', cantidad: 80, recolector: 'Rafael Díaz' },
  { fecha: '10/01/2026', generador: 'Pollos Milus', sector: 'C.C. Alta Vista 2', cantidad: 25, recolector: 'Rafael Díaz' },
  { fecha: '10/01/2026', generador: 'Restaurant El Yaque', sector: 'Club Italo', cantidad: 135, recolector: 'Rafael Díaz' },
  { fecha: '10/01/2026', generador: 'D\'oro Pizza', sector: 'Alta Vista', cantidad: 30, recolector: 'Rafael Díaz' },
  { fecha: '10/01/2026', generador: 'Buffalo Bill PZO', sector: 'C.C. Alta Vista I', cantidad: 30, recolector: 'Rafael Díaz' },
  { fecha: '12/01/2026', generador: 'Restaurant El Gran Cacique', sector: 'El Caimito', cantidad: 70, recolector: 'Rafael Díaz' },
  { fecha: '12/01/2026', generador: 'Club Campestre Pesca y Paga', sector: 'El Caimito', cantidad: 205, recolector: 'Rafael Díaz' },
  { fecha: '17/01/2026', generador: 'Club Caronoco', sector: 'Campo C', cantidad: 133, recolector: 'Rafael Díaz' },
  { fecha: '17/01/2026', generador: 'Panadería La Bodega', sector: 'Alta Vista', cantidad: 190, recolector: 'Rafael Díaz' },
  { fecha: '17/01/2026', generador: 'Pollo Portu\'s', sector: 'Unare I', cantidad: 30, recolector: 'Rafael Díaz' },
  { fecha: '17/01/2026', generador: 'Porkis 286', sector: 'Unare I', cantidad: 36, recolector: 'Rafael Díaz' },
  { fecha: '17/01/2026', generador: 'Roof Burger', sector: 'Calle Hambre', cantidad: 11, recolector: 'Rafael Díaz' },
  { fecha: '19/01/2026', generador: 'Restaurant El Gran Cacique', sector: 'El Caimito', cantidad: 97, recolector: 'Rafael Díaz' },
  { fecha: '19/01/2026', generador: 'Pollos Daniels', sector: 'Unare I', cantidad: 75, recolector: 'Rafael Díaz' },
  { fecha: '19/01/2026', generador: 'Dores Puerto Ordaz', sector: 'Alta Vista', cantidad: 40, recolector: 'Rafael Díaz' },
  { fecha: '20/01/2026', generador: 'Chicken King 1990', sector: 'C.C. Alta Vista II', cantidad: 212, recolector: 'Rafael Díaz' },
  { fecha: '20/01/2026', generador: 'Club Caronoco', sector: 'Campo C', cantidad: 60, recolector: 'Rafael Díaz' },
  { fecha: '20/01/2026', generador: 'F. Jaimes', sector: 'Av. Atlántica', cantidad: 12, recolector: 'Rafael Díaz' },
  { fecha: '20/01/2026', generador: 'Daniel Devera', sector: 'Los Olivos', cantidad: 116, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'Restaurant El Gran Cacique', sector: 'El Caimito', cantidad: 88, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'Club Caronoco', sector: 'Campo C', cantidad: 136, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'Chimuelo Burger', sector: 'Torre Movistar', cantidad: 36, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'King Kebab', sector: 'Río Negro', cantidad: 23, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'F. Jaimes', sector: 'Av. Atlántica', cantidad: 36, recolector: 'Rafael Díaz' },
  { fecha: '26/01/2026', generador: 'Dores Puerto Ordaz', sector: 'Alta Vista', cantidad: 108, recolector: 'Rafael Díaz' },
];

export const MATERIAL_DESCRIPTION = "Aceite Vegetal Usado (AVU) - No Peligroso";
export const DECLARATION_TEXT = "DECLARACIÓN: El generador declara que el material entregado es de origen vegetal, libre de contaminantes químicos o minerales. Alternativa Verde 2023, C.A. asume la custodia técnica para su posterior aprovechamiento industrial según los permisos vigentes del MINEC y SACS.";
