export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(fields?: Record<string, string>) {
    super(400, 'validation failed', fields);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'not found') {
    super(404, message);
  }
}

export class RateLimitError extends AppError {
  constructor(public retryAfter: number) {
    super(429, 'rate limit exceeded');
  }
}
