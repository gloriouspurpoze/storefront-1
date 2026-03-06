import Constants from 'expo-constants';

/**
 * API base URL for sliders/banners.
 * Set EXPO_PUBLIC_API_URL in .env or in app.config.js extra.apiUrl.
 */
const extra = (Constants.expoConfig as { extra?: { apiUrl?: string } })?.extra;
const API_BASE =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  extra?.apiUrl ||
  'http://localhost:5000/api';

export const config = {
  apiBase: String(API_BASE).replace(/\/$/, ''),
};
