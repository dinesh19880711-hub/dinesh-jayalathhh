import * as XLSX from 'xlsx';
import { InventoryItem } from '../types/inventory';

export function exportInventoryToExcel(inventory: InventoryItem[], filenamePrefix = 'Stock_Inventory_Count') {
  if (!inventory || inventory.length === 0) return false;

  // 1. Stock Summary Sheet
  const summaryRows = inventory.map((item) => {
    const target = item.targetCount ?? 'N/A';
    const variance = typeof item.targetCount === 'number' ? item.serials.length - item.targetCount : 'N/A';
    const completion = typeof item.targetCount === 'number' && item.targetCount > 0
      ? `${Math.round((item.serials.length / item.targetCount) * 100)}%`
      : 'N/A';

    return {
      'Item Code': item.code,
      'Item Name': item.name,
      'Category': item.category || 'General',
      'Location': item.location || 'Warehouse',
      'Counted Units': item.serials.length,
      'Target Qty': target,
      'Variance': variance,
      'Completion': completion,
      'Last Updated': item.updatedAt,
      'Notes': item.notes || ''
    };
  });

  // 2. Detailed Serial Sheet
  const detailedRows: Array<Record<string, string | number>> = [];
  inventory.forEach((item) => {
    if (item.serials.length === 0) {
      detailedRows.push({
        'Item Code': item.code,
        'Item Name': item.name,
        'Category': item.category || 'General',
        'Unit Number': 0,
        'Serial Number': '(No Serials Counted)',
        'Last Updated': item.updatedAt
      });
    } else {
      item.serials.forEach((serial, idx) => {
        detailedRows.push({
          'Item Code': item.code,
          'Item Name': item.name,
          'Category': item.category || 'General',
          'Unit Number': idx + 1,
          'Serial Number': serial,
          'Last Updated': item.updatedAt
        });
      });
    }
  });

  const workbook = XLSX.utils.book_new();

  // Create worksheets
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailedRows);

  // Set column widths
  summarySheet['!cols'] = [
    { wch: 18 }, // Item Code
    { wch: 36 }, // Item Name
    { wch: 18 }, // Category
    { wch: 18 }, // Location
    { wch: 14 }, // Counted Units
    { wch: 12 }, // Target Qty
    { wch: 12 }, // Variance
    { wch: 14 }, // Completion
    { wch: 16 }, // Last Updated
    { wch: 30 }  // Notes
  ];

  detailSheet['!cols'] = [
    { wch: 18 }, // Item Code
    { wch: 36 }, // Item Name
    { wch: 18 }, // Category
    { wch: 12 }, // Unit Number
    { wch: 28 }, // Serial Number
    { wch: 16 }  // Last Updated
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Stock Summary');
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Serials');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}_${dateStr}.xlsx`);
  return true;
}

export function exportInventoryToCsv(inventory: InventoryItem[], filenamePrefix = 'Stock_Serials') {
  if (!inventory || inventory.length === 0) return false;

  const rows: Array<Record<string, string | number>> = [];
  inventory.forEach((item) => {
    if (item.serials.length === 0) {
      rows.push({
        'Item Code': item.code,
        'Item Name': item.name,
        'Category': item.category || '',
        'Serial Number': '',
        'Unit Index': 0,
        'Last Updated': item.updatedAt
      });
    } else {
      item.serials.forEach((ser, i) => {
        rows.push({
          'Item Code': item.code,
          'Item Name': item.name,
          'Category': item.category || '',
          'Serial Number': ser,
          'Unit Index': i + 1,
          'Last Updated': item.updatedAt
        });
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function exportBackupJson(inventory: InventoryItem[]) {
  const data = JSON.stringify(inventory, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Stock_Tracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
