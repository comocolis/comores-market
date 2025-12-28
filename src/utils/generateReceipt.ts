import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const generatePROReceipt = async (userData: { full_name: string, email: string, date: string }) => {
  const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Utilisation d'un conteneur temporaire
  const receiptElement = document.createElement('div');
  receiptElement.style.padding = '40px';
  receiptElement.style.width = '700px';
  receiptElement.style.background = '#ffffff';
  receiptElement.style.position = 'fixed';
  receiptElement.style.top = '0';
  receiptElement.style.left = '-9999px';
  receiptElement.style.fontFamily = "sans-serif";
  
  receiptElement.innerHTML = `
    <div style="border: 1px solid #E5E7EB; border-radius: 24px; padding: 40px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #F3F4F6; padding-bottom: 20px;">
        <div>
          <h1 style="color: #10B981; margin: 0; font-size: 24px; font-weight: 900;">COMORES MARKET</h1>
          <p style="color: #9CA3AF; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Showroom Prestige</p>
        </div>
        <div style="text-align: right;">
          <div style="background: #FBBF24; color: #ffffff; padding: 5px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase;">Membre PRO</div>
          <p style="font-size: 11px; margin-top: 8px; color: #6B7280;">N° ${transactionId}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="font-size: 12px;">
          <p style="color: #9CA3AF; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Émetteur</p>
          <p style="font-weight: bold; margin: 0;">Administration Comores Market</p>
          <p style="color: #6B7280; margin: 2px 0;">Service Facturation</p>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <p style="color: #9CA3AF; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Client</p>
          <p style="font-weight: bold; margin: 0;">${userData.full_name}</p>
          <p style="color: #6B7280; margin: 2px 0;">${userData.email}</p>
        </div>
      </div>

      <div style="background: #F9FAFB; border-radius: 16px; padding: 20px; margin-bottom: 40px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
          <span>Abonnement Annuel PRO</span>
          <span style="color: #10B981;">10 000 KMF</span>
        </div>
        <p style="font-size: 11px; color: #6B7280; margin-top: 5px;">Validation du statut certifiée le ${new Date(userData.date).toLocaleDateString()}</p>
      </div>

      <div style="text-align: center; border-top: 1px dashed #E5E7EB; pt: 20px;">
        <p style="font-size: 10px; color: #9CA3AF;">Ce document fait office de preuve d'adhésion officielle au programme PRO de Comores Market.</p>
      </div>
    </div>
  `;

  document.body.appendChild(receiptElement);

  try {
    const canvas = await html2canvas(receiptElement, {
      scale: 2, // Scale 2 est plus stable que 3 pour la mémoire mobile
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Facture_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error(error);
    toast.error("Erreur lors de la création du document.");
  } finally {
    document.body.removeChild(receiptElement);
  }
};