import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { purgeUserStorage } from '@/lib/purgeUserStorage';

/**
 * Suppression definitive du compte :
 *   1. purge des fichiers du Storage (service role),
 *   2. suppression des donnees SQL (RPC `delete_own_account`).
 *
 * Securite : l'identifiant de l'utilisateur est TOUJOURS deduit de la session.
 * Aucun userId n'est accepte depuis le client.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 1. Purge du Storage — avant la suppression du compte, sinon plus d'authentification.
  let purge: Awaited<ReturnType<typeof purgeUserStorage>> | null = null;
  let purgeWarning: string | null = null;

  try {
    purge = await purgeUserStorage(user.id);

    if (purge.errors.length > 0) {
      purgeWarning = purge.errors.join(' | ');
      console.error('Purge Storage partielle :', purge.errors);
    }
  } catch (error) {
    // Une purge impossible ne doit pas empecher l'utilisateur de supprimer son compte.
    purgeWarning = error instanceof Error ? error.message : 'Purge du stockage indisponible';
    console.error('Purge Storage impossible :', error);
  }

  // 2. Suppression du compte et des donnees SQL.
  const { error } = await supabase.rpc('delete_own_account');

  if (error) {
    return NextResponse.json({ error: error.message, purge, purgeWarning }, { status: 500 });
  }

  return NextResponse.json({ success: true, purge, purgeWarning });
}