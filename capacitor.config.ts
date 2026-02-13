import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.comoresmarket.app',
  appName: 'Comores Market',
  webDir: 'public',
  server: {
    cleartext: true,
    // L'astérisque force Capacitor à TOUT garder à l'intérieur de l'application
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true
  }
};

export default config;