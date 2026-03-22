fetch("https://tenant-manager-yx3y.onrender.com/api/tenants/Omega/invoices/my-invoices", {
  method: "OPTIONS",
  headers: {
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization, x-tenant-id"
  }
}).then(res => {
  console.log("Status:", res.status);
  console.log("CORS Origin:", res.headers.get("access-control-allow-origin"));
  console.log("CORS Headers:", res.headers.get("access-control-allow-headers"));
}).catch(console.error);
