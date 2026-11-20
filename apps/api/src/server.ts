import { buildApp } from './app.js'

const isProduction = process.env.NODE_ENV === 'production'
const defaultPort = isProduction ? 3000 : 3001
const port = Number(process.env.PORT ?? defaultPort)
const host = '0.0.0.0'
const allowLocalhost = !isProduction && process.env.ALLOW_LOCALHOST === 'true'

async function start(): Promise<void> {
  const app = await buildApp({
    fastify: {
      trustProxy: isProduction,
      logger: {
        level: isProduction ? 'info' : 'debug',
      },
    },
    proxy: {
      allowLocalhost,
    },
  })

  if (allowLocalhost) {
    app.log.warn(
      'ALLOW_LOCALHOST ativo (somente desenvolvimento): chamadas para localhost estão liberadas.',
    )
  }

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    app.log.info({ signal }, 'Encerrando servidor...')
    try {
      await app.close()
      process.exit(0)
    } catch (error) {
      app.log.error(error, 'Erro ao encerrar servidor')
      process.exit(1)
    }
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  try {
    await app.listen({ port, host })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()
