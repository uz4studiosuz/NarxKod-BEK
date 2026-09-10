@echo off
chcp 65001 > nul
title NarxKod BEK - Baza Yangilash
cd /d "%~dp0"
echo ======================================================
echo    NarxKod BEK - data.sql dan products.db yasash
echo ======================================================
echo.
python make_db.py
echo.
echo Jarayon tugadi. Oynani yopish uchun istalgan tugmani bosing...
pause > nul
