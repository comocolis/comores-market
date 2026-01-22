const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

async function compressLogo() {
  const filePath = path.join(publicDir, 'logo.png');
  const backupPath = path.join(publicDir, 'logo.png.backup');
  
  if (!fs.existsSync(filePath)) {
    console.log('logo.png not found');
    return;
  }
  
  try {
    console.log('🔧 Optimizing logo.png further...\n');
    
    const originalSize = fs.statSync(filePath).size / 1024;
    
    // More aggressive compression for logo
    await sharp(filePath)
      .png({ 
        quality: 60,
        compressionLevel: 9,
        palette: true,
        colors: 128 // Reduce color palette
      })
      .toFile(filePath + '.tmp');
    
    fs.renameSync(filePath + '.tmp', filePath);
    
    const newSize = fs.statSync(filePath).size / 1024;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ logo.png optimized`);
    console.log(`   ${originalSize.toFixed(2)}KB → ${newSize.toFixed(2)}KB (${reduction}% reduction)\n`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

compressLogo();
