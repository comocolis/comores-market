import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReceiptData {
  full_name: string;
  email: string;
  date: string;       // Date d'émission
  description?: string;
  customEndDate?: string; // Date de fin réelle
}

export const generatePROReceipt = (userData: ReceiptData) => {
  try {
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const activationDate = new Date(userData.date);
    
    // Détection type abonnement
    const isAnnual = (userData.description || "").toLowerCase().includes("annuel");
    
    const offerTitle = isAnnual ? "ABONNEMENT ANNUEL PRO" : "ABONNEMENT MENSUEL PRO";
    const offerPrice = isAnnual ? "25 000 KMF" : "2 500 KMF";
    const durationText = isAnnual ? "12 Mois (1 an)" : "30 Jours";
    const filePrefix = isAnnual ? "Facture_Annuelle" : "Facture_Mensuelle";

    // --- LOGIQUE DE DATE DE FIN ---
    let expiryDate;
    if (userData.customEndDate) {
        expiryDate = new Date(userData.customEndDate);
    } else {
        expiryDate = new Date(userData.date);
        if (isAnnual) expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        else expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // --- 1. EN-TÊTE ---
    // Fond Vert (Identique à la page d'accueil)
    doc.setFillColor(22, 163, 74); 
    doc.rect(0, 0, 210, 45, 'F');
    
    // CONSTRUCTION DU LOGO BICOLORE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);

    // Partie "Comores" en BLANC
    doc.setTextColor(255, 255, 255);
    doc.text("Comores", 15, 22);

    // On mesure la largeur du mot "Comores" pour coller "Market" juste après
    const textWidth = doc.getTextWidth("Comores");

    // Partie "Market" en JAUNE AMBRÉ (Brand Color)
    doc.setTextColor(251, 191, 36); 
    doc.text("Market", 15 + textWidth, 22);
    
    // Sous-titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("L'Application N°1 d'Achat et Vente aux Comores", 15, 30);

    // Bloc Réf à droite
    doc.setFontSize(10);
    doc.text(`REF: ${transactionId}`, 195, 20, { align: "right" });
    doc.text(`DATE: ${activationDate.toLocaleDateString('fr-FR')}`, 195, 28, { align: "right" });

    // --- 2. INFO CLIENT ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("FACTURE A :", 15, 65);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(userData.full_name.toUpperCase(), 15, 71);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(userData.email, 15, 77);

    // --- 3. TABLEAU DÉTAILS ---
    const startY = 95;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, startY - 5, 180, 10, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DESCRIPTION", 20, startY + 2);
    doc.text("DUREE", 140, startY + 2, { align: "center" });
    doc.text("MONTANT", 190, startY + 2, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(offerTitle, 20, startY + 18);
    doc.setFont("helvetica", "normal");
    doc.text(durationText, 140, startY + 18, { align: "center" });
    doc.text(offerPrice, 190, startY + 18, { align: "right" });

    // --- 4. LISTE DES AVANTAGES ---
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const benefits = [
        "  - Badge Vendeur Verifie (Couronne Gold)",
        "  - Visibilite Boostee (Tete de liste)",
        "  - Galerie etendue (Jusqu'a 10 photos)",
        "  - Photos illimitees dans le chat",
        "  - Lien WhatsApp direct sur l'annonce",
        "  - Liens Reseaux Sociaux (FB / Insta)",
        "  - Statistiques de vues detaillees",
        "  - Support prioritaire 7j/7"
    ];
    let currentY = startY + 26;
    benefits.forEach((benefit) => { doc.text(benefit, 20, currentY); currentY += 5; });

    doc.setDrawColor(230, 230, 230);
    doc.line(15, currentY + 5, 195, currentY + 5);

    // --- 5. TOTAL ---
    const totalY = currentY + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL PAYE", 130, totalY); 
    doc.setTextColor(22, 163, 74);
    doc.text(offerPrice, 190, totalY, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text("TVA non applicable", 190, totalY + 6, { align: "right" });

    // --- 6. PIED DE PAGE ---
    const footerY = 250;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, footerY, 180, 15, 3, 3);
    
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`ABONNEMENT VALIDE JUSQU'AU : ${expiryDate.toLocaleDateString('fr-FR')}`, 105, footerY + 9, { align: "center" });

    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Comores Market - Plateforme Digitale - Moroni, Comores", 105, 280, { align: "center" });
    doc.text("Ce document est genere electroniquement.", 105, 285, { align: "center" });

    const fileName = `${filePrefix}_${userData.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success("Facture téléchargée !");

  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Erreur technique.");
  }
};