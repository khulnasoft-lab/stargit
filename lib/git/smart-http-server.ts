import type { IncomingMessage, ServerResponse } from "http"
import { spawn } from "child_process"
import { join } from "path"
import { promisify } from "util"
import { supabase } from "../supabase"
import { PermissionService } from "../auth/permissions"

const exec = promisify(require("child_process").exec)

interface GitRequest {
  service: string
  repository: string
  owner: string
  repoName: string
  user?: string
  isUploadPack: boolean
  isReceivePack: boolean
}

/**
 * Git Smart HTTP Server
 *
 * Implements the Git Smart HTTP protocol for handling git clone, fetch, and push operations.
 * This server provides HTTP-based Git operations compatible with standard Git clients.
 *
 * Protocol Overview:
 * 1. Client requests info/refs with service parameter
 * 2. Server responds with references and capabilities
 * 3. Client sends pack data for push or requests objects for fetch
 * 4. Server processes the request and responds accordingly
 */
export class GitSmartHTTPServer {
  private repositoriesPath: string
  private gitUser: string
  private gitEmail: string

  constructor(repositoriesPath: string = process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories") {
    this.repositoriesPath = repositoriesPath
    this.gitUser = process.env.GIT_USER || "git"
    this.gitEmail = process.env.GIT_EMAIL || "git@localhost"
  }

  /**
   * Handle incoming Git HTTP requests
   */
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const gitRequest = this.parseGitRequest(req)

      if (!gitRequest) {
        this.sendError(res, 400, "Invalid Git request")
        return
      }

      // Authenticate and authorize the request
      const authResult = await this.authenticateRequest(req, gitRequest)
      if (!authResult.success) {
        this.sendError(res, authResult.statusCode, authResult.message)
        return
      }

      gitRequest.user = authResult.user

      // Handle different Git operations
      if (req.url?.includes("/info/refs")) {
        await this.handleInfoRefs(req, res, gitRequest)
      } else if (req.url?.includes("/git-upload-pack")) {
        await this.handleUploadPack(req, res, gitRequest)
      } else if (req.url?.includes("/git-receive-pack")) {
        await this.handleReceivePack(req, res, gitRequest)
      } else {
        this.sendError(res, 404, "Not found")
      }
    } catch (error) {
      console.error("Git HTTP server error:", error)
      this.sendError(res, 500, "Internal server error")
    }
  }

  /**
   * Parse Git request from HTTP request
   */
  private parseGitRequest(req: IncomingMessage): GitRequest | null {
    const url = req.url
    if (!url) return null

    // Parse URL: /owner/repo.git/git-upload-pack or /owner/repo.git/info/refs?service=git-upload-pack
    const match = url.match(/^\/([^/]+)\/([^/]+)\.git\/(.+)/)
    if (!match) return null

    const [, owner, repoName, path] = match
    const repository = `${owner}/${repoName}`

    // Determine service type
    let service = ""
    let isUploadPack = false
    let isReceivePack = false

    if (path.startsWith("info/refs")) {
      const urlParams = new URLSearchParams(url.split("?")[1] || "")
      service = urlParams.get("service") || ""
    } else if (path === "git-upload-pack") {
      service = "git-upload-pack"
    } else if (path === "git-receive-pack") {
      service = "git-receive-pack"
    }

    isUploadPack = service === "git-upload-pack"
    isReceivePack = service === "git-receive-pack"

    return {
      service,
      repository,
      owner,
      repoName,
      isUploadPack,
      isReceivePack,
    }
  }

  /**
   * Authenticate Git request
   */
  private async authenticateRequest(
    req: IncomingMessage,
    gitRequest: GitRequest,
  ): Promise<{ success: boolean; statusCode: number; message: string; user?: string }> {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return {
        success: false,
        statusCode: 401,
        message: "Authentication required",
      }
    }

    try {
      let user: string | undefined

      if (authHeader.startsWith("Basic ")) {
        // Basic authentication
        const credentials = Buffer.from(authHeader.slice(6), "base64").toString()
        const [username, password] = credentials.split(":")

        // Verify credentials against database
        const { data: userData, error } = await supabase
          .from("users")
          .select("id, username")
          .eq("username", username)
          .single()

        if (error || !userData) {
          return {
            success: false,
            statusCode: 401,
            message: "Invalid credentials",
          }
        }

        // In a real implementation, you would verify the password
        // For this example, we'll assume the password is valid
        user = userData.username
      } else if (authHeader.startsWith("Bearer ")) {
        // Token authentication
        const token = authHeader.slice(7)

        // Verify token against database
        const { data: tokenData, error } = await supabase
          .from("api_tokens")
          .select(`
            id,
            user_id,
            scopes,
            users!inner(username)
          `)
          .eq("token_hash", this.hashToken(token))
          .eq("status", "active")
          .single()

        if (error || !tokenData) {
          return {
            success: false,
            statusCode: 401,
            message: "Invalid token",
          }
        }

        user = tokenData.users.username
      }

      if (!user) {
        return {
          success: false,
          statusCode: 401,
          message: "Authentication failed",
        }
      }

      // Check repository permissions
      const hasPermission = await this.checkRepositoryPermission(user, gitRequest)
      if (!hasPermission) {
        return {
          success: false,
          statusCode: 403,
          message: "Insufficient permissions",
        }
      }

      return {
        success: true,
        statusCode: 200,
        message: "Authenticated",
        user,
      }
    } catch (error) {
      console.error("Authentication error:", error)
      return {
        success: false,
        statusCode: 500,
        message: "Authentication error",
      }
    }
  }

  /**
   * Check repository permissions
   */
  private async checkRepositoryPermission(user: string, gitRequest: GitRequest): Promise<boolean> {
    try {
      // Get user and repository data
      const { data: userData } = await supabase.from("users").select("id").eq("username", user).single()

      const { data: repoData } = await supabase
        .from("repositories")
        .select("id, visibility")
        .eq("full_name", gitRequest.repository)
        .single()

      if (!userData || !repoData) {
        return false
      }

      // Public repositories allow read access to everyone
      if (repoData.visibility === "public" && gitRequest.isUploadPack) {
        return true
      }

      // Check specific permissions for private repositories or write operations
      const requiredPermission = gitRequest.isReceivePack ? "write" : "read"
      return await PermissionService.hasRepositoryPermission(userData.id, repoData.id, requiredPermission, "repo")
    } catch (error) {
      console.error("Permission check error:", error)
      return false
    }
  }

  /**
   * Handle info/refs request
   */
  private async handleInfoRefs(req: IncomingMessage, res: ServerResponse, gitRequest: GitRequest): Promise<void> {
    const repoPath = this.getRepositoryPath(gitRequest.owner, gitRequest.repoName)

    // Set appropriate headers
    res.setHeader("Content-Type", `application/x-${gitRequest.service}-advertisement`)
    res.setHeader("Cache-Control", "no-cache")

    // Write packet line with service advertisement
    const serviceAd = `# service=${gitRequest.service}\n`
    this.writePacketLine(res, serviceAd)
    this.writeFlushPacket(res)

    // Spawn git process
    const gitProcess = spawn("git", [
      gitRequest.service.replace("git-", ""),
      "--stateless-rpc",
      "--advertise-refs",
      repoPath,
    ])

    // Pipe git output to response
    gitProcess.stdout.on("data", (data) => {
      res.write(data)
    })

    gitProcess.stderr.on("data", (data) => {
      console.error("Git process error:", data.toString())
    })

    gitProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Git process exited with code ${code}`)
      }
      res.end()
    })

    gitProcess.on("error", (error) => {
      console.error("Git process spawn error:", error)
      this.sendError(res, 500, "Git process error")
    })
  }

  /**
   * Handle git-upload-pack request (fetch/clone)
   */
  private async handleUploadPack(req: IncomingMessage, res: ServerResponse, gitRequest: GitRequest): Promise<void> {
    const repoPath = this.getRepositoryPath(gitRequest.owner, gitRequest.repoName)

    // Set appropriate headers
    res.setHeader("Content-Type", "application/x-git-upload-pack-result")
    res.setHeader("Cache-Control", "no-cache")

    // Spawn git-upload-pack process
    const gitProcess = spawn("git", ["upload-pack", "--stateless-rpc", repoPath])

    // Pipe request body to git process
    req.pipe(gitProcess.stdin)

    // Pipe git output to response
    gitProcess.stdout.pipe(res)

    gitProcess.stderr.on("data", (data) => {
      console.error("Git upload-pack error:", data.toString())
    })

    gitProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Git upload-pack exited with code ${code}`)
      }
    })

    gitProcess.on("error", (error) => {
      console.error("Git upload-pack spawn error:", error)
      this.sendError(res, 500, "Git process error")
    })
  }

  /**
   * Handle git-receive-pack request (push)
   */
  private async handleReceivePack(req: IncomingMessage, res: ServerResponse, gitRequest: GitRequest): Promise<void> {
    const repoPath = this.getRepositoryPath(gitRequest.owner, gitRequest.repoName)

    // Set appropriate headers
    res.setHeader("Content-Type", "application/x-git-receive-pack-result")
    res.setHeader("Cache-Control", "no-cache")

    // Set up environment variables for git hooks
    const env = {
      ...process.env,
      GIT_DIR: repoPath,
      REMOTE_USER: gitRequest.user || "unknown",
      REPOSITORY: gitRequest.repository,
    }

    // Spawn git-receive-pack process
    const gitProcess = spawn("git", ["receive-pack", "--stateless-rpc", repoPath], { env })

    // Pipe request body to git process
    req.pipe(gitProcess.stdin)

    // Pipe git output to response
    gitProcess.stdout.pipe(res)

    gitProcess.stderr.on("data", (data) => {
      console.error("Git receive-pack error:", data.toString())
    })

    gitProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Git receive-pack exited with code ${code}`)
      }
    })

    gitProcess.on("error", (error) => {
      console.error("Git receive-pack spawn error:", error)
      this.sendError(res, 500, "Git process error")
    })
  }

  /**
   * Get repository path
   */
  private getRepositoryPath(owner: string, repoName: string): string {
    return join(this.repositoriesPath, owner, `${repoName}.git`)
  }

  /**
   * Write packet line to response
   */
  private writePacketLine(res: ServerResponse, data: string): void {
    const length = (data.length + 4).toString(16).padStart(4, "0")
    res.write(length + data)
  }

  /**
   * Write flush packet to response
   */
  private writeFlushPacket(res: ServerResponse): void {
    res.write("0000")
  }

  /**
   * Send error response
   */
  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.statusCode = statusCode
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ error: message }))
  }

  /**
   * Hash token for comparison
   */
  private hashToken(token: string): string {
    const crypto = require("crypto")
    return crypto.createHash("sha256").update(token).digest("hex")
  }
}

// Export singleton instance
export const gitSmartHTTPServer = new GitSmartHTTPServer()
