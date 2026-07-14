'use client';

export default function PriceTag({ price, className = "" }: { price: number; className?: string }) {
  // Debug : Si rien ne s'affiche, c'est que price est undefined ou 0
  if (!price) {
    console.warn("PriceTag reçu avec un prix invalide :", price);
    return <span className={className}>Prix inconnu</span>;
  }

  const priceInEuro = price / 500;
  
  // Formatage manuel strict
  const formattedFc = new Intl.NumberFormat('fr-KM', {
    maximumFractionDigits: 0
  }).format(price) + " FC";

  const formattedEuro = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(priceInEuro);

  return (
    <div className="flex flex-col items-start">
      <span className={className}>
        {formattedFc}
      </span>
      <span className="text-[10px] font-medium text-gray-400 leading-none mt-0.5">
        ({formattedEuro})
      </span>
    </div>
  );
}