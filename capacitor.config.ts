import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.comoresmarket.app',
  appName: 'Comores Market',
  webDir: 'public', // On pointe vers public car le vrai contenu vient du serveur
  server: {
    // ⚠️ IMPORTANT : Mettez ici l'URL exacte de votre site en ligne (https://...)
    url: 'https://comores-market.com', 
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;