
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function chatWithAI(message: string, history: any[], systemContext?: string) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history, systemContext },
  });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase.functions.invoke('moderate', {
    body: { title, description, price },
  });

  // If function fails or returns error, default to safe to not block user
  if (error) {
    console.error('Moderation failed:', error);
    return { is_safe: true, quality_score: 80 }; 
  }
  return data;
}

export async function sendAdminAlert(fullName: string, email: string, phone: string, island: string, city: string) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { fullName, email, phone, island, city },
  });

  if (error) {
    console.error('Email alert failed:', error);
    // Don't throw, just log
    return { success: false };
  }
  return data;
}
