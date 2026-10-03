import os from 'os'
import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apiRouter from './api/router.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.disable('x-powered-by')

const pagina = (archivo) => (req, res) => {
  const ruta = path.join(__dirname, archivo)
  if (fs.existsSync(ruta)) return res.sendFile(ruta)
  res.status(404).send(`${archivo} no encontrado`)
}

app.get('/', pagina('index.html'))
app.get(['/status-api', '/status-api.html'], pagina('status-api.html'))
app.get('/endpoints.html', pagina('endpoints.html'))
app.get('/health', (req, res) => res.json({ status: true, uptime: process.uptime() }))

app.use('/api', apiRouter)

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ status: false, message: 'Ruta no encontrada' })
  }
  res.status(404).send('Página no encontrada')
})

const enVercel = Boolean(process.env.VERCEL)
const enRender = Boolean(process.env.RENDER)

async function ipPublica() {
  try {
    const r = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(3000) })
    return (await r.text()).trim()
  } catch {
    return null
  }
}

if (!enVercel) {
  const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3000)
  const HOST = process.env.HOST || '0.0.0.0'
  app.listen(PORT, HOST, async () => {
    if (!enRender) {
      const pub = await ipPublica()
      if (pub) console.log(`[INFO] Servidor encendido en: http://${pub}:${PORT}`)
    }
  })
}

export default app