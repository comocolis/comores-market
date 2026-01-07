import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  // Configuration de la compression
  const options = {
    maxSizeMB: 1,           // Cible : 1 Mo maximum
    maxWidthOrHeight: 1920, // Redimensionne si > 1920px (Full HD suffisant)
    useWebWorker: true,     // Ne bloque pas l'interface pendant le calcul
    fileType: 'image/webp', // Conversion forcée en WebP
    initialQuality: 0.8     // Qualité de départ (80%)
  };

  try {
    console.log(`Compression de ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    const compressedFile = await imageCompression(file, options);
    
    console.log(`-> Résultat : ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    // On renomme le fichier en .webp pour correspondre au format réel
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    
    return new File([compressedFile], newFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
    });

  } catch (error) {
    console.error("Erreur lors de la compression, utilisation du fichier original:", error);
    return file; // En cas d'échec, on renvoie l'original pour ne pas bloquer l'user
  }
};