import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReceiptData {
  full_name: string;
  email: string;
  date: string;     // Date de début (paiement)
  endDate?: string; // Date de fin (expiration)
  description?: string;
}

export const generatePROReceipt = (userData: ReceiptData) => {
  try {
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    // Dates basées sur les données réelles de la DB
    const startDate = new Date(userData.date);
    const endDate = userData.endDate 
        ? new Date(userData.endDate) 
        : new Date(new Date(userData.date).setMonth(startDate.getMonth() + 1)); // Fallback +1 mois

    const isAnnual = (userData.description || "").toLowerCase().includes("annuel");
    
    const offerTitle = isAnnual ? "ABONNEMENT ANNUEL PRO" : "ABONNEMENT MENSUEL PRO";
    const offerPrice = isAnnual ? "25 000 KMF" : "2 500 KMF";
    const durationText = isAnnual ? "12 Mois (1 an)" : "1 Mois";
    const filePrefix = isAnnual ? "Facture_Annuelle" : "Facture_Mensuelle";

    // --- 1. EN-TÊTE ---
    // Bandeau Vert Brand
    doc.setFillColor(22, 163, 74); 
    doc.rect(0, 0, 210, 45, 'F'); // Un peu plus haut pour l'élégance
    
    // LOGO "MARQUE" (Simulation texte stylisé)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    // On espace un peu les lettres pour faire "Logo"
    doc.text("COMORES  MARKET", 15, 22); 
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("L'Application N°1 d'Achat et Vente aux Comores", 15, 30);

    // Bloc Ref à droite
    doc.setFontSize(10);
    doc.text(`REF: ${transactionId}`, 195, 20, { align: "right" });
    doc.text(`DATE: ${startDate.toLocaleDateString('fr-FR')}`, 195, 28, { align: "right" });

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
    
    // Entêtes du tableau
    doc.setFillColor(245, 245, 245);
    doc.rect(15, startY - 5, 180, 10, 'F'); // Fond gris clair pour l'entête
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DESCRIPTION", 20, startY + 2);
    doc.text("DUREE", 140, startY + 2, { align: "center" });
    doc.text("MONTANT", 190, startY + 2, { align: "right" });

    // Ligne Offre
    doc.setFont("helvetica", "bold");
    doc.text(offerTitle, 20, startY + 18);
    
    doc.setFont("helvetica", "normal");
    doc.text(durationText, 140, startY + 18, { align: "center" });
    doc.text(offerPrice, 190, startY + 18, { align: "right" });

    // --- 4. LISTE DES AVANTAGES (Détails) ---
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
    
    benefits.forEach((benefit) => {
        doc.text(benefit, 20, currentY);
        currentY += 5;
    });

    doc.setDrawColor(230, 230, 230);
    doc.line(15, currentY + 5, 195, currentY + 5);

    // --- 5. TOTAL ---
    const totalY = currentY + 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL PAYE", 130, totalY); 
    
    doc.setTextColor(22, 163, 74); // Vert
    doc.text(offerPrice, 190, totalY, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text("TVA non applicable", 190, totalY + 6, { align: "right" });

    // --- 6. PIED DE PAGE ---
    const footerY = 250;
    
    // Cadre de validité
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, footerY, 180, 15, 3, 3); // Bords arrondis
    
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`COMPTE VALIDE JUSQU'AU : ${endDate.toLocaleDateString('fr-FR')}`, 105, footerY + 9, { align: "center" });

    // Mentions légales
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Comores Market - Plateforme Digitale - Moroni, Comores", 105, 280, { align: "center" });
    doc.text("Ce document est genere electroniquement.", 105, 285, { align: "center" });

    // --- TÉLÉCHARGEMENT ---
    const cleanName = userData.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${filePrefix}_${cleanName}.pdf`;
    doc.save(fileName);
    toast.success("Facture téléchargée !");

  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Erreur technique lors de la génération.");
  }
};