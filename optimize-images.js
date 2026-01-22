const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

const imagesToCompress = [
  { file: 'logo.png', quality: 75 },
  { file: 'android-chrome-512x512.png', quality: 70 },
  { file: 'placeholder.png', quality: 70 },
  { file: 'web-app-manifest-512x512.png', quality: 75 },
  { file: 'cover-default.jpg', quality: 65 },
];

async function compressImages() {
  console.log('🖼️  Starting image compression...\n');
  
  for (const { file, quality } of imagesToCompress) {
    const filePath = path.join(publicDir, file);
    const backupPath = path.join(publicDir, `${file}.backup`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file} not found, skipping...\n`);
      continue;
    }
    
    try {
      // Create backup
      fs.copyFileSync(filePath, backupPath);
      
      const originalSize = fs.statSync(filePath).size / 1024;
      const isJpeg = file.endsWith('.jpg') || file.endsWith('.jpeg');
      
      // Compress based on file type
      if (isJpeg) {
        await sharp(filePath)
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toFile(filePath + '.tmp');
      } else {
        await sharp(filePath)
          .png({ quality, compressionLevel: 9 })
          .toFile(filePath + '.tmp');
      }
      
      // Replace original
      fs.renameSync(filePath + '.tmp', filePath);
      
      const newSize = fs.statSync(filePath).size / 1024;
      const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ ${file}`);
      console.log(`   ${originalSize.toFixed(2)}KB → ${newSize.toFixed(2)}KB (${reduction}% reduction)\n`);
    } catch (error) {
      console.error(`❌ Error compressing ${file}:`, error.message);
      // Restore backup
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);
      }
    }
  }
  
  // Clean up backups
  imagesToCompress.forEach(({ file }) => {
    const backupPath = path.join(publicDir, `${file}.backup`);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  });
  
  console.log('🎉 Image compression complete!');
}

compressImages().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
