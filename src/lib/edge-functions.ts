
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
  const { data, error } = await supabase.functions.invoke('rephrase', {
    body: { text },
  });

  if (error) throw error;
  return data;
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
