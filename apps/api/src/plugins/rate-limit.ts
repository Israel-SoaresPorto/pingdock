import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

export interface ProxyRateLimitOptions {
  max?: number
  timeWindow?: number | string
}

const DEFAULT_RATE_LIMIT_MAX = 60
const DEFAULT_RATE_LIMIT_WINDOW = '1 minute'

const proxyRateLimit: FastifyPluginAsync<ProxyRateLimitOptions> = async (
  fastify,
  options,
) => {
  await fastify.register(rateLimit, {
    max: options.max ?? DEFAULT_RATE_LIMIT_MAX,
    timeWindow: options.timeWindow ?? DEFAULT_RATE_LIMIT_WINDOW,
    errorResponseBuilder(request, context) {
      request.log.warn({ ip: request.ip }, 'Rate limit excedido no /api/proxy')
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Limite de requisições excedido (${context.max} por ${context.after}). Tente novamente em instantes.`,
      }
    },
  })
}

export const rateLimitPlugin = fp(proxyRateLimit, {
  name: 'proxy-rate-limit',
  fastify: '5.x',
})
