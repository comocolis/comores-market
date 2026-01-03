import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReceiptData {
  full_name: string;
  email: string;
  date: string;
  description?: string; // Champ optionnel pour le type d'abonnement
}

export const generatePROReceipt = (userData: ReceiptData) => {
  try {
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const activationDate = new Date(userData.date);
    
    // DÉTECTION DU TYPE D'ABONNEMENT
    // Si la description contient "Annuel", on considère que c'est l'offre annuelle
    const isAnnual = userData.description?.toLowerCase().includes("annuel");
    
    // Configuration dynamique selon l'offre
    const offerTitle = isAnnual ? "OFFRE ANNUELLE PRO" : "OFFRE MENSUELLE PRO";
    const offerPrice = isAnnual ? "25 000 KMF" : "2 500 KMF";
    const filePrefix = isAnnual ? "Attestation_Annuelle_PRO" : "Attestation_Mensuelle_PRO";

    // Calcul de la date d'expiration
    const expiryDate = new Date(userData.date);
    if (isAnnual) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // +1 An
    } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1); // +1 Mois
    }

    // --- CADRE DE PAGE ---
    doc.setDrawColor(230, 230, 230);
    doc.rect(5, 5, 200, 287); 

    // --- EN-TÊTE ---
    doc.setFillColor(5, 150, 105); // Vert Comores Market
    doc.rect(10, 10, 190, 30, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text("Comores Market", 20, 28);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("L'ÉLITE DU COMMERCE COMORIEN 🚀", 20, 35);

    // BADGE PRO GOLD
    doc.setFillColor(251, 191, 36); 
    doc.roundedRect(150, 18, 40, 12, 3, 3, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MEMBRE PRO", 155, 26);

    // --- BLOC CLIENT ---
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("DÉTENTEUR DU COMPTE ÉLITE", 20, 55);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(userData.full_name, 20, 62);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text([
        userData.email,
        `Date d'émission : ${activationDate.toLocaleDateString('fr-FR')}`
    ], 20, 68);

    // BLOC TRANSACTION
    doc.text([
      `Référence : ${transactionId}`,
      `Statut : Validé par ComoresMarket Core`,
      `Validité : Jusqu'au ${expiryDate.toLocaleDateString('fr-FR')}`
    ], 120, 62);

    // --- PRIVILÈGES ACTIVÉS ---
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 90, 190, 95, 'F');
    
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRIVILÈGES ACTIVÉS SUR VOTRE COMPTE :", 20, 100);

    const privileges = [
      "• Visibilité Boostée (Design Gold distinctif)",
      "• Statistiques de Vues détaillées",
      "• Réseaux Sociaux (Facebook & Instagram)",
      "• Photos dans le chat illimitées",
      "• Lien WhatsApp Direct sur l'annonce",
      "• Badge Certifié \"PRO\"",
      "• Galerie étendue : jusqu'à 10 photos"
    ];

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(privileges, 25, 112, { lineHeightFactor: 1.8 });

    // --- RÉCAPITULATIF FINANCIER ---
    doc.setDrawColor(230, 230, 230);
    doc.line(10, 200, 200, 200);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(offerTitle, 20, 215); // "OFFRE ANNUELLE PRO" ou "OFFRE MENSUELLE PRO"
    
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text(offerPrice, 160, 215); // "25 000 KMF" ou "2 500 KMF"
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("TVA NON APPLICABLE (AUTOPLIQUÉE)", 160, 222);

    // --- SCEAU DE CERTIFICATION ---
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1);
    doc.circle(165, 255, 18, 'S');
    doc.setFontSize(8);
    doc.text("CERTIFIÉ", 165, 253, { align: "center" });
    doc.setFontSize(12);
    doc.text("PRO", 165, 260, { align: "center" });

    // --- PIED DE PAGE ---
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text([
      "Comores Market - Le Showroom d'Excellence",
      "Ce document numérique constitue une attestation officielle de paiement.",
      "Généré automatiquement par le système ComoresMarket Billing Engine."
    ], 105, 280, { align: "center" });

    // --- TÉLÉCHARGEMENT ---
    const fileName = `${filePrefix}_${userData.full_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success("Votre attestation est prête !");

  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Erreur technique lors de la mise en forme.");
  }
};