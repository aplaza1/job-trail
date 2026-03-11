interface ErrorLogContext {
  operation: string;
  requestId?: string;
  userId?: string;
  error: unknown;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function logLambdaError(context: ErrorLogContext) {
  const payload = {
    level: 'error',
    operation: context.operation,
    requestId: context.requestId ?? 'unknown',
    userId: context.userId ?? null,
    error: normalizeError(context.error),
  };

  console.error(JSON.stringify(payload));
}
