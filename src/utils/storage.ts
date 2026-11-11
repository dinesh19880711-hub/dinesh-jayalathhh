import { InventoryItem, ScanLog } from '../types/inventory';

const INVENTORY_KEY = 'smart_stock_inventory_v1';
const ACTIVE_ITEM_ID_KEY = 'smart_stock_active_item_id_v1';
const SCAN_LOGS_KEY = 'smart_stock_logs_v1';
const SOUND_KEY = 'smart_stock_sound_v1';
const LANG_KEY = 'smart_stock_lang_v1';

export const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: 'item-1',
    code: 'SKU-JBL-PB520',
    name: 'JBL PartyBox 520 Bluetooth Speaker',
    category: 'Audio Hardware',
    location: 'Aisle 2 - Bay B',
    targetCount: 5,
    serials: ['JBL520-SN-892144', 'JBL520-SN-892145', 'JBL520-SN-892146'],
    createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
    notes: 'Warranty card enclosed in packaging'
  },
  {
    id: 'item-2',
    code: 'SKU-SNY-WH1005',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Audio Hardware',
    location: 'Aisle 2 - Bay C',
    targetCount: 4,
    serials: ['SNY-XM5-00192', 'SNY-XM5-00193', 'SNY-XM5-00194', 'SNY-XM5-00195'],
    createdAt: new Date(Date.now() - 86400000).toLocaleDateString(),
    updatedAt: new Date(Date.now() - 3600000).toLocaleTimeString(),
    notes: 'Black Edition stock count'
  },
  {
    id: 'item-3',
    code: 'SKU-SAM-S24U-256',
    name: 'Samsung Galaxy S24 Ultra 256GB Titanium Gray',
    category: 'Smartphones',
    location: 'Secure Cage 1',
    targetCount: 6,
    serials: ['IMEI-358921094812301', 'IMEI-358921094812302'],
    createdAt: new Date(Date.now() - 3600000 * 5).toLocaleDateString(),
    updatedAt: new Date(Date.now() - 1800000).toLocaleTimeString(),
    notes: 'Seal inspection verified'
  },
  {
    id: 'item-4',
    code: 'SKU-ANK-737-PB',
    name: 'Anker 737 Power Bank (PowerCore 24K 140W)',
    category: 'Accessories',
    location: 'Aisle 4 - Shelf A',
    targetCount: 8,
    serials: ['ANK-737-881901', 'ANK-737-881902', 'ANK-737-881903'],
    createdAt: new Date(Date.now() - 3600000 * 8).toLocaleDateString(),
    updatedAt: new Date(Date.now() - 900000).toLocaleTimeString(),
    notes: 'Includes 140W USB-C cable'
  }
];

export function loadStoredInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) {
      // First-time visit: return sample items so app starts nicely populated
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(SAMPLE_INVENTORY));
      return SAMPLE_INVENTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load inventory from localStorage', e);
    return [];
  }
}

export function saveStoredInventory(items: InventoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save inventory to localStorage', e);
  }
}

export function loadStoredActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_ITEM_ID_KEY);
}

export function saveStoredActiveId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_ITEM_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_ITEM_ID_KEY);
  }
}

export function loadStoredLogs(): ScanLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCAN_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredLogs(logs: ScanLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep most recent 100 logs
    localStorage.setItem(SCAN_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save logs to localStorage', e);
  }
}

export function loadSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(SOUND_KEY);
  return raw !== null ? raw === 'true' : true;
}

export function saveSoundSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_KEY, String(enabled));
}

export function loadLangSetting(): 'en' | 'si' {
  if (typeof window === 'undefined') return 'en';
  const raw = localStorage.getItem(LANG_KEY);
  return raw === 'si' ? 'si' : 'en';
}

export function saveLangSetting(lang: 'en' | 'si'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANG_KEY, lang);
}
