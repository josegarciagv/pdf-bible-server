#!/usr/bin/env node

/**
 * Script de ejemplo para probar el generador de PDF
 * Ejecuta: node test-example.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPDFGeneration() {
  console.log('🧪 Probando el generador de PDF...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Probando health check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('');

    // Test 2: Generar PDF con 5 versículos
    console.log('2️⃣ Generando PDF con 5 versículos...');
    const pdfResponse1 = await fetch(`${BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: 0,
        limit: 5,
        title: 'Versículos de Prueba'
      })
    });

    if (pdfResponse1.ok) {
      const pdfBuffer = await pdfResponse1.buffer();
      console.log(`✅ PDF generado exitosamente (${pdfBuffer.length} bytes)`);
      
      // Guardar el PDF
      const fs = require('fs');
      fs.writeFileSync('test-5-versiculos.pdf', pdfBuffer);
      console.log('💾 PDF guardado como: test-5-versiculos.pdf');
    } else {
      const error = await pdfResponse1.json();
      console.log('❌ Error:', error.message);
    }
    console.log('');

    // Test 3: Generar PDF con 10 versículos
    console.log('3️⃣ Generando PDF con 10 versículos...');
    const pdfResponse2 = await fetch(`${BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: 0,
        limit: 10,
        title: 'Versículos y Reflexiones Bíblicas'
      })
    });

    if (pdfResponse2.ok) {
      const pdfBuffer = await pdfResponse2.buffer();
      console.log(`✅ PDF generado exitosamente (${pdfBuffer.length} bytes)`);
      
      // Guardar el PDF
      const fs = require('fs');
      fs.writeFileSync('test-10-versiculos.pdf', pdfBuffer);
      console.log('💾 PDF guardado como: test-10-versiculos.pdf');
    } else {
      const error = await pdfResponse2.json();
      console.log('❌ Error:', error.message);
    }
    console.log('');

    // Test 4: Probar página que no existe
    console.log('4️⃣ Probando página que no existe...');
    const pdfResponse3 = await fetch(`${BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: 999,
        limit: 10
      })
    });

    if (pdfResponse3.ok) {
      console.log('✅ PDF generado (página existe)');
    } else {
      const error = await pdfResponse3.json();
      console.log('❌ Error esperado:', error.message);
    }
    console.log('');

    console.log('🎉 ¡Todas las pruebas completadas!');
    console.log('📁 Revisa los archivos PDF generados en el directorio actual.');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.log('');
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    console.log('💡 Ejecuta: npm start');
  }
}

// Función para probar diferentes configuraciones
async function testDifferentConfigurations() {
  console.log('🔧 Probando diferentes configuraciones...\n');

  const configurations = [
    { page: 0, limit: 5, title: 'Versículos Cortos' },
    { page: 0, limit: 15, title: 'Reflexiones Meditativas' },
    { page: 1, limit: 10, title: 'Segunda Página de Versículos' },
    { page: 0, limit: 30, title: 'Colección Completa' }
  ];

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    console.log(`${i + 1}️⃣ Probando: ${config.title} (página ${config.page}, ${config.limit} versículos)`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const pdfBuffer = await response.buffer();
        const fs = require('fs');
        const filename = `test-config-${i + 1}.pdf`;
        fs.writeFileSync(filename, pdfBuffer);
        console.log(`✅ Generado: ${filename} (${pdfBuffer.length} bytes)`);
      } else {
        const error = await response.json();
        console.log(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }
    console.log('');
  }
}

// Ejecutar pruebas
if (require.main === module) {
  console.log('🚀 Iniciando pruebas del generador de PDF...\n');
  
  // Ejecutar pruebas básicas
  testPDFGeneration().then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🔧 PRUEBAS AVANZADAS');
    console.log('='.repeat(50));
    
    // Ejecutar pruebas de diferentes configuraciones
    return testDifferentConfigurations();
  }).then(() => {
    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('📖 Revisa los archivos PDF generados para verificar la calidad.');
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  testPDFGeneration,
  testDifferentConfigurations
}; 