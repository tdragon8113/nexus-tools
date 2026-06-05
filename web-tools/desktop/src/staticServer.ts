import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8'
}

function safeJoin(root: string, requestPath: string): string | null {
  const normalized = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  const full = path.join(root, normalized)
  if (!full.startsWith(root)) return null
  return full
}

function resolveFile(root: string, urlPath: string): string | null {
  const clean = urlPath.split('?')[0] || '/'
  let rel = clean
  if (rel.endsWith('/')) rel += 'index.html'
  if (!path.extname(rel)) {
    const asDir = safeJoin(root, rel.slice(1))
    if (asDir) {
      const indexInDir = path.join(asDir, 'index.html')
      if (fs.existsSync(indexInDir)) return indexInDir
    }
    const htmlPath = safeJoin(root, `${rel.slice(1)}.html`)
    if (htmlPath && fs.existsSync(htmlPath)) return htmlPath
    const indexHtml = safeJoin(root, path.join(rel.slice(1), 'index.html'))
    if (indexHtml && fs.existsSync(indexHtml)) return indexHtml
  }
  const direct = safeJoin(root, rel.slice(1) || 'index.html')
  if (direct && fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  const fallback = safeJoin(root, 'index.html')
  return fallback && fs.existsSync(fallback) ? fallback : null
}

/** 固定端口，保证 Electron localStorage 的 origin 在每次启动间一致 */
export const NEXUS_STATIC_SERVER_PORT = 39281

/** 为 Nuxt generate 产物提供本地 HTTP，避免 file:// 路由问题 */
export function startStaticServer(root: string): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve, reject) => {
    const absRoot = path.resolve(root)
    if (!fs.existsSync(absRoot)) {
      reject(new Error(`Static root not found: ${absRoot}`))
      return
    }

    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
      const filePath = resolveFile(absRoot, urlPath)
      if (!filePath) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      const ext = path.extname(filePath)
      const type = MIME[ext] ?? 'application/octet-stream'
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500)
          res.end('Error')
          return
        }
        res.writeHead(200, { 'Content-Type': type })
        res.end(data)
      })
    })

    const bind = (port: number) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && port === NEXUS_STATIC_SERVER_PORT) {
          console.warn(
            `[Nexus Tools] 端口 ${NEXUS_STATIC_SERVER_PORT} 被占用，回退随机端口（localStorage 可能无法跨重启保留）`
          )
          bind(0)
          return
        }
        reject(err)
      })
      server.listen(port, '127.0.0.1', () => {
        const addr = server.address()
        if (!addr || typeof addr === 'string') {
          reject(new Error('Failed to bind static server'))
          return
        }
        resolve({
          port: addr.port,
          close: () => server.close()
        })
      })
    }

    bind(NEXUS_STATIC_SERVER_PORT)
  })
}
