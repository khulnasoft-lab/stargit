import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import * as git from 'isomorphic-git'
import { fireWebhook } from '../hooks/gitHooks'

const REPO_ROOT = path.resolve('repos')

export async function gitRoutes(fastify: FastifyInstance) {
  // Info/Refs (for git clone/fetch)
  fastify.get('/repos/:user/:repo/info/refs', async (req, reply) => {
    const { user, repo } = req.params as any
    const service = (req.query.service || '').replace(/^git-/, '')
    const dir = path.join(REPO_ROOT, user, `${repo}.git`)

    if (!fs.existsSync(dir)) {
      reply.code(404).send('Repository not found')
      return
    }

    reply
      .header('Content-Type', `application/x-git-${service}-advertisement`)
      .header('Cache-Control', 'no-cache')

    const stream = await git.listServerRefs({
      fs,
      dir,
      service,
      prefix: `refs/`,
    })

    // Return pkt-line advertised refs
    const pkt = `# service=git-${service}\n0000${stream.map(ref => `003f${ref.ref} ${ref.oid}\n`).join('')}0000`
    return reply.send(pkt)
  })

  // Git fetch (upload-pack)
  fastify.post('/repos/:user/:repo/git-upload-pack', async (req, reply) => {
    const { user, repo } = req.params as any
    const dir = path.join(REPO_ROOT, user, `${repo}.git`)

    if (!fs.existsSync(dir)) {
      reply.code(404).send('Repository not found')
      return
    }

    // JWT user extraction (set by fastify-jwt)
    const jwtUser = (req as any).user?.username || 'anonymous'
    console.log(`[FETCH] User: ${jwtUser} Repo: ${user}/${repo}`)

    const buffers: Buffer[] = []
    for await (const chunk of req.raw) {
      buffers.push(chunk)
    }
    const body = Buffer.concat(buffers)

    // Event hook: log fetch
    // (extend here for custom validation or analytics)

    const result = await git.uploadPack({
      fs,
      dir,
      request: {
        headers: req.headers,
        body,
      },
    })

    reply
      .header('Content-Type', 'application/x-git-upload-pack-result')
      .send(result.body)
  })

  // Git push (receive-pack)
  fastify.post('/git/:owner/:repo/git-receive-pack', async (req, reply) => {
    const { owner, repo } = req.params as { owner: string; repo: string };
    const dir = path.join(REPO_ROOT, owner, `${repo}.git`);

    if (!fs.existsSync(dir)) {
      reply.code(404).send('Repository not found');
      return;
    }

    // --- Authorization and Branch Protection ---
    const usersPath = path.join(process.cwd(), 'data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    const repoData = users[owner]?.repos?.[repo];

    if (!repoData) {
      reply.code(404).send('Repository not found');
      return;
    }

    const username = req.user?.username;
    const isReviewer = req.user?.isReviewer ?? false;

    // Permission check
    const isOwner = repoData.owners.includes(username);
    const isCollaborator = repoData.collaborators.includes(username);
    if (!isOwner && !isCollaborator) {
      reply.code(403).send('You do not have push access to this repository.');
      return;
    }

    // Branch protection check
    const protection = repoData.settings?.branchProtection || {};
    const refs = await extractPushedRefs(req);

    for (const refName of refs) {
      const rules = protection[refName];
      if (rules?.requireReview && !isReviewer) {
        reply.code(403).send(`Branch '${refName}' requires review approval before pushing.`);
        return;
      }
    }

    // --- Proceed with isomorphic-git logic ---
    // You may need to re-assemble the body for isomorphic-git after reading the stream above
    const buffers: Buffer[] = [];
    for await (const chunk of req.raw) {
      buffers.push(chunk);
    }
    const body = Buffer.concat(buffers);

    const result = await git.receivePack({
      fs,
      dir,
      request: {
        headers: req.headers,
        body,
      },
    });

    // Fire webhook after successful push
    await fireWebhook('push', {
      repo: `${owner}/${repo}`,
      pushedBy: username,
      timestamp: new Date().toISOString(),
    });

    reply
      .header('Content-Type', 'application/x-git-receive-pack-result')
      .send(result.body);
  });
}
