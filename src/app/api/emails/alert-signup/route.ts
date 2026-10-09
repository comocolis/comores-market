import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';

// --- Anti-spam : 5 demandes / heure / IP (voir lib/rate-limit) ---
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

// --- Echappement HTML : empeche l'injection de balises dans l'email admin ---
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  if (isRateLimited(`signup:${getClientIp(request)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Trop de demandes' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const field = (key: string, max: number) => {
    const value = typeof body?.[key] === 'string' ? String(body[key]).trim() : '';
    return value.length > 0 && value.length <= max ? value : '';
  };

  const fullName = field('fullName', 120);
  const email = field('email', 254);
  const phone = field('phone', 40);
  const island = field('island', 80);
  const city = field('city', 120);

  if (!fullName || !EMAIL_RE.test(email) || !phone || !island || !city) {
    return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 });
  }

  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeIsland = escapeHtml(island);
  const safeCity = escapeHtml(city);

  const resend = new Resend(apiKey);

  try {
    // Envoi de l'alerte admin
    await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>',
      to: ['abdesisco1@gmail.com'], // Votre email administrateur
      subject: `🚀 Nouvel inscrit : ${fullName}`,
      html: `
        <div style="font-family: sans-serif; color: #111827;">
          <h2 style="color: #d97706;">Un nouvel utilisateur a rejoint l'aventure !</h2>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <ul style="line-height: 1.6;">
            <li><strong>Nom :</strong> ${safeFullName}</li>
            <li><strong>Email :</strong> ${safeEmail}</li>
            <li><strong>Téléphone :</strong> ${safePhone}</li>
            <li><strong>Localisation :</strong> ${safeCity}, ${safeIsland}</li>
          </ul>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Notification automatique sent by Comores Market System.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Erreur alerte inscription:", err.message);
    // On retourne quand même un succès pour ne pas bloquer le front-end si l'email admin échoue
    return NextResponse.json({ success: false, error: 'Email non envoyé' }, { status: 500 });
  }
}