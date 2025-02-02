export const GOOGLE_API_CONFIG = {
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/calendar.readonly'
};