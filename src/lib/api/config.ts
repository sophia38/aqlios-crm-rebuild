// API settings. In mock mode MSW answers these paths in the browser; in live mode they go to
// NEXT_PUBLIC_API_ORIGIN (empty = same origin as the app).
export const API_MODE: 'mock' | 'live' = process.env.NEXT_PUBLIC_API_MODE === 'live' ? 'live' : 'mock';
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? '';
export const CRM_API = '/api/crm/api';

// Public Primary Care sub-app (the only vertical in scope).
export const PUBLIC_SUB_APP_ID = '3b668066-ab7e-4a11-ae82-01af30ff5cef';
