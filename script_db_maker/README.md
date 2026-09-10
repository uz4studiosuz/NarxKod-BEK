# 🗄️ NarxKod BEK - Baza Yangilovchi Skript (Database Generator)

Ushbu skript MySQL'dan olingan katta hajmdagi `data.sql` faylini tahlil qilib, Next.js ilovasi uchun tayyor, yengil va tezkor `products.db` (SQLite) bazasiga aylantirib beradi.

---

## 📁 Papka tuzilishi:
```
script_db_maker/
├── data/
│   └── data.sql        <-- Yangi data.sql fayli shu yerga tashlanadi
├── make_db.py          <-- Python skript
├── run.bat             <-- Windows uchun 1 marta bosib ishga tushirish fayli
└── products.db         <-- Yaratilgan yangi SQLite baza (avtomatik asosiy papkaga ham koʻchiriladi)
```

---

## 🚀 Ishlatish tartibi:

1. **Yangi faylni joylash:**
   Kassadan yoki serverdan olingan yangi `data.sql` faylini `script_db_maker/data/` papkasiga tashlang:
   `script_db_maker/data/data.sql`

2. **Skriptni ishga tushirish:**
   * **Windows'da:** `run.bat` fayliga sichqoncha bilan ikki marta bosing.
   * **Yoki Terminal/CMD orqali:**
     ```bash
     cd script_db_maker
     python make_db.py
     ```
   * **Yoki loyiha asosiy papkasidan:**
     ```bash
     npm run extract
     ```

3. **Natija:**
   * Skript bir necha soniya ichida tovarlar, yangilangan narxlar va shtrix-kodlarni ajratib oladi.
   * `products.db` bazasini yaratadi.
   * Yangi `products.db` faylini avtomatik ravishda saytning asosiy papkasiga nusxalab qoʻyadi.
   * Sayt darhol yangi narxlar va tovarlar bilan ishlay boshlaydi!
