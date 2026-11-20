export type ProxyErrorCode =
  | 'INVALID_URL'
  | 'SSRF_BLOCKED'
  | 'DNS_RESOLUTION_FAILED'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_ERROR'

export class ProxyError extends Error {
  public readonly statusCode: number
  public readonly code: ProxyErrorCode

  constructor(statusCode: number, message: string, code: ProxyErrorCode) {
    super(message)
    this.name = 'ProxyError'
    this.statusCode = statusCode
    this.code = code
  }
}