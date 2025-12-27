import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const generatePROReceipt = async (userData: { full_name: string, email: string, date: string }) => {
  const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Chemin vers votre logo (assurez-vous qu'il est dans le dossier public/)
  const logoPath = '/logo.png'; 

  const receiptElement = document.createElement('div');
  receiptElement.style.padding = '50px';
  receiptElement.style.width = '750px';
  receiptElement.style.background = '#ffffff';
  receiptElement.style.position = 'absolute';
  receiptElement.style.left = '-9999px';
  receiptElement.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
  
  receiptElement.innerHTML = `
    <div style="border: 1px solid #e5e7eb; border-radius: 40px; padding: 50px; background: #ffffff; position: relative;">
      
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; z-index: 0;">
        <img src="${logoPath}" style="width: 400px;" />
      </div>

      <div style="position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${logoPath}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 15px;" />
            <div>
              <h1 style="color: #10B981; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1.5px;">COMORES MARKET</h1>
              <p style="color: #9CA3AF; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 4px; letter-spacing: 2px;">Showroom Prestige</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #FBBF24; color: #ffffff; padding: 8px 20px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2);">Membre Officiel</div>
            <p style="color: #374151; font-size: 13px; margin-top: 12px; font-weight: 600;">Reçu N° <span style="color: #10B981;">${transactionId}</span></p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 60px; padding: 0 10px;">
          <div>
            <h4 style="color: #9CA3AF; font-size: 10px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Émetteur</h4>
            <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 800;">Administration Comores Market</p>
            <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">Département Publicité & PRO</p>
            <p style="font-size: 13px; color: #6B7280; margin: 2px 0;">Moroni, Grande Comore</p>
          </div>
          <div style="text-align: right;">
            <h4 style="color: #9CA3AF; font-size: 10px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Détenteur du compte</h4>
            <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 800;">${userData.full_name}</p>
            <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">${userData.email}</p>
            <p style="font-size: 13px; color: #6B7280; margin: 2px 0;">Paiement validé le : <strong>${new Date(userData.date).toLocaleDateString('fr-FR')}</strong></p>
          </div>
        </div>

        <div style="border: 2px solid #F3F4F6; border-radius: 25px; overflow: hidden; margin-bottom: 60px;">
          <div style="background: #F9FAFB; display: flex; justify-content: space-between; padding: 20px 30px; border-bottom: 2px solid #F3F4F6;">
            <span style="font-size: 11px; color: #9CA3AF; font-weight: 900; text-transform: uppercase;">Service souscrit</span>
            <span style="font-size: 11px; color: #9CA3AF; font-weight: 900; text-transform: uppercase;">Montant</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 30px;">
            <div>
              <p style="font-size: 18px; color: #111827; font-weight: 800; margin: 0;">Abonnement Annuel Membre PRO</p>
              <ul style="margin: 10px 0 0 0; padding: 0; list-style: none; display: flex; gap: 15px;">
                <li style="font-size: 11px; color: #10B981; font-weight: 700;">✓ Boosts illimités</li>
                <li style="font-size: 11px; color: #10B981; font-weight: 700;">✓ WhatsApp Direct</li>
                <li style="font-size: 11px; color: #10B981; font-weight: 700;">✓ Badge Prestige</li>
              </ul>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 26px; color: #10B981; font-weight: 900;">10 000 KMF</span>
              <p style="font-size: 10px; color: #9CA3AF; margin-top: 5px; font-weight: bold;">TVA Inclus (0%)</p>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: end;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; border: 4px solid #10B981; border-radius: 20px; display: flex; align-items: center; justify-content: center; transform: rotate(-10deg);">
                <span style="color: #10B981; font-weight: 900; font-size: 24px;">CM</span>
            </div>
            <div>
              <p style="font-size: 13px; font-weight: 900; color: #111827; margin: 0; text-transform: uppercase;">Document Officiel</p>
              <p style="font-size: 11px; color: #9CA3AF; margin: 0; font-weight: bold;">Généré par Comores Market Core</p>
            </div>
          </div>
          <div style="text-align: right; border-top: 1px solid #E5E7EB; pt: 15px; width: 200px;">
            <p style="font-size: 11px; color: #9CA3AF; font-weight: bold; margin-bottom: 10px;">L'administration,</p>
            <div style="font-family: 'Cursive', sans-serif; font-size: 20px; color: #111827; opacity: 0.8;">Comores Market</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(receiptElement);

  try {
    const canvas = await html2canvas(receiptElement, { 
      scale: 3, 
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 30; // Marges de 15mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
    pdf.save(`Attestation_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    toast.error("Erreur lors de la création du document");
  } finally {
    document.body.removeChild(receiptElement);
  }
};