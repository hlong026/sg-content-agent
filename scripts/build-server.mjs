import esbuild from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

esbuild.build({
  entryPoints: [resolve(root, 'packages/server/src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: resolve(root, 'dist/server'),
  external: ['better-sqlite3', 'pino', 'pino-pretty'],
  format: 'cjs',
}).then(() => {
  console.log('Server build complete')
}).catch((err) => {
  console.error('Server build failed:', err)
  process.exit(1)
})
