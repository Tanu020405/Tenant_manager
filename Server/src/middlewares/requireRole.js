import { ForbiddenError } from "./errorHandler.js";

// Middleware to require a specific user role (admin, tenant)
export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return next(new ForbiddenError(`Access denied: ${role} role required`));
  }
  next();
};

// Middleware to allow multiple roles
export const requireAnyRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ForbiddenError(`Access denied: one of [${roles.join(", ")}] required`));
  }
  next();
};
