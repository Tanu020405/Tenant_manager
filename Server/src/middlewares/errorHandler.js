// Centralized Error Handler Middleware
// Standardizes error responses and logging

// Custom Error Classes
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.code = "NOT_FOUND";
    this.statusCode = 404;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.code = "UNAUTHORIZED";
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.code = "FORBIDDEN";
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
    this.code = "CONFLICT";
    this.statusCode = 409;
  }
}

export class InternalServerError extends Error {
  constructor(message = "Internal Server Error") {
    super(message);
    this.name = "InternalServerError";
    this.code = "INTERNAL_SERVER_ERROR";
    this.statusCode = 500;
  }
}

// Main Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error("[ERROR]", {
    code: err.code || "UNKNOWN_ERROR",
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    tenantId: req.tenantId || "unknown",
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message,
      ...(err.details && { details: err.details }),
    },
  };

  // Return standardized error response
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
