import jsPDF from 'jspdf';
import { toast } from 'sonner';

export const generatePROReceipt = (userData: { full_name: string, email: string, date: string }) => {
  try {
    const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const doc = new jsPDF();

    // --- CONFIGURATION ---
    const primaryColor = "#10B981"; // Vert Comores Market
    const secondaryColor = "#6B7280"; // Gris
    const accentColor = "#FBBF24"; // Or

    // --- EN-TÊTE ---
    doc.setFillColor(249, 250, 251); // Fond gris très clair pour l'en-tête
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("COMORES MARKET", 20, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    doc.text("LE SHOWROOM D'EXCELLENCE", 20, 32);

    // BADGE PRO
    doc.setFillColor(accentColor);
    doc.roundedRect(150, 15, 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("MEMBRE OFFICIEL", 154, 21.5);

    // --- INFOS TRANSACTION ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Reçu N°: ${transactionId}`, 150, 32);

    // --- SECTIONS ÉMETTEUR / RÉCEPTEUR ---
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor);
    doc.text("ÉMETTEUR", 20, 60);
    doc.text("BÉNÉFICIAIRE", 120, 60);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text([
      "Administration Comores Market",
      "Service Facturation PRO",
      "Moroni, Grande Comore"
    ], 20, 68);

    doc.text([
      userData.full_name,
      userData.email,
      `Date: ${new Date(userData.date).toLocaleDateString('fr-FR')}`
    ], 120, 68);

    // --- TABLEAU RÉCAPITULATIF ---
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 95, 190, 95); // Ligne du haut

    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION DU SERVICE", 20, 105);
    doc.text("MONTANT", 160, 105);

    doc.line(20, 110, 190, 110); // Ligne de séparation

    doc.setFont("helvetica", "normal");
    doc.text("Abonnement Annuel Membre PRO", 20, 120);
    doc.text("Accès VIP, Boosts & WhatsApp Direct", 20, 126, { fontSize: 8 });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("10 000 KMF", 160, 122);

    doc.setDrawColor(primaryColor);
    doc.setLineWidth(1);
    doc.line(20, 135, 190, 135); // Ligne finale colorée

    // --- FOOTER & AUTHENTIFICATION ---
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    doc.text("Document certifié numériquement par le système Comores Market.", 105, 160, { align: "center" });
    
    // Sceau stylisé (Cercle vert)
    doc.setDrawColor(primaryColor);
    doc.circle(105, 185, 15, 'S');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text("CM", 105, 187, { align: "center" });

    // --- SAUVEGARDE ---
    doc.save(`Attestation_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`);
    toast.success("Facture générée avec succès !");

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    toast.error("Une erreur technique est survenue.");
  }
};