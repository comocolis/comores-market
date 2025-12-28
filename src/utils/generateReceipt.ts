import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const generatePROReceipt = async (userData: { full_name: string, email: string, date: string }) => {
  const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // 1. Création de l'élément invisible
  const receiptElement = document.createElement('div');
  receiptElement.id = 'temp-receipt';
  receiptElement.style.position = 'fixed';
  receiptElement.style.top = '-2000px'; // Bien loin de la vue
  receiptElement.style.left = '0';
  receiptElement.style.width = '800px';
  receiptElement.style.padding = '40px';
  receiptElement.style.background = '#ffffff';
  receiptElement.style.fontFamily = 'Arial, sans-serif';
  
  receiptElement.innerHTML = `
    <div style="border: 2px solid #F3F4F6; border-radius: 20px; padding: 40px; color: #111827;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #10B981; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; color: #10B981; font-size: 28px; font-weight: bold;">COMORES MARKET</h1>
          <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Attestation Membre Prestige</p>
        </div>
        <div style="text-align: right;">
          <div style="background: #FBBF24; color: #000; padding: 5px 15px; border-radius: 10px; font-size: 11px; font-weight: bold;">STATUT PRO VALIDE</div>
          <p style="margin: 8px 0 0 0; font-size: 10px; color: #9CA3AF;">ID: ${transactionId}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 50%;">
          <p style="color: #9CA3AF; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Délivré par</p>
          <p style="font-size: 14px; font-weight: bold; margin: 0;">Administration Comores Market</p>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">Moroni, Grande Comore</p>
        </div>
        <div style="width: 50%; text-align: right;">
          <p style="color: #9CA3AF; font-size: 10px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px;">Bénéficiaire</p>
          <p style="font-size: 14px; font-weight: bold; margin: 0;">${userData.full_name}</p>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">${userData.email}</p>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">Date: ${new Date(userData.date).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div style="background: #F9FAFB; border-radius: 15px; padding: 25px; margin-bottom: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="font-size: 16px; font-weight: bold; margin: 0;">Abonnement Annuel Membre PRO</p>
            <p style="font-size: 12px; color: #10B981; margin: 5px 0 0 0;">Avantages Prestige & Boosts illimités activés</p>
          </div>
          <div style="font-size: 24px; font-weight: bold; color: #111827;">10 000 KMF</div>
        </div>
      </div>

      <div style="text-align: center; border-top: 1px dashed #E5E7EB; padding-top: 30px;">
        <p style="font-size: 11px; color: #9CA3AF; line-height: 1.5;">
          Ce document officiel confirme l'activation du statut de vendeur professionnel.<br>
          Comores Market - Le Showroom d'Excellence.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(receiptElement);

  // 2. On attend un court instant pour être sûr que le rendu est prêt
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const canvas = await html2canvas(receiptElement, {
      scale: 2, // Réduit à 2 pour éviter les plantages mémoire sur téléphone
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 20; // Marges
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Facture_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`);
    
    toast.success("Facture générée avec succès !");
  } catch (error) {
    console.error("Erreur PDF:", error);
    toast.error("Impossible de générer le document. Réessayez.");
  } finally {
    // 3. Nettoyage
    document.body.removeChild(receiptElement);
  }
};