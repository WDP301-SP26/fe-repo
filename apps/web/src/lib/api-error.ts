export interface APIErrorPayload {
  message?: string;
  code?: string;
  provider?: 'GITHUB' | 'JIRA';
  retryable?: boolean;
  reconnectRequired?: boolean;
  details?: Record<string, unknown>;
}

export class APIError extends Error {
  status: number;
  code?: string;
  provider?: 'GITHUB' | 'JIRA';
  retryable: boolean;
  reconnectRequired: boolean;
  details?: Record<string, unknown>;

  constructor(status: number, payload: APIErrorPayload) {
    super(payload.message || 'API request failed');
    this.name = 'APIError';
    this.status = status;
    this.code = payload.code;
    this.provider = payload.provider;
    this.retryable = payload.retryable ?? false;
    this.reconnectRequired = payload.reconnectRequired ?? false;
    this.details = payload.details;
  }
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}
