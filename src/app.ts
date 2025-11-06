import 'dotenv/config'
import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { trackingCronService } from './services/tracking-cron.service'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  })

  // Start tracking cron job after all plugins and routes are loaded
  fastify.addHook('onReady', async () => {
    fastify.log.info('Starting tracking cron job...')
    trackingCronService.start()
  })

  // Stop cron job on application shutdown
  fastify.addHook('onClose', async () => {
    fastify.log.info('Stopping tracking cron job...')
    trackingCronService.stop()
  })
}

export default app
export { app, options }
