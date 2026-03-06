export default {
  expo: {
    name: 'Fixer',
    slug: 'fixer-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    ios: { supportsTablet: true, bundleIdentifier: 'com.fixer.mobile' },
    android: { package: 'com.fixer.mobile' },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
    },
  },
};
