import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

const router = express.Router()

const API_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(API_DIR, '..')

const SAFE = /^[a-z0-9_-]+$/i
const ENDPOINT_FILE = /^[a-z0-9_]+-[a-z0-9_-]+\.js$/i

const listarEndpoints = () =>
  fs.readdirSync(API_DIR).filter((f) => ENDPOINT_FILE.test(f)).sort()

const leerMeta = (filePath) => {
  const code = fs.readFileSync(filePath, 'utf8')
  const prm = code.match(/export\s+const\s+prm\s*=\s*['"]([^'"]+)['"]/)?.[1] || 'query'
  const udf = code.match(/export\s+const\s+udf\s*=\s*['"]([^'"]+)['"]/)?.[1] || ''
  return { prm, udf }
}

router.get('/', (req, res) => {
  const links = listarEndpoints().map((f) => `<a href="${f}">${f}</a>`).join('\n')
  res.type('html').send(`<!DOCTYPE html><html><body>\n${links}\n</body></html>`)
})

router.get('/:file([a-z0-9_-]+\\.js)', (req, res) => {
  const file = req.params.file
  if (!ENDPOINT_FILE.test(file)) return res.status(404).type('text').send('No encontrado')
  const filePath = path.join(API_DIR, file)
  if (!fs.existsSync(filePath)) return res.status(404).type('text').send('No encontrado')
  const { prm, udf } = leerMeta(filePath)
  res.type('text').send(`export const prm = '${prm}';\nexport const udf = '${udf}';\n`)
})

router.get('/:categoria/:endpoint/ui', (req, res) => {
  const rutaHtml = [path.join(API_DIR, 'ruta.html'), path.join(ROOT_DIR, 'ruta.html')]
   .find((p) => fs.existsSync(p))
  if (rutaHtml) return res.sendFile(rutaHtml)
  res.status(404).send('Archivo ruta.html no encontrado')
})

router.get('/:categoria/:endpoint', async (req, res) => {
  try {
    const { categoria, endpoint } = req.params
    if (!SAFE.test(categoria) ||!SAFE.test(endpoint)) {
      return res.status(400).json({ status: false, message: 'Ruta inválida' })
    }
    const filePath = path.join(API_DIR, `${categoria}-${endpoint}.js`)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: false, message: 'Endpoint no encontrado: ' + filePath })
    }
    const modulo = await import(pathToFileURL(filePath).href + '?v=' + Date.now())
    const paramName = modulo.prm || 'query'
    const queryValue = req.query[paramName]

    if (!queryValue) {
      return res.status(400).json({ status: false, message: `Falta el parametro?${paramName}=` })
    }

    const resultado = await modulo.default(queryValue, req.query)
    res.json(resultado)
  } catch (error) {
    console.error("ERROR REAL:", error)
    res.status(500).json({
      status: false,
      message: error.message,
      stack: error.stack?.split('\n').slice(0,5)
    })
  }
})

router.get('/:categoria', (req, res, next) => {
  if (req.params.categoria.includes('.')) return next()
  const endpointsHtml = path.join(ROOT_DIR, 'endpoints.html')
  if (fs.existsSync(endpointsHtml)) return res.sendFile(endpointsHtml)
  res.status(404).send('Página no encontrada')
})

export default router
