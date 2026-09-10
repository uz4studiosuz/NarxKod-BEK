// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export interface Product {
  id: number;
  code: number | null;
  name: string;
  articul: string;
  price: number;
  remainder: number;
  barcodes: string;
  deleted: number;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'products.db');
    dbInstance = new DatabaseSync(dbPath, { readOnly: true });
  }
  return dbInstance;
}

/**
 * Find a product by exact barcode
 */
export function getProductByBarcode(barcode: string): Product | null {
  const db = getDb();
  const cleanBarcode = barcode.trim();
  
  // 1. Check in barcodes table
  const stmt = db.prepare(`
    SELECT p.* FROM products p
    JOIN barcodes b ON p.id = b.product_id
    WHERE b.barcode = ?
    LIMIT 1
  `);
  
  const result = stmt.get(cleanBarcode) as unknown as Product | undefined;
  if (result) return result;

  // 2. Also check if barcode was passed as code
  const codeNum = parseInt(cleanBarcode, 10);
  if (!isNaN(codeNum)) {
    return getProductByCode(codeNum);
  }

  return null;
}

/**
 * Find a product by exact internal code (e.g. 10006)
 */
export function getProductByCode(code: number): Product | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE code = ?
    LIMIT 1
  `);
  const result = stmt.get(code) as unknown as Product | undefined;
  return result || null;
}

/**
 * Search products by query (matches name, code, or barcode)
 */
export function searchProducts(query: string, limit: number = 30): Product[] {
  const db = getDb();
  const q = query.trim();
  if (!q) return [];

  const codeNum = parseInt(q, 10);

  // If numeric, prioritize exact code or barcode match first
  if (!isNaN(codeNum) && q.length <= 8) {
    const byCode = db.prepare(`SELECT * FROM products WHERE code = ? LIMIT 1`).get(codeNum) as unknown as Product | undefined;
    if (byCode) {
      // Also fetch others matching name
      const stmtOthers = db.prepare(`
        SELECT * FROM products 
        WHERE (name LIKE ? OR code = ?) AND id != ?
        ORDER BY deleted ASC, remainder DESC, name ASC
        LIMIT ?
      `);
      const others = stmtOthers.all(`%${q}%`, codeNum, byCode.id, limit - 1) as unknown as Product[];
      return [byCode, ...others];
    }
  }

  // Check barcode match first
  const byBarcode = db.prepare(`
    SELECT p.* FROM products p
    JOIN barcodes b ON p.id = b.product_id
    WHERE b.barcode = ?
    LIMIT 1
  `).get(q) as unknown as Product | undefined;

  if (byBarcode) {
    return [byBarcode];
  }

  // Name or code search
  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE name LIKE ? OR articul LIKE ? OR code LIKE ?
    ORDER BY 
      CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
      deleted ASC,
      remainder DESC
    LIMIT ?
  `);

  const term = `%${q}%`;
  const startsWithTerm = `${q}%`;
  return stmt.all(term, term, term, startsWithTerm, limit) as unknown as Product[];
}
