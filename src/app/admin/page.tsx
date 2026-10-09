import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminClient from './AdminClient'

// Meme regle que AdminClient : super admin par email, ou role admin / super_admin dans `profiles`.
const SUPER_ADMIN_EMAIL = 'abdesisco1@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const isSuper = user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL
  if (!isSuper) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/')
  }

  return <AdminClient />
}
