import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase "service role" : il contourne le RLS.
 *
 * A utiliser UNIQUEMENT cote serveur, et uniquement pour des operations
 * d'administration (ici : purge du Storage a la suppression de compte).
 *
 * ⚠️ Cette cle ne doit JAMAIS etre exposee au client : ne jamais la nommer
 * NEXT_PUBLIC_*, et ne jamais l'utiliser depuis un composant client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL est absente des variables d’environnement.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY est absente des variables d’environnement.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}