/**
 * Safe JSON parsing utility for product images
 * Handles both JSON arrays and single string values
 */
export function parseProductImages(imagesData: any): string[] {
  if (!imagesData) return []
  
  try {
    // If it's already a string, try to parse as JSON
    if (typeof imagesData === 'string') {
      const parsed = JSON.parse(imagesData)
      return Array.isArray(parsed) ? parsed : [parsed]
    }
    
    // If it's already an array, return it
    if (Array.isArray(imagesData)) {
      return imagesData
    }
    
    // If it's an object, try to extract image property
    if (typeof imagesData === 'object') {
      return [imagesData.toString()]
    }
    
    return []
  } catch (error) {
    // If parsing fails, treat as single string value
    return typeof imagesData === 'string' && imagesData.trim() ? [imagesData] : []
  }
}

/**
 * Get first image from product images
 * Returns undefined if no images available
 */
export function getFirstProductImage(imagesData: any): string | undefined {
  const images = parseProductImages(imagesData)
  return images[0]
}
