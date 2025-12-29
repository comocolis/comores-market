import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || text.length < 5) {
      return NextResponse.json({ error: "Texte trop court" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Tu es l'expert marketing de Comores Market. 
      Sublime la description suivante pour la rendre "Prestige" (style Silk & Stone).
      
      TEXTE À REFORMULER : "${text}"

      CONSIGNES :
      - NE PAS utiliser de symboles Markdown (pas de **, pas de #, pas de ##).
      - Rédige un texte fluide, luxueux et vendeur.
      - Utilise des sauts de ligne pour la clarté.
      - Garde les informations essentielles (prix, état) mais embellis le vocabulaire.
      
      Réponds uniquement avec le nouveau texte en français.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanText = response.text().replace(/\*\*/g, '').replace(/#/g, '').normalize("NFC");

    return NextResponse.json({ text: cleanText });
  } catch (error: any) {
    return NextResponse.json({ error: "Échec de la reformulation" }, { status: 500 });
  }
}