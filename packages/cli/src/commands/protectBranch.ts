import fs from 'fs';
import path from 'path';

export function protectBranch(org: string, repo: string, branch: string, options: { requireReview?: boolean }) {
  const userPath = path.join(process.cwd(), 'data/users.json');
  const users = JSON.parse(fs.readFileSync(userPath, 'utf-8'));

  const repoData = users[org]?.repos?.[repo];
  if (!repoData) {
    console.error('Repo not found');
    return;
  }

  if (!repoData.settings) repoData.settings = {};
  if (!repoData.settings.branchProtection) repoData.settings.branchProtection = {};

  repoData.settings.branchProtection[branch] = {
    ...repoData.settings.branchProtection[branch],
    requireReview: !!options.requireReview,
  };

  fs.writeFileSync(userPath, JSON.stringify(users, null, 2));
  console.log(`Branch protection updated for ${org}/${repo}:${branch}`);
}
