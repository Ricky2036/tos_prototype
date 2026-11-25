import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))
const server = await createServer({ root, server: { port: 8888, strictPort: true } })
await server.listen()
server.printUrls()
