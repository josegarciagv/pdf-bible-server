@echo off
chcp 65001 >nul

echo 📖 Instalando Generador de PDF - Versículos Bíblicos
echo ==================================================

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 16 o superior.
    echo 💡 Visita: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar versión de Node.js
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 16 (
    echo ❌ Node.js versión %NODE_VERSION% detectada. Se requiere Node.js 16 o superior.
    pause
    exit /b 1
)

echo ✅ Node.js detectado

REM Verificar si npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado. Por favor instala npm.
    pause
    exit /b 1
)

echo ✅ npm detectado

REM Instalar dependencias
echo.
echo 📦 Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente

REM Crear archivo .env si no existe
if not exist .env (
    echo.
    echo ⚙️  Creando archivo de configuración .env...
    (
        echo # Puerto del servidor
        echo PORT=3000
        echo.
        echo # Configuración de logs
        echo LOG_LEVEL=info
    ) > .env
    echo ✅ Archivo .env creado
)

echo.
echo 🎉 ¡Instalación completada!
echo.
echo 🚀 Para iniciar el servidor:
echo    npm start
echo.
echo 🌐 Para desarrollo con recarga automática:
echo    npm run dev
echo.
echo 📖 Accede a http://localhost:3000 para usar la interfaz web
echo 🔗 API endpoint: POST http://localhost:3000/api/generate-pdf
echo.
echo 🧪 Para probar la API:
echo    Accede a http://localhost:3000 para usar la interfaz web
echo.
echo 📚 Lee el README.md para más información
echo.
pause 