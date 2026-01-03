import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReceiptData {
  full_name: string;
  email: string;
  date: string;
  description?: string;
}

export const generatePROReceipt = (userData: ReceiptData) => {
  try {
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const activationDate = new Date(userData.date);
    
    // Détection type abonnement (par défaut Mensuel si non précisé)
    const isAnnual = (userData.description || "").toLowerCase().includes("annuel");
    
    const offerTitle = isAnnual ? "ABONNEMENT ANNUEL PRO" : "ABONNEMENT MENSUEL PRO";
    const offerPrice = isAnnual ? "25 000 KMF" : "2 500 KMF";
    const durationText = isAnnual ? "12 Mois (1 an)" : "1 Mois";
    const filePrefix = isAnnual ? "Facture_Annuelle" : "Facture_Mensuelle";

    // Date expiration
    const expiryDate = new Date(userData.date);
    if (isAnnual) expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    else expiryDate.setMonth(expiryDate.getMonth() + 1);

    // --- EN-TÊTE ---
    doc.setFillColor(22, 163, 74); // Vert
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("COMORES MARKET", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Recu de Paiement & Attestation Pro", 15, 28);

    doc.setFontSize(10);
    doc.text(`Ref: ${transactionId}`, 150, 20);
    doc.text(`Date: ${activationDate.toLocaleDateString('fr-FR')}`, 150, 28);

    // --- INFO CLIENT ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("FACTURE A :", 15, 60); // "À" remplacé par "A" pour éviter bugs encodage si font standard
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(userData.full_name.toUpperCase(), 15, 66);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(userData.email, 15, 72);

    // --- DÉTAILS ---
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 85, 195, 85);
    
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", 15, 95);
    doc.text("DUREE", 120, 95);
    doc.text("MONTANT", 170, 95, { align: "right" });
    
    doc.line(15, 100, 195, 100);

    doc.setFont("helvetica", "normal");
    doc.text(offerTitle, 15, 115);
    doc.text("- Badge Verifie (Couronne)", 15, 122);
    doc.text("- Visibilite Prioritaire", 15, 128);
    doc.text("- Galerie etendue (10 photos)", 15, 134);
    
    doc.text(durationText, 120, 115);
    doc.text(offerPrice, 170, 115, { align: "right" });

    doc.line(15, 145, 195, 145);

    // --- TOTAL ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL PAYE", 120, 160);
    doc.setTextColor(22, 163, 74);
    doc.text(offerPrice, 170, 160, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("TVA non applicable", 170, 166, { align: "right" });

    // --- PIED DE PAGE ---
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.rect(15, 230, 180, 25);
    doc.text(`Compte valide jusqu'au : ${expiryDate.toLocaleDateString('fr-FR')}`, 105, 245, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Comores Market - Plateforme Digitale - Moroni, Comores", 105, 280, { align: "center" });
    doc.text("Ce recu est genere electroniquement.", 105, 285, { align: "center" });

    const fileName = `${filePrefix}_${userData.full_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success("Facture téléchargée !");

  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Erreur technique lors de la génération.");
  }
};