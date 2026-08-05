@echo off
title ePC Asistencia - Servidor Portable
echo ====================================================
echo   Iniciando Servidor de ePC Asistencia...
echo ====================================================
echo.

:: Verificar si Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Node.js no esta instalado en esta maquina.
  echo Por favor instala Node.js (https://nodejs.org) antes de continuar.
  echo.
  pause
  exit
)

:: Intentar instalar las dependencias si no existen
if not exist "node_modules\" (
  echo No se encontro la carpeta node_modules. Instalando dependencias...
  npm install --production
  echo.
)

:: Lanzar el navegador automaticamente en http://localhost:3000
echo Abriendo ePC Asistencia en tu navegador...
start "" "http://localhost:3000"

:: Iniciar la aplicacion
node server.js

pause
