require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Set default environment variables
process.env.PORT = process.env.PORT || 3000;

// PDF Generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { page = 0, limit = 10, title = 'Versículos y Reflexiones Bíblicas' } = req.body;
    
    // Fetch posts from gvbible.com API
    const posts = await fetchPostsFromGVBible(page, limit);
    
    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron versículos' });
    }
    
    // Generate HTML content for PDF
    const htmlContent = generateHTMLContent(posts, title);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(htmlContent);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="versiculos-biblicos-${Date.now()}.pdf"`);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generando PDF', error: error.message });
  }
});

// Fetch posts from gvbible.com API
async function fetchPostsFromGVBible(page, limit) {
  try {
    const url = `https://gvbible.com/api/posts?page=${page}&limit=${limit}`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const posts = await response.json();
    console.log(`Fetched ${posts.length} posts`);
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts from gvbible.com:', error);
    throw error;
  }
}

// Generate HTML content for PDF
function generateHTMLContent(posts, title) {
  const colorMap = {
    0: '#4CAF50', // Green
    1: '#9C27B0', // Purple
    2: '#FF9800', // Orange
    3: '#2196F3', // Blue
    4: '#F44336', // Red
    5: '#607D8B', // Blue Grey
    6: '#795548', // Brown
    7: '#E91E63', // Pink
    8: '#00BCD4', // Cyan
    9: '#8BC34A'  // Light Green
  };

  const postsHTML = posts.map((post, index) => {
    const color = colorMap[post.color] || colorMap[0];
    const formattedDate = new Date(post.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="reflection-block" style="
        background: ${color}15;
        border-left: 4px solid ${color};
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <h3 style="
          color: ${color};
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
        ">${post.title}</h3>
        
        <p style="
          color: #333;
          line-height: 1.6;
          margin: 0 0 15px 0;
          font-size: 14px;
        ">${post.content}</p>
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #666;
        ">
          <span>${formattedDate}</span>
          <span>${post.author || 'Admin'}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        
        .logo::before {
          content: "📖";
          font-size: 32px;
        }
        
        .title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 16px;
          color: #666;
          font-weight: 400;
          margin-bottom: 20px;
        }
        
        .subscribe-info {
          font-size: 14px;
          color: #888;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ff0000;
        }
        
        .content {
          margin-top: 30px;
        }
        
        .reflection-block {
          page-break-inside: avoid;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .reflection-block {
            page-break-inside: avoid;
            margin: 15px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo"></div>
        <h1 class="title">${title}</h1>
        <p class="subtitle">Versículos bíblicos diarios • Recibe inspiración, fe y esperanza cada día</p>
        <div class="subscribe-info">
          ✓ Suscríbete para recibir versículos diarios en tu correo
        </div>
      </div>
      
      <div class="content">
        ${postsHTML}
      </div>
    </body>
    </html>
  `;
}

// Generate PDF using Puppeteer
async function generatePDF(htmlContent) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for fonts to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait a bit more for fonts to render properly
    await page.waitForTimeout(1000);
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      preferCSSPageSize: true
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF Generator Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Generador de PDF - Versículos Bíblicos</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          line-height: 1.6;
        }
        .container {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 10px;
          border-left: 4px solid #ff0000;
        }
        h1 { color: #333; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button {
          background: #ff0000;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover { background: #cc0000; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📖 Generador de PDF - Versículos Bíblicos</h1>
        
        <div class="info">
          <strong>Instrucciones:</strong><br>
          • page: Número de página (0 = primera página)<br>
          • limit: Cantidad de versículos por página (máximo 50)<br>
          • title: Título personalizado del PDF
        </div>
        
        <form id="pdfForm">
          <div class="form-group">
            <label for="page">Página:</label>
            <input type="number" id="page" name="page" value="0" min="0">
          </div>
          
          <div class="form-group">
            <label for="limit">Versículos por página:</label>
            <select id="limit" name="limit">
              <option value="5">5 versículos</option>
              <option value="10" selected>10 versículos</option>
              <option value="15">15 versículos</option>
              <option value="20">20 versículos</option>
              <option value="30">30 versículos</option>
              <option value="50">50 versículos</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="title">Título del PDF:</label>
            <input type="text" id="title" name="title" value="Versículos y Reflexiones Bíblicas">
          </div>
          
          <button type="submit">📄 Generar PDF</button>
        </form>
        
        <div id="status" style="margin-top: 20px;"></div>
      </div>
      
      <script>
        document.getElementById('pdfForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const statusDiv = document.getElementById('status');
          statusDiv.innerHTML = '⏳ Generando PDF...';
          
          const formData = new FormData(e.target);
          const data = {
            page: parseInt(formData.get('page')),
            limit: parseInt(formData.get('limit')),
            title: formData.get('title')
          };
          
          try {
            const response = await fetch('/api/generate-pdf', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'versiculos-biblicos.pdf';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              statusDiv.innerHTML = '✅ PDF generado exitosamente';
            } else {
              const error = await response.json();
              statusDiv.innerHTML = '❌ Error: ' + (error.message || 'Error desconocido');
            }
          } catch (error) {
            statusDiv.innerHTML = '❌ Error de conexión: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor PDF Generator ejecutándose en puerto ${PORT}`);
  console.log(`📖 Accede a http://localhost:${PORT} para generar PDFs`);
  console.log(`🔗 API endpoint: POST http://localhost:${PORT}/api/generate-pdf`);
}); 