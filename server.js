require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const htmlPdf = require('html-pdf-node');

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

// Get all posts data endpoint (for search functionality)
app.get('/api/all-posts-data', async (req, res) => {
  try {
    // Fetch all posts from gvbible.com API (multiple pages)
    const allPosts = await fetchAllPostsFromGVBible();
    
    if (!allPosts || allPosts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron versículos' });
    }
    
    res.json(allPosts);
    
  } catch (error) {
    console.error('Error fetching all posts data:', error);
    res.status(500).json({ message: 'Error obteniendo datos de versículos', error: error.message });
  }
});

// Generate custom PDF with selected verses
app.post('/api/generate-pdf-custom', async (req, res) => {
  try {
    const { verses, title = 'Versículos Seleccionados' } = req.body;
    
    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron versículos válidos' });
    }
    
    // Generate HTML content for PDF
    const htmlContent = await generateHTMLContent(verses, title);
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(htmlContent);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="versiculos-seleccionados-${Date.now()}.pdf"`);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating custom PDF:', error);
    res.status(500).json({ message: 'Error generando PDF personalizado', error: error.message });
  }
});

// Test endpoint for PDF generation
app.get('/api/test-pdf', async (req, res) => {
  try {
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test PDF</title>
      </head>
      <body>
        <h1>Test PDF Generation</h1>
        <p>This is a test to verify PDF generation is working.</p>
      </body>
      </html>
    `;
    
    const pdfBuffer = await generatePDF(testHTML);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error in test PDF:', error);
    res.status(500).json({ message: 'Error en test PDF', error: error.message });
  }
});

// Fetch posts from gvbible.com API
async function fetchPostsFromGVBible(page, limit) {
  try {
    const url = `https://gvbible.com/api/posts?page=${page}&limit=${limit}`;
    console.log('Fetching from:', url);
    
    const response = await axios.get(url);
    
    console.log(`Fetched ${response.data.length} posts`);
    
    return response.data;
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
      
      const response = await axios.get(url);
      
      console.log(`Fetched ${response.data.length} posts from page ${page}`);
      
      if (response.data.length === 0) {
        hasMorePosts = false;
      } else {
        allPosts.push(...response.data);
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
    
    const response = await axios.get(url);
    
    console.log('Profile fetched:', response.data.name);
    
    return response.data;
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
      day: 'numeric'
    });

    return `
      <div style="
        background: ${color}15;
        border-left: 4px solid ${color};
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        page-break-inside: avoid;
      ">
        <h3 style="
          color: ${color};
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
        ">${post.title}</h3>
        
        <p style="
          color: #2c3e50;
          line-height: 1.6;
          margin: 0 0 15px 0;
          font-size: 14px;
        ">${post.content}</p>
        
        <div style="
          font-size: 12px;
          color: #7f8c8d;
          border-top: 1px solid #ecf0f1;
          padding-top: 10px;
        ">
          <span>📅 ${formattedDate}</span>
          <span style="float: right;">📖 GV Bible</span>
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
      background: #f8f9fa;
      border: 3px solid #e9ecef;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: #6c757d;
      font-size: 24px;
      font-weight: bold;
    ">
      📖
    </div>`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; }
        .stats { font-size: 12px; color: #888; }
        .content { margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${title}</h1>
        <p class="subtitle">${profile.bio || 'Versículos bíblicos diarios'}</p>
        <div class="stats">
          📖 ${posts.length} versículos • 📅 ${new Date().toLocaleDateString('es-ES')} • 👤 ${profile.name}
        </div>
      </div>
      
      <div class="content">
        ${postsHTML}
      </div>
      
      <div class="footer">
        <p>❤️ Generado con amor por ${profile.name || 'GV Bible'}</p>
        <p>📧 Suscríbete para recibir versículos diarios</p>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF using html-pdf-node
async function generatePDF(htmlContent) {
  try {
    console.log('Starting PDF generation...');
    console.log('HTML content length:', htmlContent.length);
    
    // Optimize HTML content for faster processing
    const optimizedHTML = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove complex CSS
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Compress whitespace
      .trim();
    
    console.log('Optimized HTML length:', optimizedHTML.length);
    
    const options = {
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: false, // Disable background for faster processing
      preferCSSPageSize: false, // Disable for faster processing
      timeout: 30000 // Reduce timeout to 30 seconds
    };
    
    const file = { content: optimizedHTML };
    
    console.log('Generating PDF with html-pdf-node...');
    const pdfBuffer = await Promise.race([
      htmlPdf.generatePdf(file, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
      )
    ]);
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
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
          background: #ffffff;
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
          max-width: 800px;
          width: 100%;
        }
        
        .header {
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
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
          border-color: #ff0000;
          background: white;
          box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
        }
        
        .search-section {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          border: 2px solid #e9ecef;
        }
        
        .search-section h3 {
          margin-bottom: 15px;
          color: #2c3e50;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .verses-section {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          border: 2px solid #e9ecef;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .verses-section h3 {
          margin-bottom: 15px;
          color: #2c3e50;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .select-all-container {
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 10px;
          border: 2px solid #e9ecef;
        }
        
        .select-all-container label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #2c3e50;
          cursor: pointer;
        }
        
        .select-all-container input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .verse-item {
          background: white;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 10px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .verse-item:hover {
          border-color: #ff0000;
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.1);
        }
        
        .verse-item label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          margin: 0;
        }
        
        .verse-item input[type="checkbox"] {
          width: auto;
          margin: 0;
          margin-top: 2px;
        }
        
        .verse-content {
          flex: 1;
        }
        
        .verse-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 16px;
        }
        
        .verse-text {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.5;
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
          background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 0, 0, 0.3);
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
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
        
        .no-verses {
          text-align: center;
          color: #6c757d;
          padding: 40px 20px;
          font-style: italic;
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
            <div class="logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45,4.9,1,6v14.65c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z"/>
              </svg>
            </div>
            <h1 class="title">Generador de PDF</h1>
            <p class="subtitle">Versículos Bíblicos Profesionales</p>
          </div>
        </div>
        
        <div class="content">
          <div class="search-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
              Buscar Versículos
            </h3>
            <div class="form-group">
              <label for="search">
                Buscar por título o contenido:
              </label>
              <input type="text" id="search" name="search" placeholder="Escribe para buscar versículos...">
            </div>
            <button type="button" class="btn btn-primary" onclick="searchVerses()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
              Buscar
            </button>
          </div>
          
          <div class="verses-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45,4.9,1,6v14.65c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z"/>
              </svg>
              Versículos Disponibles
            </h3>
            
            <div class="select-all-container">
              <label>
                <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                <span>Seleccionar Todos</span>
              </label>
            </div>
            
            <div id="versesList">
              <div class="no-verses">
                Cargando versículos...
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
              Título del PDF:
            </label>
            <input type="text" id="title" name="title" value="Versículos y Reflexiones Bíblicas" placeholder="Título personalizado">
          </div>
          
          <div class="button-group">
            <button type="button" class="btn btn-primary" onclick="downloadSelectedVerses()" id="downloadBtn" disabled>
              <span class="btn-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Descargar Versículos
              </span>
              <span class="btn-loading" style="display: none;">
                <span class="loading-spinner"></span>
                Descargando...
              </span>
            </button>
            
            <button type="button" class="btn btn-secondary" onclick="downloadAllVerses()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z"/>
              </svg>
              Descargar Todos
            </button>
          </div>
          
          <div id="status" class="status"></div>
        </div>
      
      <script>
        let allVerses = [];
        let filteredVerses = [];
        
        const statusDiv = document.getElementById('status');
        const downloadBtn = document.getElementById('downloadBtn');
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
        
        function renderVerses(verses) {
          const versesList = document.getElementById('versesList');
          
          if (verses.length === 0) {
            versesList.innerHTML = '<div class="no-verses">No se encontraron versículos</div>';
            return;
          }
          
          versesList.innerHTML = verses.map((verse, index) => \`
            <div class="verse-item">
              <label>
                <input type="checkbox" class="verse-checkbox" value="\${index}" onchange="updateDownloadButton()">
                <div class="verse-content">
                  <div class="verse-title">\${verse.title}</div>
                  <div class="verse-text">\${verse.content.substring(0, 100)}\${verse.content.length > 100 ? '...' : ''}</div>
                </div>
              </label>
            </div>
          \`).join('');
          
          updateDownloadButton();
        }
        
        function updateDownloadButton() {
          const checkboxes = document.querySelectorAll('.verse-checkbox:checked');
          downloadBtn.disabled = checkboxes.length === 0;
        }
        
        function toggleSelectAll() {
          const selectAllCheckbox = document.getElementById('selectAll');
          const checkboxes = document.querySelectorAll('.verse-checkbox');
          
          checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
          });
          
          updateDownloadButton();
        }
        
        async function loadAllVerses() {
          showStatus('⏳ Cargando todos los versículos...', 'loading');
          
          try {
            const response = await fetch('/api/all-posts-data');
            
            if (response.ok) {
              allVerses = await response.json();
              filteredVerses = [...allVerses]; // Start with all verses
              
              renderVerses(filteredVerses);
              
              if (allVerses.length > 0) {
                showStatus(\`✅ Se cargaron \${allVerses.length} versículos\`, 'success');
              } else {
                showStatus('❌ No se encontraron versículos', 'error');
              }
            } else {
              showStatus('❌ Error al cargar versículos', 'error');
            }
          } catch (error) {
            showStatus('❌ Error de conexión: ' + error.message, 'error');
          }
        }
        
        async function searchVerses() {
          const searchTerm = document.getElementById('search').value.trim();
          
          if (!searchTerm) {
            // If search is empty, show all verses
            filteredVerses = [...allVerses];
            renderVerses(filteredVerses);
            showStatus(\`✅ Mostrando todos los \${allVerses.length} versículos\`, 'success');
            return;
          }
          
          showStatus('⏳ Buscando versículos...', 'loading');
          
          // Filter verses based on search term
          filteredVerses = allVerses.filter(verse => 
            verse.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            verse.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          renderVerses(filteredVerses);
          
          if (filteredVerses.length > 0) {
            showStatus(\`✅ Se encontraron \${filteredVerses.length} versículos\`, 'success');
          } else {
            showStatus('❌ No se encontraron versículos con ese término', 'error');
          }
        }
        
        async function downloadSelectedVerses() {
          const checkboxes = document.querySelectorAll('.verse-checkbox:checked');
          
          if (checkboxes.length === 0) {
            showStatus('❌ Por favor selecciona al menos un versículo', 'error');
            return;
          }
          
          const selectedVerses = Array.from(checkboxes).map(checkbox => 
            filteredVerses[parseInt(checkbox.value)]
          );
          
          showLoading();
          showStatus('⏳ Generando PDF con versículos seleccionados...', 'loading');
          
          try {
            const response = await fetch('/api/generate-pdf-custom', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                verses: selectedVerses,
                title: document.getElementById('title').value || 'Versículos Seleccionados'
              })
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'versiculos-seleccionados.pdf';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              showStatus(\`✅ PDF generado con \${selectedVerses.length} versículos seleccionados\`, 'success');
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
        
        async function downloadAllVerses() {
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
        
        // Load all verses when page loads
        document.addEventListener('DOMContentLoaded', function() {
          loadAllVerses();
        });
        
        // Allow search on Enter key
        document.getElementById('search').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            searchVerses();
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