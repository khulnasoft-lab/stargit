import http from 'http'
import path from 'path'
import fs from 'fs'
import * as git from 'isomorphic-git'

// Handler for GET /repos/:user/:repo/info/refs
export async function handleInfoRefs(
  user: string,
  repo: string,
  service: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const repoPath = path.join(__dirname, '../../repos', user, repo)
  res.setHeader('Content-Type', `application/x-git-${service}-advertisement`)
  res.setHeader('Cache-Control', 'no-cache')
  if (service === 'git-upload-pack') {
    await git.serveInfoRefs({
      fs,
      dir: repoPath,
      service: 'git-upload-pack',
      httpRequest: req,
      httpResponse: res,
    })
  } else if (service === 'git-receive-pack') {
    await git.serveInfoRefs({
      fs,
      dir: repoPath,
      service: 'git-receive-pack',
      httpRequest: req,
      httpResponse: res,
    })
  } else {
    res.statusCode = 400
    res.end('Unsupported service')
  }
}

// Handler for POST /repos/:user/:repo/git-upload-pack
export async function handleUploadPack(
  user: string,
  repo: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const repoPath = path.join(__dirname, '../../repos', user, repo)
  res.setHeader('Content-Type', 'application/x-git-upload-pack-result')
  res.setHeader('Cache-Control', 'no-cache')
  await git.serveUploadPack({
    fs,
    dir: repoPath,
    httpRequest: req,
    httpResponse: res,
  })
}

// Handler for POST /repos/:user/:repo/git-receive-pack
export async function handleReceivePack(
  user: string,
  repo: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const repoPath = path.join(__dirname, '../../repos', user, repo)
  res.setHeader('Content-Type', 'application/x-git-receive-pack-result')
  res.setHeader('Cache-Control', 'no-cache')
  await git.serveReceivePack({
    fs,
    dir: repoPath,
    httpRequest: req,
    httpResponse: res,
  })
}
