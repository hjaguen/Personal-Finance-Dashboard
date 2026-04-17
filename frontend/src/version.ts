/**
 * Finance Dashboard - Version Info
 * Frontend version follows semantic versioning: MAJOR.MINOR.PATCH
 * 
 * Version History:
 * 1.0.0 (2026-04-17) - Initial release
 *   - Dashboard with charts
 *   - Transaction management
 *   - Budget alerts
 * 
 * IMPORTANT: Frontend and Backend versions are INDEPENDENT!
 * - Backend v1.0.0: API and database
 * - Frontend v1.0.0: UI and state management
 */

export const FRONTEND_VERSION = '1.0.0';
export const BACKEND_API_VERSION = 'v1';

export const versionInfo = {
  frontend: {
    version: FRONTEND_VERSION,
    major: 1,
    minor: 0,
    patch: 0,
    label: 'Initial Release',
    date: '2026-04-17'
  },
  backend: {
    version: BACKEND_API_VERSION,
    url: `/api/${BACKEND_API_VERSION}`
  },
  features: [
    'Dashboard con gráficos (Recharts)',
    'Gestión de transacciones',
    'Categorías predefinidas',
    'Resumen financiero',
    'Alertas de presupuesto',
    'Autenticación JWT',
    'Diseño responsivo (Tailwind)'
  ]
};

export default versionInfo;