import Fastify from 'fastify'
import fastifyJwt from 'fastify-jwt'
import authRoutes from './routes/auth'
import { gitRoutes } from './routes/git'
import fs from 'fs'
import path from 'path'

const fastify = Fastify()

// Advanced Access Control Decorator
fastify.decorate('verifyRepoAccess', async (user: string, repoPath: string, mode: 'read' | 'write') => {
  const usersFile = path.join(__dirname, '../../../users.json')
  const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
  const [owner, repo] = repoPath.split('/')
  const repoConfig = data[owner]?.repos?.[repo]

  if (!repoConfig) return false

  if (mode === 'read') {
    return (
      user === owner ||
      repoConfig.owners.includes(user) ||
      repoConfig.collaborators.includes(user)
    )
  }
  if (mode === 'write') {
    return (
      user === owner || repoConfig.owners.includes(user)
    )
  }
  return false
})

// Register JWT plugin
fastify.register(fastifyJwt, { secret: 'supersecret-jwt-key' })

// Register auth routes
fastify.register(authRoutes)

// Register Git HTTP routes, with JWT protection for push/pull
fastify.register(async (instance) => {
  // Protect push/pull endpoints
  instance.addHook('preHandler', async (request, reply) => {
    // Only protect git-upload-pack and git-receive-pack
    const url = request.raw.url || ''
    if (
      url.endsWith('git-upload-pack') ||
      url.endsWith('git-receive-pack')
    ) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' })
      }
    }
  })
  await gitRoutes(instance)
})

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err
  console.log('🚀 Stargit running at http://localhost:3000')
})
