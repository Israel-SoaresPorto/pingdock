import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify'
import { errorHandlerPlugin } from './plugins/error-handler.js'
import { proxyRoutes, type ProxyPluginOptions } from './routes/proxy.js'

export interface BuildAppOptions {
  fastify?: FastifyServerOptions
  proxy?: ProxyPluginOptions
}

const ONE_MEGABYTE = 1024 * 1024

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: ONE_MEGABYTE,
    ...options.fastify,
  })

  await app.register(errorHandlerPlugin)

  app.get('/health', async () => ({ status: 'ok' }))

  await app.register(proxyRoutes, {
    prefix: '/api',
    ...options.proxy,
  })

  return app
}
