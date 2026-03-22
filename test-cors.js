fetch("https://tenant-manager-yx3y.onrender.com/api/tenants/Omega/invoices/my-invoices", {
  method: "GET",
  headers: {
    "Origin": "http://localhost:5173",
    "x-tenant-id": "Omega",
    "Authorization": "Bearer fake_token"
  }
}).then(res => {
  console.log("Status:", res.status);
  console.log("Headers:");
  res.headers.forEach((value, name) => {
    console.log(name, ":", value);
  });
  return res.text();
}).then(text => console.log("Body:", text)).catch(console.error);
