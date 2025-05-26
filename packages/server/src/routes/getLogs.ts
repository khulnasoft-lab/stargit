import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';

export async function getLogsRoute(fastify: FastifyInstance) {
  fastify.get('/api/repos/:org/:repo/logs', async (req, reply) => {
    const { org, repo } = req.params as any;
    const LOG_PATH = path.join(process.cwd(), 'data/logs.json');

    if (!fs.existsSync(LOG_PATH)) return reply.send([]);

    const logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    const filtered = logs.filter((l: any) => l.repo === `${org}/${repo}`);

    reply.send(filtered);
  });
}
