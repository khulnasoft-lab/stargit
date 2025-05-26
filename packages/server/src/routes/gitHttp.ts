import { FastifyInstance } from 'fastify'
import http from 'http'
import { serveGit } from '../services/gitService'

export default async function gitHttp(fastify: FastifyInstance) {
  // GET /repos/:user/:repo/info/refs
  fastify.get('/repos/:user/:repo/info/refs', async (request, reply) => {
    const { user, repo } = request.params as { user: string, repo: string }
    const service = request.query['service'] as string
    const { handleInfoRefs } = await import('../services/gitService')
    await handleInfoRefs(user, repo, service, request.raw as http.IncomingMessage, reply.raw as http.ServerResponse)
  })

  // POST /repos/:user/:repo/git-upload-pack
  fastify.post('/repos/:user/:repo/git-upload-pack', async (request, reply) => {
    const { user, repo } = request.params as { user: string, repo: string }
    const { handleUploadPack } = await import('../services/gitService')
    await handleUploadPack(user, repo, request.raw as http.IncomingMessage, reply.raw as http.ServerResponse)
  })

  // POST /repos/:user/:repo/git-receive-pack
  fastify.post('/repos/:user/:repo/git-receive-pack', async (request, reply) => {
    const { user, repo } = request.params as { user: string, repo: string }
    const { handleReceivePack } = await import('../services/gitService')
    await handleReceivePack(user, repo, request.raw as http.IncomingMessage, reply.raw as http.ServerResponse)
  })
}
