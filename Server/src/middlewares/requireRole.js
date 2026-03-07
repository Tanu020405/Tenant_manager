import { ForbiddenError } from "./errorHandler.js";

// Middleware to require one or more roles — pass roles as individual args or an array
// Usage: requireRole("tenant")  OR  requireRole("tenant", "renter")
export const requireRole = (...roles) => {
  // Support both requireRole("a", "b") and requireRole(["a", "b"])
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied: one of [${allowed.join(", ")}] role required`
        )
      );
    }
    next();
  };
};

// Alias kept for backward-compatibility — requireAnyRole(["a","b"]) still works
export const requireAnyRole = (roles) => requireRole(...roles);
