export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const HTTP_METHODS: readonly HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
] as const;

export interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ProxyRequestError {
  status?: number;
  message: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  method: HttpMethod;
  headers: HeaderItem[];
  body: string;
  durationMs: number;
  timestamp: number;
}
