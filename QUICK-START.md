# 🚀 Inicio Rápido - Generador de PDF Versículos Bíblicos

## ⚡ Instalación y Uso Rápido

### Windows

```bash
# 1. Instalar dependencias
install.bat

# 2. Iniciar servidor
start.bat
```

### Linux/Mac

```bash
# 1. Hacer ejecutables los scripts
chmod +x install.sh start.sh

# 2. Instalar dependencias
./install.sh

# 3. Iniciar servidor
./start.sh
```

### Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start
```

## 🌐 Uso

### Interfaz Web

Accede a `http://localhost:3000` para usar la interfaz web.

### API REST

```bash
# Generar PDF con 10 versículos de la primera página
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "limit": 10}' \
  --output versiculos.pdf
```

## 📋 Parámetros

- `page`: Número de página (0 = primera)
- `limit`: Versículos por página (máximo 50)
- `title`: Título personalizado del PDF

## 🎯 Características

✅ **Sin iconos** - Como solicitaste  
✅ **Diseño bonito** - PDFs profesionales  
✅ **API externa** - Conecta con gvbible.com  
✅ **Múltiples formatos** - 5-50 versículos por página  
✅ **Colores dinámicos** - Cada versículo mantiene su color

## 🐳 Docker (Opcional)

```bash
# Construir y ejecutar con Docker
docker-compose up -d

# O manualmente
docker build -t bible-pdf-generator .
docker run -p 3000:3000 bible-pdf-generator
```

## 🧪 Pruebas

```bash
# Ejecutar pruebas automáticas
node test-example.js
```

## 📚 Más Información

Lee el `README.md` completo para detalles avanzados, configuración y solución de problemas.

---

**¡Listo para generar PDFs bonitos de versículos bíblicos sin iconos!** 📖✨
