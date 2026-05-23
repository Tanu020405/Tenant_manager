import { ValidationError, ForbiddenError } from "./errorHandler.js";

export const tenantResolver = (req, res, next) => {
  try {
    const pathTenant = req.params?.tenantId || req.params?.tenant;
    const headerTenant = req.header("x-tenant-id");
    const tokenTenant = req.user?.tenantId;

    const hostHeader = req.headers?.host || "";
    const hostWithoutPort = hostHeader.split(":")[0].toLowerCase();
    const rootDomain = process.env.TENANT_ROOT_DOMAIN?.toLowerCase();
    let subdomainTenant = null;

    if (hostWithoutPort) {
      if (rootDomain && hostWithoutPort.endsWith(`.${rootDomain}`)) {
        const candidate = hostWithoutPort.slice(0, -(rootDomain.length + 1));
        subdomainTenant = candidate.split(".").filter(Boolean)[0] || null;
      } else if (hostWithoutPort === rootDomain) {
        subdomainTenant = null;
      } else if (hostWithoutPort.includes(".localhost")) {
        subdomainTenant = hostWithoutPort.split(".localhost")[0] || null;
      }
    }

    const resolvedTenant = pathTenant || headerTenant || subdomainTenant || tokenTenant;

    if (!resolvedTenant) {
      return next(new ValidationError("Tenant context is required"));
    }

    if (tokenTenant && resolvedTenant !== tokenTenant) {
      return next(new ForbiddenError("Tenant mismatch for authenticated user"));
    }

    req.tenantId = resolvedTenant;
    next();
  } catch (err) {
    next(err);
  }
};
