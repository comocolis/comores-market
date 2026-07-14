/**
 * Convertit un prix en KMF vers l'Euro (Taux fixe : 500 KMF = 1 €)
 * Retourne une chaîne formatée (ex: "2,50 €")
 */
export function convertKmfToEuro(priceInKmf: number): string {
  if (!priceInKmf || isNaN(priceInKmf)) return '0 €';
  
  const priceInEuro = priceInKmf / 500;
  
  // Formatage propre avec 2 décimales si nécessaire, ou entier si pile
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: priceInEuro % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(priceInEuro);
}