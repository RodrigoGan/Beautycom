/**
 * Script para converter ícones SVG para PNG
 * Requer: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [48, 72, 96, 144, 192, 512];
const inputDir = path.join(__dirname, '../public');
const outputDir = path.join(__dirname, '../public');

async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Convertido: ${path.basename(svgPath)} → ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Erro ao converter ${svgPath}:`, error.message);
  }
}

async function convertAllIcons() {
  console.log('🎨 Convertendo ícones SVG para PNG...\n');
  
  for (const size of sizes) {
    const svgPath = path.join(inputDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, size);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${svgPath}`);
    }
  }
  
  console.log('\n🎉 Conversão concluída!');
}

// Executar se chamado diretamente
if (require.main === module) {
  convertAllIcons().catch(console.error);
}

module.exports = { convertAllIcons, convertSvgToPng };
