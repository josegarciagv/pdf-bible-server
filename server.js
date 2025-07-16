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
    const htmlContent = await generateHTMLContent(posts, title);
    
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

// Get all posts without limit endpoint
app.get('/api/all-posts', async (req, res) => {
  try {
    const { title = 'Todos los Versículos Bíblicos' } = req.query;
    
    // Fetch all posts from gvbible.com API (multiple pages)
    const allPosts = await fetchAllPostsFromGVBible();
    
    if (!allPosts || allPosts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron versículos' });
    }
    
    // Generate HTML content for PDF
    const htmlContent = await generateHTMLContent(allPosts, title);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(htmlContent);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="todos-los-versiculos-${Date.now()}.pdf"`);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF with all posts:', error);
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

// Fetch all posts from gvbible.com API (multiple pages)
async function fetchAllPostsFromGVBible() {
  try {
    console.log('Fetching all posts from gvbible.com...');
    
    const allPosts = [];
    let page = 0;
    let hasMorePosts = true;
    
    while (hasMorePosts) {
      const url = `https://gvbible.com/api/posts?page=${page}&limit=50`;
      console.log(`Fetching page ${page} from:`, url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      console.log(`Fetched ${posts.length} posts from page ${page}`);
      
      if (posts.length === 0) {
        hasMorePosts = false;
      } else {
        allPosts.push(...posts);
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 100) {
          console.log('Reached safety limit of 100 pages, stopping...');
          hasMorePosts = false;
        }
      }
    }
    
    console.log(`Total posts fetched: ${allPosts.length}`);
    return allPosts;
  } catch (error) {
    console.error('Error fetching all posts from gvbible.com:', error);
    throw error;
  }
}

// Fetch profile info from gvbible.com
async function fetchProfileFromGVBible() {
  try {
    const url = 'https://gvbible.com/api/profile';
    console.log('Fetching profile from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('Profile fetched:', profile.name);
    
    return profile;
  } catch (error) {
    console.error('Error fetching profile from gvbible.com:', error);
    // Return default profile if error
    return {
      name: 'GV Bible',
      bio: 'Versículos y Reflexiones Bíblicas',
      avatar: null
    };
  }
}

// Generate HTML content for PDF
async function generateHTMLContent(posts, title) {
  // Fetch profile info for avatar and branding
  const profile = await fetchProfileFromGVBible();
  
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
        border-radius: 12px;
        padding: 25px;
        margin: 25px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
      ">
        <h3 style="
          color: ${color};
          margin: 0 0 18px 0;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.3;
        ">${post.title}</h3>
        
        <p style="
          color: #2c3e50;
          line-height: 1.7;
          margin: 0 0 20px 0;
          font-size: 15px;
          text-align: justify;
        ">${post.content}</p>
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #7f8c8d;
          border-top: 1px solid #ecf0f1;
          padding-top: 15px;
        ">
          <span style="font-weight: 500;">📅 ${formattedDate}</span>
          <span style="font-weight: 500;">✍️ ${post.author || 'GV Bible'}</span>
        </div>
      </div>
    `;
  }).join('');

  // Create avatar HTML
  const avatarHTML = profile.avatar ? 
    `<img src="${profile.avatar}" alt="${profile.name}" style="
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">` :
    `<div class="logo" style="
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">
      📖
    </div>`;

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
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .header {
          text-align: center;
          padding: 40px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .avatar-container {
          margin-bottom: 25px;
        }
        
        .title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .subtitle {
          font-size: 18px;
          font-weight: 400;
          opacity: 0.9;
          margin-bottom: 25px;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 14px;
          opacity: 0.8;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .reflection-block {
          page-break-inside: avoid;
          margin-bottom: 30px;
        }
        
        .footer {
          text-align: center;
          padding: 30px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        
        @media print {
          body {
            background: #fff;
          }
          
          .container {
            box-shadow: none;
            border-radius: 0;
          }
          
          .reflection-block {
            page-break-inside: avoid;
            margin: 20px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="avatar-container">
              ${avatarHTML}
            </div>
            <h1 class="title">${title}</h1>
            <p class="subtitle">${profile.bio || 'Versículos bíblicos diarios • Recibe inspiración, fe y esperanza cada día'}</p>
            <div class="stats">
              <span>📖 ${posts.length} versículos</span>
              <span>📅 ${new Date().toLocaleDateString('es-ES')}</span>
              <span>✨ ${profile.name}</span>
            </div>
          </div>
        </div>
        
        <div class="content">
          ${postsHTML}
        </div>
        
        <div class="footer">
          <p>Generado con ❤️ por ${profile.name || 'GV Bible'}</p>
          <p>📧 Suscríbete para recibir versículos diarios en tu correo</p>
        </div>
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

// Serve a professional web interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Generador de PDF - Versículos Bíblicos</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          max-width: 600px;
          width: 100%;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.3);
        }
        
        .title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        }
        
        input, select {
          width: 100%;
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .button-group {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }
        
        .btn {
          flex: 1;
          padding: 15px 20px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
          background: #f8f9fa;
          color: #6c757d;
          border: 2px solid #e9ecef;
        }
        
        .btn-secondary:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }
        
        .status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 10px;
          font-weight: 500;
          text-align: center;
          display: none;
        }
        
        .status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .status.loading {
          background: #cce5ff;
          color: #004085;
          border: 1px solid #b8daff;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .info {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 30px;
          border-left: 4px solid #2196f3;
        }
        
        .info h3 {
          color: #1976d2;
          margin-bottom: 10px;
          font-size: 18px;
        }
        
        .info ul {
          list-style: none;
          padding: 0;
        }
        
        .info li {
          margin-bottom: 8px;
          color: #424242;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .info li::before {
          content: "✓";
          color: #4caf50;
          font-weight: bold;
        }
        
        @media (max-width: 768px) {
          .button-group {
            flex-direction: column;
          }
          
          .container {
            margin: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="logo">📖</div>
            <h1 class="title">Generador de PDF</h1>
            <p class="subtitle">Versículos Bíblicos Profesionales</p>
          </div>
        </div>
        
        <div class="content">
          <div class="info">
            <h3>✨ Características</h3>
            <ul>
              <li>Diseño profesional sin iconos</li>
              <li>Avatar e información de gvbible.com</li>
              <li>Colores dinámicos para cada versículo</li>
              <li>Formato optimizado para impresión</li>
            </ul>
          </div>
          
          <form id="pdfForm">
            <div class="form-group">
              <label for="page">📄 Página:</label>
              <input type="number" id="page" name="page" value="0" min="0" placeholder="0 = primera página">
            </div>
            
            <div class="form-group">
              <label for="limit">📊 Versículos por página:</label>
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
              <label for="title">📝 Título del PDF:</label>
              <input type="text" id="title" name="title" value="Versículos y Reflexiones Bíblicas" placeholder="Título personalizado">
            </div>
            
            <div class="button-group">
              <button type="submit" class="btn btn-primary">
                <span class="btn-text">📄 Generar PDF</span>
                <span class="btn-loading" style="display: none;">
                  <span class="loading-spinner"></span>
                  Downloading...
                </span>
              </button>
              
              <button type="button" class="btn btn-secondary" onclick="generateAllPosts()">
                📚 Todos los Versículos
              </button>
            </div>
          </form>
          
          <div id="status" class="status"></div>
        </div>
      </div>
      
      <script>
        const form = document.getElementById('pdfForm');
        const statusDiv = document.getElementById('status');
        const btnText = document.querySelector('.btn-text');
        const btnLoading = document.querySelector('.btn-loading');
        
        function showStatus(message, type) {
          statusDiv.textContent = message;
          statusDiv.className = \`status \${type}\`;
          statusDiv.style.display = 'block';
        }
        
        function showLoading() {
          btnText.style.display = 'none';
          btnLoading.style.display = 'flex';
        }
        
        function hideLoading() {
          btnText.style.display = 'flex';
          btnLoading.style.display = 'none';
        }
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          showLoading();
          showStatus('⏳ Descargando PDF...', 'loading');
          
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
              
              showStatus('✅ PDF generado y descargado exitosamente', 'success');
            } else {
              const error = await response.json();
              showStatus('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
            }
          } catch (error) {
            showStatus('❌ Error de conexión: ' + error.message, 'error');
          } finally {
            hideLoading();
          }
        });
        
        async function generateAllPosts() {
          showLoading();
          showStatus('⏳ Descargando todos los versículos...', 'loading');
          
          try {
            const response = await fetch('/api/all-posts?title=Todos los Versículos Bíblicos', {
              method: 'GET'
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'todos-los-versiculos.pdf';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              showStatus('✅ Todos los versículos generados y descargados', 'success');
            } else {
              const error = await response.json();
              showStatus('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
            }
          } catch (error) {
            showStatus('❌ Error de conexión: ' + error.message, 'error');
          } finally {
            hideLoading();
          }
        }
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