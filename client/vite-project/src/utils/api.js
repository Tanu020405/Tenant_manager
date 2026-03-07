const BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000";

export const authRoutes = {
  register: `${BASE}/api/user/register`,
  login: `${BASE}/api/user/login`,
  me: `${BASE}/api/user/me`,
  tenantProfile: `${BASE}/api/user/tenant/profile`,
};

// Posts
export const postsRoute = (tid) => `${BASE}/api/tenants/${tid}/posts`;

// Properties
export const propertiesRoute = (tid) => `${BASE}/api/tenants/${tid}/properties`;
export const propertyRoute = (tid, id) => `${BASE}/api/tenants/${tid}/properties/${id}`;

// Renters
export const rentersRoute = (tid) => `${BASE}/api/tenants/${tid}/renters`;
export const renterRoute = (tid, id) => `${BASE}/api/tenants/${tid}/renters/${id}`;

// Invoices
export const invoicesRoute = (tid) => `${BASE}/api/tenants/${tid}/invoices`;
export const myInvoicesRoute = (tid) => `${BASE}/api/tenants/${tid}/invoices/my-invoices`;
export const generateInvoiceRoute = (tid) => `${BASE}/api/tenants/${tid}/invoices/generate`;

// Payments
export const paymentsRoute = (tid) => `${BASE}/api/tenants/${tid}/payments`;
export const createOrderRoute = (tid) => `${BASE}/api/tenants/${tid}/payments/create-order`;
export const verifyPaymentRoute = (tid) => `${BASE}/api/tenants/${tid}/payments/verify`;
export const paymentHistoryRoute = (tid) => `${BASE}/api/tenants/${tid}/payments/history`;

// Analytics
export const analyticsRevRoute = (tid) => `${BASE}/api/tenants/${tid}/analytics/revenue`;
export const analyticsPendRoute = (tid) => `${BASE}/api/tenants/${tid}/analytics/pending`;
export const analyticsOvdRoute = (tid) => `${BASE}/api/tenants/${tid}/analytics/overdue`;

export default BASE;
