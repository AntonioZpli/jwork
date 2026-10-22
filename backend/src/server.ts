import { pathToFileURL } from 'node:url'
import { config } from './config'
import { buildServer } from './app'

export { buildServer } from './app'

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (isDirectRun) {
  void (async () => {
    const app = await buildServer()
    await app.listen({ port: config.port, host: config.host })
    console.log('Jinowork backend listening on http://' + config.host + ':' + config.port)
  })()
}
