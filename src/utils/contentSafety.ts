/**
 * Détecte la présence de numéros de téléphone ou de liens web dans un texte.
 * Utilisé pour empêcher le contournement de la plateforme par les non-pros.
 */
export const containsContactInfo = (text: string): boolean => {
  if (!text) return false;

  // 1. Détection large de numéros (Comores +33, +269, ou format local 333 44 55)
  // Cherche des séquences de 7 chiffres ou plus, avec ou sans espaces/tirets
  const phoneRegex = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:0|\d{1,4})[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/;
  
  // 2. Détection de liens (http, www, .com, .km, etc.)
  const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|fr|net|org|km)\b)/i;
  
  // 3. Détection de mots clés d'évasion
  const evasionRegex = /(appelez|contactez|watsap|whatsapp|tél|tel|au)\s*[:\s]\s*[0-9]/i;

  return phoneRegex.test(text) || linkRegex.test(text) || evasionRegex.test(text);
};