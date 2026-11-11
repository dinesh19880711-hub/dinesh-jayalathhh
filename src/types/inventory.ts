export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  location?: string;
  targetCount?: number | null;
  serials: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type ScanTarget = 'item' | 'serial';

export type Language = 'en' | 'si';

export interface ScanLog {
  id: string;
  timestamp: string;
  type: 'serial_added' | 'serial_removed' | 'item_selected' | 'item_created' | 'duplicate_blocked';
  itemCode: string;
  itemName: string;
  detail: string;
  isError?: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}
