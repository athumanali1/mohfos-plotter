import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mohfos.plotter',
  appName: 'mohfos-plotter',
  webDir: 'build',
  server: {
    // Configure to allow external API calls
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
