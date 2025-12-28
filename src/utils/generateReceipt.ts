import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const generatePROReceipt = async (userData: { full_name: string, email: string, date: string }) => {
  const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // 1. Création du conteneur temporaire
  const receiptElement = document.createElement('div');
  receiptElement.style.padding = '50px';
  receiptElement.style.width = '750px';
  receiptElement.style.background = '#ffffff';
  receiptElement.style.position = 'fixed'; // Plus stable que 'absolute' pour la capture
  receiptElement.style.top = '0';
  receiptElement.style.left = '-9999px';
  receiptElement.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
  
  // Design Prestige & Silk sans aucune image (100% CSS)
  receiptElement.innerHTML = `
    <div style="border: 1px solid #e5e7eb; border-radius: 40px; padding: 60px; background: #ffffff; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="width: 60px; height: 60px; background: #10B981; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
            CM
          </div>
          <div>
            <h1 style="color: #10B981; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1.5px; text-transform: uppercase;">Comores Market</h1>
            <p style="color: #9CA3AF; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 4px; letter-spacing: 2px;">Showroom d'Excellence</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #FBBF24; color: #78350F; padding: 8px 20px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Membre Officiel</div>
          <p style="color: #374151; font-size: 12px; margin-top: 12px; font-weight: 600;">Reçu N° <span style="color: #10B981;">${transactionId}</span></p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 60px; padding: 0 10px;">
        <div>
          <h4 style="color: #9CA3AF; font-size: 9px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 2px; font-weight: 900;">Émetteur</h4>
          <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 800;">Administration Comores Market</p>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">Département Publicité & PRO</p>
          <p style="font-size: 13px; color: #6B7280; margin: 2px 0;">Moroni, Grande Comore</p>
        </div>
        <div style="text-align: right;">
          <h4 style="color: #9CA3AF; font-size: 9px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 2px; font-weight: 900;">Client</h4>
          <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 800;">${userData.full_name}</p>
          <p style="font-size: 13px; color: #6B7280; margin: 4px 0;">${userData.email}</p>
          <p style="font-size: 13px; color: #6B7280; margin: 2px 0;">Validé le : <strong>${new Date(userData.date).toLocaleDateString('fr-FR')}</strong></p>
        </div>
      </div>

      <div style="border: 2px solid #F3F4F6; border-radius: 30px; overflow: hidden; margin-bottom: 60px;">
        <div style="background: #F9FAFB; display: flex; justify-content: space-between; padding: 20px 35px; border-bottom: 2px solid #F3F4F6;">
          <span style="font-size: 10px; color: #9CA3AF; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Service souscrit</span>
          <span style="font-size: 10px; color: #9CA3AF; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Montant Total</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 40px 35px;">
          <div>
            <p style="font-size: 20px; color: #111827; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Abonnement Annuel Membre PRO</p>
            <div style="margin-top: 15px; display: flex; gap: 20px;">
              <span style="font-size: 11px; color: #10B981; font-weight: 800;">✓ Ventes Prioritaires</span>
              <span style="font-size: 11px; color: #10B981; font-weight: 800;">✓ Badge Certifié</span>
              <span style="font-size: 11px; color: #10B981; font-weight: 800;">✓ Support Dédié</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 32px; color: #10B981; font-weight: 900;">10 000 KMF</span>
            <p style="font-size: 10px; color: #9CA3AF; margin-top: 5px; font-weight: bold; text-transform: uppercase;">Paiement unique</p>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #F3F4F6; padding-top: 40px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 12px; height: 12px; background: #10B981; border-radius: 50%;"></div>
          <p style="font-size: 12px; font-weight: 800; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Document Certifié Numériquement</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 13px; color: #111827; font-weight: 900; margin-bottom: 5px;">Comores Market Administration</p>
          <p style="font-size: 11px; color: #9CA3AF; margin: 0; font-weight: bold;">Le showroom qui booste votre business.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(receiptElement);

  // Petit délai pour laisser le temps au navigateur de calculer les styles
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(receiptElement, { 
      scale: 2, // Scale 2 est suffisant et beaucoup plus stable
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 30; // Marges de 15mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
    pdf.save(`Attestation_PRO_${userData.full_name.replace(/\s+/g, '_')}.pdf`);
    toast.success("Document généré !");
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    toast.error("Échec de la génération. Veuillez réessayer.");
  } finally {
    document.body.removeChild(receiptElement);
  }
};