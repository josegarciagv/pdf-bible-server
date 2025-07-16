@echo off
chcp 65001 >nul

echo 🚀 Iniciando Generador de PDF - Versículos Bíblicos
echo ================================================

REM Verificar si las dependencias están instaladas
if not exist node_modules (
    echo 📦 Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

REM Verificar si el servidor ya está ejecutándose
netstat -an | find "3000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  El puerto 3000 ya está en uso
    echo 💡 Deteniendo proceso anterior...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 >nul
)

echo 🚀 Iniciando servidor...
echo 📖 Accede a: http://localhost:3000
echo 🔗 API: POST http://localhost:3000/api/generate-pdf
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

call npm start 