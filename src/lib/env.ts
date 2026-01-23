/**
 * Environment variable validation
 * Lightweight validation without external dependencies
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_GA_ID?: string
  NEXT_PUBLIC_GOOGLE_ADS_ID?: string
  GROQ_API_KEY?: string
  RESEND_API_KEY?: string
  SENTRY_AUTH_TOKEN?: string
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Validate environment variables at runtime
 * Ensures critical configuration is present
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = []

  // Required variables validation
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach((err) => console.error(`  - ${err}`))
    // En production, on veut peut-être éviter de crasher complètement le build pour une var manquante si elle n'est pas critique immédiatement, 
    // mais ici on throw une erreur pour être sûr.
    throw new Error('Invalid environment configuration')
  }

  return {
    // CORRECTION ICI : Ajout de || "" pour garantir le type string
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    
    // Les optionnels (?) peuvent rester tels quels
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    
    // Cast sécurisé pour NODE_ENV
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  }
}

// Export type for convenience
export type Environment = EnvConfig