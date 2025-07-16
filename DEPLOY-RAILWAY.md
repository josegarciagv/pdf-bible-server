# 🚀 Guía de Despliegue en Railway

## 📋 Pasos para Publicar

### 1. Preparar el Repositorio

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit - Bible PDF Generator for Railway"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/bible-pdf-generator.git
git branch -M main
git push -u origin main
```

### 2. Desplegar en Railway

#### Opción A: Desde la Web (Recomendado)

1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio de GitHub
6. Railway detectará automáticamente la configuración

#### Opción B: Desde CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

### 3. Configuración en Railway

#### Variables de Entorno

En Railway Dashboard → Variables:

```env
NODE_ENV=production
PORT=3000
```

#### Configuración del Servicio

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### 4. Verificar el Despliegue

Una vez desplegado, Railway te dará una URL como:
`https://tu-proyecto-production.up.railway.app`

#### Probar la API:

```bash
# Health check
curl https://tu-proyecto-production.up.railway.app/api/health

# Generar PDF
curl -X POST https://tu-proyecto-production.up.railway.app/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "limit": 10}' \
  --output versiculos.pdf
```

### 5. Dominio Personalizado (Opcional)

En Railway Dashboard:

1. Ve a tu proyecto
2. Selecciona el servicio
3. Ve a "Settings" → "Domains"
4. Agrega tu dominio personalizado

## 🔧 Optimizaciones para Railway

### Archivos Incluidos

- ✅ `railway.json` - Configuración específica
- ✅ `.railwayignore` - Archivos a excluir
- ✅ `package.json` - Dependencias y scripts
- ✅ `server.js` - Servidor principal

### Características Optimizadas

- ✅ Health check automático
- ✅ Restart automático en fallos
- ✅ Variables de entorno
- ✅ Logs automáticos
- ✅ Escalado automático

## 🚨 Solución de Problemas

### Error: "Build failed"

- Verifica que `package.json` esté correcto
- Revisa los logs en Railway Dashboard
- Asegúrate de que todas las dependencias estén listadas

### Error: "Application failed to start"

- Verifica que el puerto sea `process.env.PORT`
- Revisa que `npm start` funcione localmente
- Revisa los logs de Railway

### Error: "Puppeteer not found"

- Railway incluye Chromium automáticamente
- El código ya está configurado para Railway

## 📊 Monitoreo

Railway proporciona:

- ✅ Logs en tiempo real
- ✅ Métricas de uso
- ✅ Alertas automáticas
- ✅ Health checks

## 💰 Costos

Railway tiene un plan gratuito que incluye:

- ✅ 500 horas de ejecución por mes
- ✅ 1GB de almacenamiento
- ✅ Dominio personalizado
- ✅ SSL automático

---

**¡Tu generador de PDF estará disponible globalmente en minutos!** 🌍✨
