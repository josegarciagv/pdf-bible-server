module.exports = {
  apps: [
    {
      name: 'bible-pdf-generator',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Configuración de logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuración de monitoreo
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Configuración de reinicio automático
      autorestart: true,
      watch: false,
      
      // Configuración de variables de entorno para Puppeteer
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser'
      }
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:gvbible/bible-pdf-generator.git',
      path: '/var/www/bible-pdf-generator',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}; 