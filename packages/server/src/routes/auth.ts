import { FastifyInstance } from 'fastify'
import { registerUser, authenticateUser } from '../services/userService'

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/auth/register', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }
    try {
      await registerUser(username, password)
      reply.code(201).send({ message: 'User registered' })
    } catch (err: any) {
      reply.code(400).send({ error: err.message })
    }
  })

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }
    try {
      const user = await authenticateUser(username, password)
      const token = fastify.jwt.sign({ username: user.username })
      reply.send({ token })
    } catch (err: any) {
      reply.code(401).send({ error: 'Invalid credentials' })
    }
  })
}
