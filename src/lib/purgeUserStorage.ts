import 'server-only';

import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Purge des fichiers d'un utilisateur dans le Storage Supabase.
 * Remplace l'ancienne Edge Function `delete-user-data` (qui n'a jamais ete
 * reellement deployee) : la suppression de compte passe maintenant par la route
 * Next `/api/account/delete`.
 */

const BUCKETS = ['avatars', 'products', 'messages_images'] as const;
const PAGE_SIZE = 100;

export interface PurgeResult {
  removed: Record<string, number>;
  errors: string[];
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Supprime recursivement le contenu du dossier `{userId}` d'un bucket.
 * La suppression decale la pagination, donc on recommence toujours a 0.
 */
async function removeFolder(admin: AdminClient, bucket: string, userId: string): Promise<number> {
  let removed = 0;

  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: PAGE_SIZE });

    if (error) {
      throw new Error(`Impossible de lister le dossier dans "${bucket}" : ${error.message}`);
    }

    const files = (data ?? []).filter((file) => file.id);

    if (files.length === 0) break;

    const paths = files.map((file) => `${userId}/${file.name}`);
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);

    if (removeError) {
      throw new Error(`Impossible de supprimer dans "${bucket}" : ${removeError.message}`);
    }

    removed += paths.length;

    // Si on a vid&eacute; tout un lot, on recommence a 0 (les index ont d&eacute;cal&eacute;).
    if (files.length < PAGE_SIZE) break;
  }

  return removed;
}

export async function purgeUserStorage(userId: string): Promise<PurgeResult> {
  const admin = createAdminClient();
  const removed: Record<string, number> = {};
  const errors: string[] = [];

  for (const bucket of BUCKETS) {
    try {
      removed[bucket] = await removeFolder(admin, bucket, userId);
    } catch (error) {
      removed[bucket] = 0;
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  // Ancien format : certains avatars &eacute;taient stock&eacute;s &agrave; la racine du bucket.
  try {
    await admin.storage.from('avatars').remove([
      `${userId}.jpg`,
      `${userId}.png`,
      `${userId}.jpeg`,
      `${userId}.webp`,
    ]);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { removed, errors };
}