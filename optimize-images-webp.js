/**
 * Image Optimization Script - Convert to WebP
 * Run with: node optimize-images-webp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesToOptimize = [
  { input: 'public/android-chrome-512x512.png', output: 'public/android-chrome-512x512.webp' },
  { input: 'public/logo.png', output: 'public/logo.webp' },
  { input: 'public/placeholder.png', output: 'public/placeholder.webp' },
  { input: 'public/web-app-manifest-512x512.png', output: 'public/web-app-manifest-512x512.webp' },
  { input: 'public/cover-default.jpg', output: 'public/cover-default.webp' },
  { input: 'public/web-app-manifest-192x192.png', output: 'public/web-app-manifest-192x192.webp' },
  { input: 'public/apple-touch-icon.png', output: 'public/apple-touch-icon.webp' },
  { input: 'public/android-chrome-192x192.png', output: 'public/android-chrome-192x192.webp' },
  { input: 'public/logo-splash.png', output: 'public/logo-splash.webp' },
];

async function optimizeImages() {
  console.log('🖼️  Starting WebP optimization...\n');
  
  let totalSavings = 0;
  
  for (const img of imagesToOptimize) {
    try {
      const inputPath = path.resolve(img.input);
      const outputPath = path.resolve(img.output);
      
      if (!fs.existsSync(inputPath)) {
        console.log(`⚠️  Skipping ${img.input} (not found)`);
        continue;
      }
      
      const originalSize = fs.statSync(inputPath).size;
      
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);
      
      const newSize = fs.statSync(outputPath).size;
      const savings = originalSize - newSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
      
      totalSavings += savings;
      
      console.log(`✅ ${img.input}`);
      console.log(`   ${(originalSize / 1024).toFixed(2)} KB → ${(newSize / 1024).toFixed(2)} KB`);
      console.log(`   Saved: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%)\n`);
      
    } catch (error) {
      console.log(`❌ Error processing ${img.input}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Total savings: ${(totalSavings / 1024).toFixed(2)} KB`);
  console.log('\n📝 Next steps:');
  console.log('1. Update manifest.json to use .webp versions');
  console.log('2. Update Image components to use WebP with PNG fallback');
  console.log('3. Run build to verify everything works');
}

optimizeImages().catch(console.error);
