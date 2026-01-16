import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const body = await request.json();
    const { fullName, email, phone, island, city } = body;

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
            <li><strong>Nom :</strong> ${fullName}</li>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Téléphone :</strong> ${phone}</li>
            <li><strong>Localisation :</strong> ${city}, ${island}</li>
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}