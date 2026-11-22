import type { HttpMethod } from './app';

export interface ProxyRequestPayload {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  data: unknown;
}

export interface ProxyErrorResponse {
  error: string;
}