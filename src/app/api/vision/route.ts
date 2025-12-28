import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    
    // Utilisation de gemini-1.5-flash qui supporte la vision
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Tu es l'expert en marketing de Comores Market. 
      Analyse cette image de produit et rédige une description "Prestige" (style Silk & Stone).
      
      STRUCTURE DE LA RÉPONSE :
      1. Un titre accrocheur et luxueux.
      2. Un texte de vente élégant qui met en avant la qualité et les bénéfices.
      3. Une liste courte des points forts.
      
      TON : Professionnel, rare, et digne d'un showroom de luxe aux Comores.
      LANGUE : Français.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(",")[1], // On retire le préfixe data:image/jpeg;base64,
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