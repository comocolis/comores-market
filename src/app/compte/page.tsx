'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, User, MapPin, Trash2, Plus, Home as HomeIcon, Search, MessageCircle, Edit2, Save, X, Camera, Loader2, Phone, CheckCircle, Star } from 'lucide-react'

const inputStyle = "w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all"

export default function ComptePage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myProducts, setMyProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ full_name: '', phone_number: '', island: 'Ngazidja' })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/publier'); return }
      setUser(user)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profile)
      if (profile) setEditData({ full_name: profile.full_name || '', phone_number: profile.phone_number || '', island: profile.island || 'Ngazidja' })
      const { data: products } = await supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setMyProducts(products || [])
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    setUploadingAvatar(true)
    const file = e.target.files[0]
    const fileName = `${user.id}/avatar_${Date.now()}.${file.name.split('.').pop()}`
    try {
        const { error: uErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
        if (uErr) throw uErr
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
        setProfile({ ...profile, avatar_url: publicUrl })
    } catch (error: any) { alert("Erreur : " + error.message) } finally { setUploadingAvatar(false) }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: editData.full_name, phone_number: editData.phone_number, island: editData.island }).eq('id', user.id)
    if (error) alert("Erreur : " + error.message); else { setProfile({ ...profile, ...editData }); setIsEditing(false) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer l'annonce ?")) return
    await supabase.from('products').delete().eq('id', id)
    setMyProducts(myProducts.filter(p => p.id !== id))
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-sans relative">
      <div className="bg-brand pb-32 pt-safe px-6 rounded-b-[2.5rem] shadow-sm relative z-0">
        <div className="flex justify-between items-center mb-4"><h1 className="text-white font-bold text-xl">Mon Profil</h1><button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full transition shadow-md"><LogOut size={18} /></button></div>
      </div>
      <div className="px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="absolute top-4 right-4">{!isEditing ? <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-brand bg-gray-50 p-2 rounded-full transition"><Edit2 size={18} /></button> : <div className="flex gap-2"><button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full"><X size={18} /></button><button onClick={handleSaveProfile} disabled={saving} className="text-white bg-brand p-2 rounded-full shadow-md transition disabled:opacity-50">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}</button></div>}</div>
            <div className="flex flex-col items-center text-center mt-2">
                <div className="relative group mb-4"><div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-white shadow-md overflow-hidden relative">{profile?.avatar_url ? <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" /> : <span className="text-3xl font-bold text-brand">{profile?.full_name?.charAt(0) || <User size={32} />}</span>}{uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}</div>{isEditing && <label className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full shadow-md cursor-pointer border-2 border-white"><Camera size={14} /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>}</div>
                {!isEditing ? <div className="w-full space-y-4"><div><h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Utilisateur'}</h2><p className="text-sm text-gray-500">{user.email}</p></div><div className="flex justify-center">{profile?.is_pro ? <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200"><CheckCircle size={12} /> VENDEUR PRO</span> : <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">STANDARD</span>}</div><div className="grid grid-cols-2 gap-3 w-full pt-2"><div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center border border-gray-100"><span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Téléphone</span><div className="text-gray-900 font-bold text-sm flex items-center gap-1"><Phone size={14} className="text-brand shrink-0" /><span className="truncate">{profile?.phone_number || '-'}</span></div></div><div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center border border-gray-100"><span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Localisation</span><div className="text-gray-900 font-bold text-sm flex items-center gap-1"><MapPin size={14} className="text-brand shrink-0" /><span className="truncate">{profile?.island || 'Ngazidja'}</span></div></div></div></div> : <div className="w-full space-y-3 text-left animate-in fade-in"><div><label className="text-xs font-bold text-gray-500 ml-1 block">Nom</label><input type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} className={inputStyle} /></div><div><label className="text-xs font-bold text-gray-500 ml-1 block">Tél</label><input type="tel" value={editData.phone_number} onChange={e => setEditData({...editData, phone_number: e.target.value})} className={inputStyle} /></div><div><label className="text-xs font-bold text-gray-500 ml-1 block">Île</label><select value={editData.island} onChange={e => setEditData({...editData, island: e.target.value})} className={inputStyle}><option>Ngazidja</option><option>Ndzouani</option><option>Mwali</option><option>Maore</option></select></div></div>}
            </div>
        </div>
      </div>
      <div className="px-4 mt-8 space-y-6">
        {!profile?.is_pro && <Link href="/pro" className="w-full bg-linear-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition"><Star size={20} className="fill-white" /> Passer au statut Vendeur PRO</Link>}
        <div><h3 className="font-bold text-gray-900 mb-4 px-1 flex justify-between items-center">Mes annonces {myProducts.length > 0 && <span className="bg-brand/10 text-brand text-xs font-bold px-2 py-1 rounded-full">{myProducts.length}</span>}</h3>{myProducts.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white"><p className="text-gray-400 text-sm mb-4">Aucune annonce.</p><Link href="/publier" className="text-brand font-bold text-sm hover:underline bg-brand/5 px-4 py-2 rounded-full">+ Créer</Link></div> : <div className="space-y-3">{myProducts.map(p => (<div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center"><div className="w-16 h-16 bg-gray-100 rounded-lg relative overflow-hidden shrink-0 border border-gray-200">{p.images && JSON.parse(p.images)[0] && <Image src={JSON.parse(p.images)[0]} alt="" fill className="object-cover" />}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate text-sm">{p.title}</h4><p className="text-brand text-xs font-bold">{p.price} KMF</p></div><div className="flex flex-col gap-2 pl-2 border-l border-gray-50"><Link href={`/modifier/${p.id}`} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-brand hover:text-white transition"><Edit2 size={14} /></Link><button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"><Trash2 size={14} /></button></div></div>))}</div>}</div>
      </div>
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe z-50"><div className="max-w-md mx-auto grid grid-cols-5 h-16 items-end pb-2"><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><HomeIcon size={24} /><span className="text-[9px] font-bold">Accueil</span></Link><Link href="/" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><Search size={24} /><span className="text-[9px] font-bold">Recherche</span></Link><div className="flex justify-center relative -top-6"><Link href="/publier" className="bg-brand w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/30 border-4 border-white"><Plus strokeWidth={3} size={28} /></Link></div><Link href="/messages" className="flex flex-col items-center justify-center gap-1 h-full text-gray-400 hover:text-brand"><MessageCircle size={24} /><span className="text-[9px] font-bold">Messages</span></Link><Link href="/compte" className="flex flex-col items-center justify-center gap-1 h-full text-brand"><User size={24} /><span className="text-[9px] font-bold">Compte</span></Link></div></nav>
    </div>
  )
}