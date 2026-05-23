const BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000";

export const authRoutes = {
  register: `${BASE}/api/user/register`,
  login: `${BASE}/api/user/login`,
  forgotPassword: `${BASE}/api/user/forgot-password`,
  resetPassword: (token) => `${BASE}/api/user/reset-password/${token}`,
  me: `${BASE}/api/user/me`,
  tenantProfile: `${BASE}/api/user/tenant/profile`,
};

// Posts
export const postsRoute = () => `${BASE}/api/posts`;

// Properties
export const propertiesRoute = () => `${BASE}/api/properties`;
export const propertyRoute = (_tid, id) => `${BASE}/api/properties/${id}`;

// Renters
export const rentersRoute = () => `${BASE}/api/renters`;
export const renterRoute = (_tid, id) => `${BASE}/api/renters/${id}`;

// Invoices
export const invoicesRoute = () => `${BASE}/api/invoices`;
export const myInvoicesRoute = () => `${BASE}/api/invoices/my-invoices`;
export const generateInvoiceRoute = () => `${BASE}/api/invoices/generate`;
export const invoicePdfRoute = (_tid, id) => `${BASE}/api/invoices/${id}/pdf`;

// Payments
export const paymentsRoute = () => `${BASE}/api/payments`;
export const createOrderRoute = () => `${BASE}/api/payments/create-order`;
export const verifyPaymentRoute = () => `${BASE}/api/payments/verify`;
export const paymentHistoryRoute = () => `${BASE}/api/payments/history`;

// Analytics
export const analyticsRevRoute = () => `${BASE}/api/analytics/revenue`;
export const analyticsPendRoute = () => `${BASE}/api/analytics/pending`;
export const analyticsOvdRoute = () => `${BASE}/api/analytics/overdue`;

export default BASE;
