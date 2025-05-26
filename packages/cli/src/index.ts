#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'

const USERS_PATH = 'data/users.json'

function loadUsers() {
  if (!fs.existsSync(USERS_PATH)) return {}
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'))
}

function saveUsers(data: any) {
  fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true })
  fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2))
}

const program = new Command()

program
  .command('create-repo <owner>/<repo>')
  .description('Create a bare git repo')
  .action((repoPath) => {
    const [owner, repo] = repoPath.split('/')
    const dir = path.join('repos', owner, `${repo}.git`)
    fs.mkdirSync(dir, { recursive: true })
    require('child_process').execSync('git init --bare', { cwd: dir })

    const users = loadUsers()
    if (!users[owner]) users[owner] = { repos: {} }
    if (!users[owner].repos) users[owner].repos = {}
    users[owner].repos[repo] = { owners: [owner], collaborators: [], settings: {} }
    saveUsers(users)

    console.log(`✅ Repo ${owner}/${repo} created.`)
  })

program
  .command('add-collab <owner>/<repo> <username>')
  .description('Add a collaborator to a repo')
  .action((repoPath, username) => {
    const [owner, repo] = repoPath.split('/')
    const users = loadUsers()
    const repoData = users[owner]?.repos?.[repo]

    if (!repoData) return console.error(`❌ Repo not found: ${repoPath}`)
    if (!repoData.collaborators.includes(username)) {
      repoData.collaborators.push(username)
    }
    saveUsers(users)
    console.log(`✅ ${username} added as collaborator to ${repoPath}`)
  })

import { protectBranch } from './commands/protectBranch';

program
  .command('protect-branch')
  .argument('<org>')
  .argument('<repo>')
  .argument('<branch>')
  .option('--require-review', 'Require PR review before pushing')
  .action(protectBranch);

program.parse()
