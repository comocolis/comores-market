import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    
    // Utilisation du modèle gemini-flash-latest pour la rapidité et stabilité
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Tu es l'expert marketing de Comores Market. 
      Analyse cette image de produit et rédige une description "Prestige" (style Silk & Stone).
      
      CONSIGNES DE FORMATAGE (TRÈS IMPORTANT) :
      - NE PAS utiliser de symboles Markdown (pas d'étoiles **, pas de hashtags ## ou #).
      - Rédige en texte brut (Plain Text) uniquement.
      - Utilise des sauts de ligne pour aérer le texte.
      - Utilise des MAJUSCULES pour les titres de sections si nécessaire.
      
      CONTENU :
      1. Un titre luxueux.
      2. Un paragraphe de vente fluide et élégant.
      3. Une liste simple des points forts (sans tirets compliqués).
      
      LANGUE : Français.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().normalize("NFC");
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Erreur Vision IA:", error);
    return NextResponse.json({ error: "Échec de l'analyse d'image." }, { status: 500 });
  }
}