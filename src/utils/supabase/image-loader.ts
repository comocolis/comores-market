
/**
 * Custom Image Loader for Supabase Storage
 * documentation: https://supabase.com/docs/guides/storage/image-transformations
 */
export default function supabaseLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // 1. Check if the image is from Supabase Storage
  const isSupabase = src.includes('supabase.co/storage/v1/object/public');
  
  if (isSupabase) {
    // 2. Append transformation parameters
    // We use 'origin' (Supabase) to resize instead of Next.js server
    // Note: This requires Supabase Image Transformations to be enabled (Pro Plan or specific configuration)
    // If not enabled, it might just ignore params or return original.
    // However, for a "heavy" site, offloading to CDN is best.
    
    const params = new URLSearchParams();
    params.set('width', width.toString());
    params.set('quality', (quality || 75).toString());
    params.set('format', 'webp'); // Force WebP for better compression
    
    // Handle existing query params in src if any
    const [baseUrl, existingQuery] = src.split('?');
    if (existingQuery) {
        // We could merge, but usually storage URLs don't have params we want to keep if we resize
    }
    
    return `${baseUrl}?${params.toString()}`;
  }

  // 3. Fallback for other images (e.g. local /placeholder.png or external providers)
  // If we misuse this loader for local images, we just return the path.
  // Note: Local images won't be resized by this loader! 
  // So only apply this loader to Supabase images.
  return src;
}
