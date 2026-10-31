const collections = new Set(['items', 'requests', 'transactions', 'damage-reports'])
const records = new Map([...collections].map((name) => [name, new Map()]))
const requiredFields = {
  items: ['id', 'ownerId', 'name', 'category'],
  requests: ['id', 'itemId', 'borrowerId', 'ownerId', 'requestedStartDate', 'requestedDueDate'],
  transactions: ['id', 'requestId', 'itemId', 'lenderId', 'borrowerId', 'dueDate'],
  'damage-reports': ['id', 'transactionId', 'itemId', 'description', 'beforeEvidence', 'afterEvidence'],
}

function validationError(collection, record) {
  const missing = requiredFields[collection].filter((field) => !record[field])
  if (missing.length) return `Required fields: ${missing.join(', ')}.`
  if (collection === 'requests' && new Date(record.requestedDueDate) <= new Date(record.requestedStartDate)) return 'The due date must be after the start date.'
  if (collection === 'items' && (!Number.isFinite(Number(record.quantity)) || Number(record.quantity) < 1)) return 'Item quantity must be at least one.'
  return ''
}

export function apiPlugin() {
  return {
    name: 'peerlink-local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (request, response, next) => {
        if (request.method === 'OPTIONS') {
          response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
          response.end()
          return
        }
        const [collection, recordId] = (request.url ?? '').split('?')[0].split('/').filter(Boolean)
        if (!collections.has(collection)) {
          response.writeHead(404, { 'Content-Type': 'application/json' })
          response.end(JSON.stringify({ error: 'Unknown API resource.' }))
          return
        }
        const store = records.get(collection)
        const send = (status, body) => {
          response.writeHead(status, { 'Content-Type': 'application/json' })
          response.end(JSON.stringify(body))
        }
        const readBody = () => new Promise((resolve, reject) => {
          let body = ''
          request.on('data', (chunk) => { body += chunk })
          request.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}) } catch { reject(new Error('Request body must be valid JSON.')) }
          })
          request.on('error', reject)
        })
        try {
          if (request.method === 'GET') {
            if (recordId) return store.has(recordId) ? send(200, store.get(recordId)) : send(404, { error: 'Record not found.' })
            return send(200, [...store.values()])
          }
          if (request.method === 'POST') {
            const body = await readBody()
            const invalid = validationError(collection, body)
            if (invalid) return send(400, { error: invalid })
            if (store.has(body.id)) return send(409, { error: 'A record with this id already exists.' })
            store.set(body.id, body)
            return send(201, body)
          }
          if (request.method === 'PUT') {
            const body = await readBody()
            if (!recordId || !store.has(recordId)) return send(404, { error: 'Record not found.' })
            if (body.id && body.id !== recordId) return send(400, { error: 'Record id cannot be changed.' })
            const updated = { ...store.get(recordId), ...body, id: recordId }
            const invalid = validationError(collection, updated)
            if (invalid) return send(400, { error: invalid })
            store.set(recordId, updated)
            return send(200, updated)
          }
          if (request.method === 'DELETE') {
            if (!recordId || !store.has(recordId)) return send(404, { error: 'Record not found.' })
            store.delete(recordId)
            return send(204, {})
          }
          return next()
        } catch (error) {
          send(400, { error: error.message || 'Invalid request.' })
        }
      })
    },
  }
}
