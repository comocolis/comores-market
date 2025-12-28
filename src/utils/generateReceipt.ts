import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const generatePROReceipt = (userData: { full_name: string, email: string, date: string }) => {
  console.log("Début de la génération du PDF pour:", userData);

  try {
    // 1. Initialisation simple
    const doc = new jsPDF();
    const transactionId = `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // 2. Fond de l'en-tête (Gris clair)
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 40, 'F');

    // 3. Texte de l'en-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Vert #10B981
    doc.text("COMORES MARKET", 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gris #6B7280
    doc.text("ATTESTATION OFFICIELLE MEMBRE PRO", 20, 33);

    // 4. Bloc Bénéficiaire
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("DÉTAILS DU COMPTE", 20, 60);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text([
      `Nom: ${userData.full_name}`,
      `Email: ${userData.email}`,
      `Date d'activation: ${new Date(userData.date).toLocaleDateString('fr-FR')}`,
      `ID Transaction: ${transactionId}`
    ], 20, 70);

    // 5. Encadré Service
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(20, 100, 170, 30, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.text("Abonnement Annuel Membre PRO", 30, 112);
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(16);
    doc.text("10 000 KMF", 150, 118);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("Accès Showroom, WhatsApp Direct & Boosts inclus", 30, 120);

    // 6. Pied de page
    doc.setFontSize(9);
    doc.text("Ce document est généré numériquement et certifie votre statut de membre.", 105, 160, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("L'ADMINISTRATION COMORES MARKET", 105, 170, { align: "center" });

    // 7. Sauvegarde
    const fileName = `Facture_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    
    console.log("PDF généré et sauvegardé avec succès");
    toast.success("Facture téléchargée !");

  } catch (error) {
    console.error("Erreur critique lors de la génération du PDF:", error);
    toast.error("Échec technique du PDF. Vérifiez votre navigateur.");
  }
};