import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation avec votre clé API (à mettre dans .env.local plus tard)
const resend = new Resend(process.env.RESEND_API_KEY);

// Remplacez par VOTRE email personnel où vous voulez recevoir l'alerte
const ADMIN_EMAIL = 'contact.comoresmarket@gmail.com'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, island, city } = body;

    const { data, error } = await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>', // Utilisez votre domaine si configuré, sinon laissez resend.dev
      to: [ADMIN_EMAIL],
      subject: `🚀 Nouvel inscrit : ${fullName}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1>Un nouvel utilisateur vient de rejoindre Comores Market !</h1>
          <p>Voici ses informations :</p>
          <ul>
            <li><strong>Nom :</strong> ${fullName}</li>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Téléphone :</strong> ${phone}</li>
            <li><strong>Localisation :</strong> ${city}, ${island}</li>
          </ul>
          <p style="color: #888; font-size: 12px;">Ceci est une notification automatique.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}