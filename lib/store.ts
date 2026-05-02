// Types
export interface Barber {
  id: string;
  name: string;
  phone?: string;
  color: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  clientName: string;
  service: string;
  date: string; // ISO
  time: string; // "HH:MM"
  duration: number; // minutes
  notes?: string;
}

export interface Transaction {
  id: string;
  barberId: string;
  service: ServiceType;
  price: number;
  paymentMethod: 'cash' | 'card';
  date: string; // ISO date
  clientName?: string;
  notes?: string;
}

export type ServiceType = 'Corte de pelo' | 'Afeitado' | 'Barba' | 'Corte + Barba' | 'Tinte' | 'Tratamiento' | 'Otros';

export const SERVICE_TYPES: ServiceType[] = [
  'Corte de pelo', 'Afeitado', 'Barba', 'Corte + Barba', 'Tinte', 'Tratamiento', 'Otros'
];

export const BARBER_COLORS = [
  '#c9a84c', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#e91e63'
];

// Default demo shops
const DEFAULT_SHOPS = [
  { id: 'shop1', email: 'barberia1@demo.com', password: 'demo123', name: 'The Classic Barber Shop' },
  { id: 'shop2', email: 'barberia2@demo.com', password: 'demo123', name: 'Modern Cuts Studio' },
];

const DEFAULT_BARBERS: Record<string, Barber[]> = {
  shop1: [
    { id: 'b1', name: 'Carlos Martínez', phone: '612345678', color: '#c9a84c' },
    { id: 'b2', name: 'Miguel López', phone: '623456789', color: '#e74c3c' },
    { id: 'b3', name: 'Alejandro García', phone: '634567890', color: '#3498db' },
  ],
  shop2: [
    { id: 'b4', name: 'Roberto Sánchez', phone: '645678901', color: '#2ecc71' },
    { id: 'b5', name: 'Diego Fernández', phone: '656789012', color: '#9b59b6' },
  ],
};

// Storage helpers
function getKey(shopId: string, key: string) {
  return `barberos_${shopId}_${key}`;
}

export function getShops() {
  if (typeof window === 'undefined') return DEFAULT_SHOPS;
  const stored = localStorage.getItem('barberos_shops');
  if (!stored) {
    localStorage.setItem('barberos_shops', JSON.stringify(DEFAULT_SHOPS));
    return DEFAULT_SHOPS;
  }
  return JSON.parse(stored);
}

export function login(email: string, password: string): { shopId: string; shopName: string } | null {
  const shops = getShops();
  const shop = shops.find((s: { email: string; password: string }) => s.email === email && s.password === password);
  if (!shop) return null;
  // Init default data
  if (!localStorage.getItem(getKey(shop.id, 'barbers'))) {
    localStorage.setItem(getKey(shop.id, 'barbers'), JSON.stringify(DEFAULT_BARBERS[shop.id] || []));
  }
  if (!localStorage.getItem(getKey(shop.id, 'transactions'))) {
    localStorage.setItem(getKey(shop.id, 'transactions'), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey(shop.id, 'appointments'))) {
    localStorage.setItem(getKey(shop.id, 'appointments'), JSON.stringify([]));
  }
  return { shopId: shop.id, shopName: shop.name };
}

export function getSession(): { shopId: string; shopName: string } | null {
  if (typeof window === 'undefined') return null;
  const s = sessionStorage.getItem('barberos_session');
  if (!s) return null;
  return JSON.parse(s);
}

export function setSession(data: { shopId: string; shopName: string }) {
  sessionStorage.setItem('barberos_session', JSON.stringify(data));
}

export function clearSession() {
  sessionStorage.removeItem('barberos_session');
}

// Barbers
export function getBarbers(shopId: string): Barber[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getKey(shopId, 'barbers'));
  return stored ? JSON.parse(stored) : [];
}

export function saveBarbers(shopId: string, barbers: Barber[]) {
  localStorage.setItem(getKey(shopId, 'barbers'), JSON.stringify(barbers));
}

// Transactions
export function getTransactions(shopId: string): Transaction[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getKey(shopId, 'transactions'));
  return stored ? JSON.parse(stored) : [];
}

export function saveTransactions(shopId: string, transactions: Transaction[]) {
  localStorage.setItem(getKey(shopId, 'transactions'), JSON.stringify(transactions));
}

// Appointments
export function getAppointments(shopId: string): Appointment[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getKey(shopId, 'appointments'));
  return stored ? JSON.parse(stored) : [];
}

export function saveAppointments(shopId: string, appointments: Appointment[]) {
  localStorage.setItem(getKey(shopId, 'appointments'), JSON.stringify(appointments));
}

// Generate ID
export function genId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
