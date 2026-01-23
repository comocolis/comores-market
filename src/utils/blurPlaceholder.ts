/**
 * Generate a shimmer SVG placeholder as a data URL
 * This creates a subtle animated placeholder while images load
 */
export function getBlurPlaceholder(width: number = 100, height: number = 100) {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <animate attributeName="x1" from="-100%" to="100%" dur="2s" repeatCount="indefinite" />
          <animate attributeName="x2" from="0%" to="200%" dur="2s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shimmer)" />
    </svg>
  `
  
  const base64 = Buffer.from(shimmerSvg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Create a solid color placeholder
 * Useful for specific color schemes
 */
export function getSolidPlaceholder(color: string = '#f3f4f6', width: number = 100, height: number = 100) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${color}"/></svg>`
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Precomputed blur placeholder strings (optimized for common sizes)
 */
export const BLUR_PLACEHOLDERS = {
  product: getBlurPlaceholder(400, 400),  // For product cards
  avatar: getBlurPlaceholder(128, 128),   // For profile avatars
  cover: getBlurPlaceholder(800, 300),    // For cover images
  thumbnail: getBlurPlaceholder(80, 80),  // For small thumbnails
}
