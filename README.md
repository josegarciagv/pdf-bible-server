# 📖 Generador de PDF - Versículos Bíblicos

Un servidor Node.js que genera PDFs bonitos de versículos bíblicos desde [gvbible.com](https://gvbible.com) **sin iconos**, como solicitaste.

## ✨ Características

- 🚀 **Sin iconos**: Los PDFs se generan sin los iconos interactivos
- 🎨 **Diseño bonito**: PDFs con diseño moderno y profesional
- 📱 **Responsive**: Optimizado para diferentes tamaños de página
- 🔄 **API externa**: Conecta con la API de gvbible.com
- 📄 **Múltiples formatos**: Soporte para diferentes cantidades de versículos
- 🌈 **Colores dinámicos**: Cada versículo tiene su color según la configuración

## 🛠️ Instalación

1. **Clona el repositorio:**

```bash
git clone https://github.com/tu-usuario/bible-pdf-generator.git
cd bible-pdf-generator
```

2. **Instala las dependencias:**

```bash
npm install
```

3. **Configura las variables de entorno (opcional):**

```bash
cp .env.example .env
# Edita .env según tus necesidades
```

4. **Ejecuta el servidor:**

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

## 🚀 Uso

### Interfaz Web

Accede a `http://localhost:3000` para usar la interfaz web que te permite:

- Seleccionar la página de versículos
- Elegir cuántos versículos por página
- Personalizar el título del PDF
- Generar y descargar el PDF

### API REST

#### Generar PDF

```bash
POST /api/generate-pdf
Content-Type: application/json

{
  "page": 0,           // Página (0 = primera)
  "limit": 10,         // Versículos por página (máximo 50)
  "title": "Versículos y Reflexiones Bíblicas"
}
```

#### Ejemplos de uso:

**Primera página con 10 versículos:**

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "limit": 10}' \
  --output versiculos.pdf
```

**Segunda página con 30 versículos:**

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "limit": 30}' \
  --output versiculos-pagina2.pdf
```

**Con título personalizado:**

```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"page": 0, "limit": 15, "title": "Mis Versículos Favoritos"}' \
  --output mis-versiculos.pdf
```

### Health Check

```bash
GET /api/health
```

## 📋 Parámetros de la API

| Parámetro | Tipo   | Descripción                       | Valor por defecto                   |
| --------- | ------ | --------------------------------- | ----------------------------------- |
| `page`    | number | Número de página (0 = primera)    | 0                                   |
| `limit`   | number | Versículos por página (máximo 50) | 10                                  |
| `title`   | string | Título personalizado del PDF      | "Versículos y Reflexiones Bíblicas" |

## 🎨 Características del PDF

- **Sin iconos**: Como solicitaste, no incluye iconos interactivos
- **Diseño limpio**: Solo contenido esencial
- **Colores dinámicos**: Cada versículo mantiene su color original
- **Tipografía moderna**: Usa la fuente Inter para mejor legibilidad
- **Formato A4**: Optimizado para impresión
- **Márgenes apropiados**: 20mm en todos los lados
- **Page breaks**: Evita cortes en medio de versículos

## 🔧 Configuración

### Variables de entorno (.env)

```env
# Puerto del servidor
PORT=3000

# Configuración de Puppeteer (opcional)
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Configuración de logs
LOG_LEVEL=info
```

### Dependencias principales

- **Express**: Servidor web
- **Puppeteer**: Generación de PDFs
- **CORS**: Soporte para peticiones cross-origin
- **dotenv**: Manejo de variables de entorno

## 🐳 Docker (Opcional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Construir imagen
docker build -t bible-pdf-generator .

# Ejecutar contenedor
docker run -p 3000:3000 bible-pdf-generator
```

## 📊 Ejemplos de uso de la API de gvbible.com

La API de gvbible.com funciona así:

- `page=0` → Primera página
- `page=1` → Segunda página
- `limit=10` → 10 versículos por página
- `limit=30` → 30 versículos por página

**URLs de ejemplo:**

- `https://gvbible.com/api/posts?page=0&limit=10` - Primera página, 10 versículos
- `https://gvbible.com/api/posts?page=1&limit=30` - Segunda página, 30 versículos

## 🚨 Solución de problemas

### Error: "No se encontraron versículos"

- Verifica que la página solicitada existe
- Intenta con `page=0` para la primera página
- Revisa que `limit` no sea muy alto

### Error de Puppeteer

- En Linux, puede necesitar Chrome instalado
- En Docker, usa la imagen con Chrome incluido
- En Windows, asegúrate de tener los permisos necesarios

### Error de conexión a gvbible.com

- Verifica tu conexión a internet
- La API de gvbible.com debe estar disponible
- Revisa los logs del servidor

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- [gvbible.com](https://gvbible.com) por proporcionar la API de versículos
- [Puppeteer](https://pptr.dev/) por la generación de PDFs
- [Express](https://expressjs.com/) por el framework web

---

**¡Disfruta generando PDFs bonitos de versículos bíblicos sin iconos!** 📖✨
