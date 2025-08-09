export class CustomAPIError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends CustomAPIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnAuthenticatedError extends CustomAPIError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomAPIError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends CustomAPIError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends CustomAPIError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends CustomAPIError {
  constructor(message: string) {
    super(message, 500);
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  return res.status(500).json({ error: 'Something went wrong' });
};

export const notFound = (req: any, res: any) => {
  res.status(404).json({ error: 'Route not found' });
};
