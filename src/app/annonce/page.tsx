import { redirect, permanentRedirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Ancien format `/annonce?id=…` : la redirection principale est faite dans le middleware (308, sans rendu).
// Cette page est le filet de securite si elle n'a pas ete appliquee.
export default async function LegacyAnnoncePage({ searchParams }: PageProps) {
  const { id } = await searchParams

  if (typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id)) {
    permanentRedirect(`/annonce/${id}`)
  }

  redirect('/')
}