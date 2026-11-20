import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { ProxyError } from '../errors/proxy-error.js'
import {
  rateLimitPlugin,
  type ProxyRateLimitOptions,
} from '../plugins/rate-limit.js'
import { validateTargetUrl, type DnsLookupFn } from '../security.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ProxyRequestBody {
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  body?: unknown
}

export interface ProxyPluginOptions {
  timeoutMs?: number
  lookup?: DnsLookupFn
  allowLocalhost?: boolean
  rateLimit?: ProxyRateLimitOptions
}

const DEFAULT_TIMEOUT_MS = 10_000

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const proxyBodySchema = {
  type: 'object',
  required: ['method', 'url'],
  additionalProperties: false,
  properties: {
    method: {
      type: 'string',
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    url: {
      type: 'string',
      minLength: 1,
    },
    headers: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    body: {},
  },
} as const

function sanitizeHeaders(rawHeaders?: Record<string, string>): Record<string, string> {
  if (!rawHeaders) return {}

  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawHeaders)) {
    const trimmedKey = key.trim()
    if (!trimmedKey || HOP_BY_HOP_HEADERS.has(trimmedKey.toLowerCase())) {
      continue
    }
    sanitized[trimmedKey] = value
  }

  return sanitized
}

function prepareRequestBody(
  method: HttpMethod,
  body: unknown,
  headers: Record<string, string>,
): string | undefined {
  if (method === 'GET' || body === undefined || body === null) {
    return undefined
  }

  if (typeof body === 'string') {
    return body
  }

  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === 'content-type',
  )
  if (!hasContentType) {
    headers['content-type'] = 'application/json'
  }

  return JSON.stringify(body)
}

function parseResponseData(rawText: string, contentType: string): unknown {
  if (rawText.length === 0) {
    return null
  }

  const isJson =
    contentType.includes('application/json') || contentType.includes('+json')

  if (isJson) {
    try {
      return JSON.parse(rawText) as unknown
    } catch {
      return rawText
    }
  }

  return rawText
}

const proxyRoutesPlugin: FastifyPluginAsync<ProxyPluginOptions> = async (
  fastify,
  options,
) => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  await fastify.register(rateLimitPlugin, options.rateLimit ?? {})

  fastify.post<{ Body: ProxyRequestBody }>(
    '/proxy',
    {
      schema: {
        body: proxyBodySchema,
      },
    },
    async (request, reply) => {
      const { method, url, headers, body } = request.body

      const targetUrl = await validateTargetUrl(url, {
        lookup: options.lookup,
        allowLocalhost: options.allowLocalhost,
      })

      const outgoingHeaders = sanitizeHeaders(headers)
      const outgoingBody = prepareRequestBody(method, body, outgoingHeaders)

      const startedAt = performance.now()
      let upstreamResponse: Response

      try {
        upstreamResponse = await fetch(targetUrl.toString(), {
          method,
          headers: outgoingHeaders,
          ...(outgoingBody !== undefined ? { body: outgoingBody } : {}),
          redirect: 'manual',
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.name === 'TimeoutError' || error.name === 'AbortError')
        ) {
          throw new ProxyError(
            504,
            `A requisição excedeu o tempo limite de ${Math.round(timeoutMs / 1000)} segundos.`,
            'UPSTREAM_TIMEOUT',
          )
        }

        request.log.warn({ err: error, targetUrl: targetUrl.href }, 'Falha ao chamar destino')
        throw new ProxyError(
          502,
          'Não foi possível conectar ao servidor de destino.',
          'UPSTREAM_ERROR',
        )
      }

      const rawText = await upstreamResponse.text()
      const durationMs = Math.round(performance.now() - startedAt)
      const contentType = upstreamResponse.headers.get('content-type') ?? ''
      const responseHeaders = Object.fromEntries(upstreamResponse.headers.entries())
      const data = parseResponseData(rawText, contentType)

      return reply.code(200).send({
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        durationMs,
        headers: responseHeaders,
        data,
      })
    },
  )
}

export const proxyRoutes = fp(proxyRoutesPlugin, {
  name: 'proxy-routes',
  fastify: '5.x',
  dependencies: ['error-handler'],
  encapsulate: true,
})
