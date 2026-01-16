import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  // 1. VÉRIFICATION DE LA CLÉ
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const body = await request.json();
    const { fullName, email, phone, island, city } = body;

    // 2. ENVOI DE L'EMAIL
    const { data, error } = await resend.emails.send({
      from: 'Comores Market <onboarding@resend.dev>', // Ne touchez pas à ça pour l'instant
      
      // ⚠️ C'est ici la correction : Mettez VOTRE email de compte Resend
      to: ['abdesisco1@gmail.com'], 
      
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
      console.error("❌ Erreur Resend:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("❌ Erreur Serveur:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}