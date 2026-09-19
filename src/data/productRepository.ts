import { getDatabase } from '../db/database';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  updated_at: string;
}

export function listProducts(category?: string): Product[] {
  const db = getDatabase();
  const rows = category
    ? db.getAllSync<any>(`SELECT * FROM products WHERE in_stock = 1 AND category = ? ORDER BY name ASC`, category)
    : db.getAllSync<any>(`SELECT * FROM products WHERE in_stock = 1 ORDER BY name ASC`);
  return rows.map(row => ({ ...row, in_stock: Boolean(row.in_stock) }));
}

export function getProductCategories(): string[] {
  const rows = getDatabase().getAllSync<{ category: string }>(
    `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND in_stock = 1 ORDER BY category ASC`
  );
  return rows.map(r => r.category);
}
