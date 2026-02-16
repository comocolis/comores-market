import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.comoresmarket.app',
  appName: 'Comores Market',
  webDir: 'out',
  android: {
    allowMixedContent: true
  }
};

export default config;