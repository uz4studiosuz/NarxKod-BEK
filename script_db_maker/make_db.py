#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NarxKod BEK - Database Generator (make_db.py)
Ushbu skript data.sql (MySQL dump) faylidan tovarlar, narxlar va shtrix-kodlarni
ajratib olib, Next.js ilovasi uchun tayyor products.db (SQLite) bazasini yaratadi.
"""

import os
import sys
import time
import shutil
import sqlite3

# Windows terminal UTF-8 encoding support
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def parse_mysql_values(val_str):
    """
    MySQL VALUES (...), (...) qatorlarini tezkor parser qilish.
    """
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
                    if i + 1 < n and val_str[i + 1] == quote_char:
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

def find_sql_file():
    """
    data.sql faylini bir nechta ehtimoliy yo'llardan qidirish.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "data", "data.sql"),
        os.path.join(script_dir, "data.sql"),
        os.path.join(os.path.dirname(script_dir), "data.sql"),
        os.path.join(os.getcwd(), "data", "data.sql"),
        os.path.join(os.getcwd(), "data.sql"),
    ]
    
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None

def main():
    print("=" * 60)
    print("   NARXKOD BEK - DATA.SQL -> PRODUCTS.DB GENERATOR")
    print("=" * 60)
    
    sql_path = find_sql_file()
    
    if not sql_path:
        print("\n[XATOLIK] data.sql fayli topilmadi!")
        print("Iltimos, data.sql faylini quyidagi papkalardan biriga joylang:")
        print("  1) script_db_maker/data/data.sql")
        print("  2) Loyihaning asosiy papkasi: data.sql")
        print("=" * 60)
        sys.exit(1)
        
    file_size_mb = os.path.getsize(sql_path) / (1024 * 1024)
    print(f"\n[1/4] SQL fayl topildi: {sql_path}")
    print(f"      Hajmi: {file_size_mb:.2f} MB")
    
    t0 = time.time()
    
    # Ma'lumot konteynerlari
    goods_dict = {}       # id -> {id, code, name, articul, deleted}
    prices_dict = {}      # id -> price
    remainders_dict = {}  # id -> quantity
    barcodes_dict = {}    # id -> set of barcodes
    
    print("\n[2/4] Jadvallarni oʻqish va tahlil qilish boshlandi...")
    
    found_tables = set()
    processed_lines = 0
    
    with open(sql_path, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            processed_lines = idx
            
            # Agar asosiy 4 ta jadval to'liq o'qib bo'lingan bo'lsa va keyingi doc_ jadvallari boshlansa, to'xtash
            if len(found_tables) >= 4 and (line.startswith('INSERT INTO `doc_') or line.startswith('CREATE TABLE `doc_')):
                print(f"      Asosiy ma'lumotlar {idx:,}-qatorda to'liq o'qib bo'lindi. Tranzaksiya jadvallari o'tkazib yuborilmoqda.")
                break
                
            if '`dir_goods`' in line and line.startswith('INSERT INTO'):
                found_tables.add('dir_goods')
                val_idx = line.find('VALUES ')
                if val_idx != -1:
                    rows = parse_mysql_values(line[val_idx + 7:])
                    for r in rows:
                        try:
                            gid = int(r[0])
                            name = (r[1] or '').strip()
                            articul = (r[3] or '').strip()
                            code = int(r[7]) if len(r) > 7 and r[7] and r[7].isdigit() else None
                            deleted = int(r[26]) if len(r) > 26 and r[26] and r[26].isdigit() else 0
                            goods_dict[gid] = {
                                'id': gid,
                                'code': code,
                                'name': name,
                                'articul': articul,
                                'deleted': deleted
                            }
                        except Exception:
                            pass

            elif '`dir_prices`' in line and line.startswith('INSERT INTO'):
                found_tables.add('dir_prices')
                val_idx = line.find('VALUES ')
                if val_idx != -1:
                    rows = parse_mysql_values(line[val_idx + 7:])
                    for r in rows:
                        try:
                            gid = int(r[2])
                            val = float(r[3])
                            p_del = int(r[6]) if len(r) > 6 and r[6] else 0
                            if p_del == 0:
                                prices_dict[gid] = val
                        except Exception:
                            pass

            elif '`dir_good_remainders`' in line and line.startswith('INSERT INTO'):
                found_tables.add('dir_good_remainders')
                val_idx = line.find('VALUES ')
                if val_idx != -1:
                    rows = parse_mysql_values(line[val_idx + 7:])
                    for r in rows:
                        try:
                            gid = int(r[0])
                            qty = float(r[2])
                            remainders_dict[gid] = remainders_dict.get(gid, 0.0) + qty
                        except Exception:
                            pass

            elif '`dir_scans`' in line and line.startswith('INSERT INTO'):
                found_tables.add('dir_scans')
                val_idx = line.find('VALUES ')
                if val_idx != -1:
                    rows = parse_mysql_values(line[val_idx + 7:])
                    for r in rows:
                        try:
                            gid = int(r[1])
                            bc = (r[2] or '').strip()
                            if bc:
                                barcodes_dict.setdefault(gid, set()).add(bc)
                        except Exception:
                            pass

    t_read = time.time() - t0
    print(f"      Oʻqilgan qatorlar soni: {processed_lines:,} ta ({t_read:.2f} soniya)")
    print(f"      Topildi:")
    print(f"        • Tovarlar: {len(goods_dict):,} ta")
    print(f"        • Narxlar: {len(prices_dict):,} ta")
    print(f"        • Shtrix-kodli tovarlar: {len(barcodes_dict):,} ta")

    if not goods_dict:
        print("\n[XATOLIK] data.sql ichidan tovarlar (dir_goods) topilmadi!")
        sys.exit(1)

    # SQLite bazasini yaratish
    print("\n[3/4] SQLite (products.db) bazasi yaratilmoqda va indekslanmoqda...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    local_db_path = os.path.join(script_dir, "products.db")
    
    if os.path.exists(local_db_path):
        os.remove(local_db_path)

    conn = sqlite3.connect(local_db_path)
    cur = conn.cursor()

    # Baza jadvallari
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

    db_size_mb = os.path.getsize(local_db_path) / (1024 * 1024)

    # Asosiy loyiha papkasiga nusxalash
    print("\n[4/4] Yangi products.db asosiy loyihaga oʻrnatilmoqda...")
    root_dir = os.path.dirname(script_dir)
    root_db_path = os.path.join(root_dir, "products.db")
    
    try:
        shutil.copy2(local_db_path, root_db_path)
        print(f"      Asosiy loyiha bazasi muvaffaqiyatli yangilandi: {root_db_path}")
    except Exception as e:
        print(f"      [Ogohlantirish] Asosiy papkaga koʻchirishda xatolik: {e}")

    total_time = time.time() - t0
    print("\n" + "=" * 60)
    print("   [MUVAFFAQIYATLI YAKUNLANDI]")
    print(f"   • Jami tovarlar: {len(prod_rows):,} ta")
    print(f"   • Jami shtrix-kodlar: {len(bc_rows):,} ta")
    print(f"   • products.db hajmi: {db_size_mb:.2f} MB")
    print(f"   • Umumiy vaqt: {total_time:.2f} soniya")
    print("=" * 60)

if __name__ == '__main__':
    main()
