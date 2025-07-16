#!/bin/bash

echo "🚀 Iniciando Generador de PDF - Versículos Bíblicos"
echo "================================================"

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
fi

# Verificar si el servidor ya está ejecutándose
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  El puerto 3000 ya está en uso"
    echo "💡 Deteniendo proceso anterior..."
    pkill -f "node.*server.js" 2>/dev/null
    sleep 2
fi

echo "🚀 Iniciando servidor..."
echo "📖 Accede a: http://localhost:3000"
echo "🔗 API: POST http://localhost:3000/api/generate-pdf"
echo ""
echo "💡 Presiona Ctrl+C para detener el servidor"
echo ""

npm start 