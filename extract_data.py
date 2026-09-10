import re
import sqlite3
import time
import os

def parse_mysql_values(val_str):
    rows = []
    i = 0
    n = len(val_str)
    
    while i < n:
        while i < n and val_str[i] != '(':
            i += 1
        if i >= n:
            break
        i += 1
        
        row = []
        cur_val = []
        in_quotes = False
        escape = False
        quote_char = None
        
        while i < n:
            c = val_str[i]
            if in_quotes:
                if escape:
                    cur_val.append(c)
                    escape = False
                elif c == '\\':
                    escape = True
                elif c == quote_char:
                    if i + 1 < n and val_str[i+1] == quote_char:
                        cur_val.append(quote_char)
                        i += 1
                    else:
                        in_quotes = False
                else:
                    cur_val.append(c)
            else:
                if c in ("'", '"'):
                    in_quotes = True
                    quote_char = c
                elif c == ',':
                    val = "".join(cur_val).strip()
                    row.append(None if val == 'NULL' else val.strip("'"))
                    cur_val = []
                elif c == ')':
                    val = "".join(cur_val).strip()
                    row.append(None if val == 'NULL' else val.strip("'"))
                    cur_val = []
                    rows.append(row)
                    i += 1
                    break
                else:
                    cur_val.append(c)
            i += 1
    return rows

def extract():
    t0 = time.time()
    db_path = "products.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        code INTEGER,
        name TEXT NOT NULL,
        articul TEXT,
        price REAL DEFAULT 0,
        remainder REAL DEFAULT 0,
        barcodes TEXT,
        deleted INTEGER DEFAULT 0
    );
    """)
    
    cur.execute("CREATE INDEX idx_products_code ON products(code);")
    cur.execute("CREATE INDEX idx_products_name ON products(name);")
    
    cur.execute("""
    CREATE TABLE barcodes (
        barcode TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id)
    );
    """)
    cur.execute("CREATE INDEX idx_barcodes_barcode ON barcodes(barcode);")
    cur.execute("CREATE INDEX idx_barcodes_prod ON barcodes(product_id);")

    # Data containers
    goods_dict = {} # id -> {id, code, name, articul, deleted}
    prices_dict = {} # id -> price
    remainders_dict = {} # id -> quantity
    barcodes_dict = {} # id -> list of barcodes
    
    print("Reading target tables from data.sql...")
    with open('data.sql', 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            if idx > 2500: # We know target tables are before line 2000!
                break
                
            if line.startswith('INSERT INTO `dir_goods`'):
                val_idx = line.find('VALUES ')
                rows = parse_mysql_values(line[val_idx + 7:])
                for r in rows:
                    gid = int(r[0])
                    name = r[1] or ''
                    articul = r[3] or ''
                    code = int(r[7]) if r[7] and r[7].isdigit() else None
                    deleted = int(r[26]) if len(r) > 26 and r[26] and r[26].isdigit() else 0
                    goods_dict[gid] = {
                        'id': gid,
                        'code': code,
                        'name': name,
                        'articul': articul,
                        'deleted': deleted
                    }
            elif line.startswith('INSERT INTO `dir_prices`'):
                val_idx = line.find('VALUES ')
                rows = parse_mysql_values(line[val_idx + 7:])
                for r in rows:
                    # prc_good: r[2], prc_value: r[3], prc_deleted: r[6]
                    try:
                        gid = int(r[2])
                        val = float(r[3])
                        p_del = int(r[6]) if len(r) > 6 and r[6] else 0
                        if p_del == 0:
                            prices_dict[gid] = val
                    except:
                        pass
            elif line.startswith('INSERT INTO `dir_good_remainders`'):
                val_idx = line.find('VALUES ')
                rows = parse_mysql_values(line[val_idx + 7:])
                for r in rows:
                    # objbl_good: r[0], objbl_quantity: r[2]
                    try:
                        gid = int(r[0])
                        qty = float(r[2])
                        remainders_dict[gid] = remainders_dict.get(gid, 0.0) + qty
                    except:
                        pass
            elif line.startswith('INSERT INTO `dir_scans`'):
                val_idx = line.find('VALUES ')
                rows = parse_mysql_values(line[val_idx + 7:])
                for r in rows:
                    # scn_good: r[1], scn_value: r[2]
                    try:
                        gid = int(r[1])
                        bc = (r[2] or '').strip()
                        if bc:
                            barcodes_dict.setdefault(gid, set()).add(bc)
                    except:
                        pass

    print(f"Extracted: {len(goods_dict)} goods, {len(prices_dict)} prices, {len(remainders_dict)} remainders, {len(barcodes_dict)} items with barcodes.")
    
    # Insert into SQLite
    prod_rows = []
    bc_rows = []
    
    for gid, g in goods_dict.items():
        price = prices_dict.get(gid, 0.0)
        rem = remainders_dict.get(gid, 0.0)
        bcs = sorted(list(barcodes_dict.get(gid, [])))
        bc_str = ",".join(bcs)
        
        prod_rows.append((
            g['id'],
            g['code'],
            g['name'],
            g['articul'],
            price,
            rem,
            bc_str,
            g['deleted']
        ))
        
        for bc in bcs:
            bc_rows.append((bc, gid))
            
    cur.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)", prod_rows)
    cur.executemany("INSERT INTO barcodes VALUES (?, ?)", bc_rows)
    conn.commit()
    conn.close()
    
    print(f"Database created: {db_path} ({os.path.getsize(db_path) / 1024:.1f} KB) in {time.time() - t0:.2f}s")

if __name__ == '__main__':
    extract()
