#!/bin/bash

# Script de instalación rápida para el Generador de PDF de Versículos Bíblicos
# Ejecuta: chmod +x install.sh && ./install.sh

echo "📖 Instalando Generador de PDF - Versículos Bíblicos"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16 o superior."
    echo "💡 Visita: https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada. Se requiere Node.js 16 o superior."
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm."
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creando archivo de configuración .env..."
    cat > .env << EOF
# Puerto del servidor
PORT=3000

# Configuración de logs
LOG_LEVEL=info
EOF
    echo "✅ Archivo .env creado"
fi

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "🚀 Para iniciar el servidor:"
echo "   npm start"
echo ""
echo "🌐 Para desarrollo con recarga automática:"
echo "   npm run dev"
echo ""
echo "📖 Accede a http://localhost:3000 para usar la interfaz web"
echo "🔗 API endpoint: POST http://localhost:3000/api/generate-pdf"
echo ""
echo "🧪 Para probar la API:"
echo "   curl -X POST http://localhost:3000/api/generate-pdf -H \"Content-Type: application/json\" -d '{\"page\": 0, \"limit\": 10}' --output versiculos.pdf"
echo ""
echo "📚 Lee el README.md para más información" 