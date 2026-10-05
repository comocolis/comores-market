
export async function chatWithAI(message: string, history: any[], systemContext?: string) {
  // On passe par la route Next.js et non par l'Edge Function : c'est la source
  // de verite unique pour l'IA, ce qui evite toute divergence de modele entre
  // le front et les fonctions deployees.
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, systemContext }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || data?.text || 'Erreur du service de discussion')
  }

  return data
}

export async function rephraseText(text: string) {
  const response = await fetch('/api/rephrase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || 'Erreur de reformulation')
  }

  return {
    ...data,
    rephrased: data?.rephrased || data?.text || text,
  }
}

export async function moderateContent(title: string, description: string, price: string) {
  try {
    // Idem : on utilise la route Next.js (meme modele que le chat).
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, price }),
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data?.error || 'Erreur de moderation')
    return data
  } catch (error) {
    // Fail-safe : on ne bloque pas la publication si l'IA est indisponible.
    console.error('Moderation failed:', error)
    return { is_safe: true, quality_score: 80 }
  }
}

export async function sendAdminAlert(fullName: string, email: string, phone: string, island: string, city: string) {
  try {
    // Route Next.js : validation + anti-spam + echappement HTML cote serveur.
    const response = await fetch('/api/emails/alert-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, island, city }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Email alert failed:', data?.error || response.status)
    // Don't throw, just log
    return { success: false }
    }

    return data
  } catch (error) {
    console.error('Email alert failed:', error)
    return { success: false }
  }
}
