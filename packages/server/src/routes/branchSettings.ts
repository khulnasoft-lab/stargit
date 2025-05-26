import fs from 'fs';
import path from 'path';
import { FastifyInstance } from 'fastify';

export async function branchSettingsRoute(fastify: FastifyInstance) {
  fastify.post('/api/repos/:org/:repo/branches/:branch/settings', async (req, reply) => {
    const { org, repo, branch } = req.params as any;
    const { requireReview, reviewers } = req.body as any;
    const userPath = path.join(process.cwd(), 'data/users.json');

    const users = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
    const repoData = users[org]?.repos?.[repo];

    const username = (req.user as any)?.username;
    if (!repoData || !repoData.owners.includes(username)) {
      return reply.code(403).send({ error: 'Only owners can update branch settings' });
    }

    if (!repoData.settings) repoData.settings = {};
    if (!repoData.settings.branchProtection) repoData.settings.branchProtection = {};
    if (!repoData.settings.reviewers) repoData.settings.reviewers = {};

    repoData.settings.branchProtection[branch] = {
      requireReview: !!requireReview,
    };
    repoData.settings.reviewers[branch] = reviewers || [];

    fs.writeFileSync(userPath, JSON.stringify(users, null, 2));
    return reply.send({ success: true });
  });
}
