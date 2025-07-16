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
          <span style="font-weight: 500;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
              <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1"/>
            </svg>
            ${formattedDate}
          </span>
          <span style="font-weight: 500;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
              <path d="M16,4C16.56,4 17,4.44 17,5V7H19V5A3,3 0 0,0 16,2C15.44,2 15,2.44 15,3V5H17V3C17,2.44 16.56,2 16,2M12,5V7H14V5C14,4.44 13.56,4 13,4C12.44,4 12,4.44 12,5M9,4C8.44,4 8,4.44 8,5V7H10V5C10,4.44 9.56,4 9,4M6,5V7H8V5C8,4.44 7.56,4 7,4C6.44,4 6,4.44 6,5M3,6V18A2,2 0 0,0 5,20H19A2,2 0 0,0 21,18V6H3Z"/>
            </svg>
            GV Bible
          </span>
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
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
                  <path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45,4.9,1,6v14.65c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z"/>
                </svg>
                ${posts.length} versículos
              </span>
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
                  <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1"/>
                </svg>
                ${new Date().toLocaleDateString('es-ES')}
              </span>
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                </svg>
                ${profile.name}
              </span>
            </div>
          </div>
        </div>
        
        <div class="content">
          ${postsHTML}
        </div>
        
        <div class="footer">
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
            </svg>
            Generado con amor por ${profile.name || 'GV Bible'}
          </p>
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 4px;">
              <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
            </svg>
            Suscríbete para recibir versículos diarios en tu correo
          </p>
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
          max-width: 600px;
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
          <div class="info">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 8px;">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
              </svg>
              Características
            </h3>
            <ul>
              <li>Diseño profesional sin iconos</li>
              <li>Avatar e información de gvbible.com</li>
              <li>Colores dinámicos para cada versículo</li>
              <li>Formato optimizado para impresión</li>
            </ul>
          </div>
          
          <form id="pdfForm">
            <div class="form-group">
              <label for="page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Página:
              </label>
              <input type="number" id="page" name="page" value="0" min="0" placeholder="0 = primera página">
            </div>
            
            <div class="form-group">
              <label for="limit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                  <path d="M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z"/>
                </svg>
                Versículos por página:
              </label>
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
              <label for="title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
                Título del PDF:
              </label>
              <input type="text" id="title" name="title" value="Versículos y Reflexiones Bíblicas" placeholder="Título personalizado">
            </div>
            
            <div class="button-group">
              <button type="submit" class="btn btn-primary">
                <span class="btn-text">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Generar PDF
                </span>
                <span class="btn-loading" style="display: none;">
                  <span class="loading-spinner"></span>
                  Downloading...
                </span>
              </button>
              
              <button type="button" class="btn btn-secondary" onclick="generateAllPosts()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-right: 6px;">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z"/>
                </svg>
                Todos los Versículos
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