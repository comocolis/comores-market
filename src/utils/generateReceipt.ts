import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const generatePROReceipt = (userData: { full_name: string, email: string, date: string }) => {
  try {
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const activationDate = new Date(userData.date);
    const expiryDate = new Date(userData.date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Validité annuelle

    // --- CADRE DE PAGE ---
    doc.setDrawColor(230, 230, 230);
    doc.rect(5, 5, 200, 287); 

    // --- EN-TÊTE (STYLE APP) ---
    doc.setFillColor(5, 150, 105); // Vert ComoresMarket
    doc.rect(10, 10, 190, 30, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text("ComoresMarket", 20, 28);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("L'ÉLITE DU COMMERCE COMORIEN 🚀", 20, 35);

    // BADGE PRO GOLD (Comme sur vos cartes produits)
    doc.setFillColor(251, 191, 36); // Jaune Or PRO
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
    doc.text([userData.email, `Inscrit le : ${activationDate.toLocaleDateString('fr-FR')}`], 20, 68);

    // BLOC TRANSACTION
    doc.text([
      `Référence : ${transactionId}`,
      `Statut : Validé par ComoresMarket Core`,
      `Validité : Jusqu'au ${expiryDate.toLocaleDateString('fr-FR')}`
    ], 120, 62);

    // --- DÉTAILS DE L'OFFRE (Basé sur votre capture "Offre Mensuelle") ---
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 90, 190, 95, 'F');
    
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRIVILÈGES ACTIVÉS SUR VOTRE COMPTE :", 20, 100);

    const privileges = [
      "• Visibilité Boostée (Design Gold distinctif)",
      "• Statistiques de Vues détaillées sur vos annonces",
      "• Intégration Réseaux Sociaux (Facebook & Instagram)",
      "• Photos illimitées dans la messagerie privée",
      "• Bouton WhatsApp Direct sur toutes vos annonces",
      "• Badge Certifié 'PRO' sur votre profil public",
      "• Galerie étendue : Jusqu'à 10 photos par annonce"
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
    doc.text("ABONNEMENT ANNUEL PRO", 20, 215);
    
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text("10 000 KMF", 160, 215);
    
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
      "ComoresMarket - Le Showroom d'Excellence",
      "Ce document numérique constitue une attestation officielle de paiement.",
      "Généré automatiquement par le système ComoresMarket Billing Engine."
    ], 105, 280, { align: "center" });

    // --- TÉLÉCHARGEMENT ---
    const fileName = `Attestation_Prestige_${userData.full_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success("Votre attestation prestige est prête !");

  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Erreur technique lors de la mise en forme.");
  }
};