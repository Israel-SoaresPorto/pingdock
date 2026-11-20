import type { FastifyError, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { ProxyError } from '../errors/proxy-error.js'

const errorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ProxyError) {
      return reply.code(error.statusCode).send({ error: error.message })
    }

    if (typeof error === 'object' && error !== null) {
      const fastifyError = error as Partial<FastifyError>

      if (fastifyError.validation) {
        return reply.code(400).send({
          error: fastifyError.message ?? 'Payload da requisição inválido.',
        })
      }

      if (
        fastifyError.code === 'FST_ERR_CTP_BODY_TOO_LARGE' ||
        fastifyError.statusCode === 413
      ) {
        return reply.code(413).send({
          error: 'O corpo da requisição excede o limite de 1 MB.',
        })
      }

      if (
        typeof fastifyError.statusCode === 'number' &&
        fastifyError.statusCode >= 400 &&
        fastifyError.statusCode < 500
      ) {
        return reply.code(fastifyError.statusCode).send({
          error: fastifyError.message ?? 'Requisição inválida.',
        })
      }
    }

    request.log.error(error)
    return reply.code(500).send({ error: 'Erro interno do servidor.' })
  })
}

export const errorHandlerPlugin = fp(errorHandler, {
  name: 'error-handler',
  fastify: '5.x',
})
