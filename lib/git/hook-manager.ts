import { promises as fs } from "fs"
import { join } from "path"
import { promisify } from "util"

const exec = promisify(require("child_process").exec)

interface HookConfig {
  owner: string
  name: string
  visibility: "public" | "private" | "internal"
}

/**
 * Git Hook Manager
 *
 * Manages Git hooks for repositories:
 * - pre-receive: Access control, branch protection, commit validation
 * - post-receive: Notifications, CI/CD triggers, webhook delivery
 * - update: Branch-specific validations
 * - pre-push: Client-side validations
 */
export class GitHookManager {
  private apiEndpoint: string

  constructor() {
    this.apiEndpoint = process.env.API_ENDPOINT || "http://localhost:3000/api"
  }

  /**
   * Set up all hooks for a repository
   */
  async setupRepositoryHooks(repoPath: string, config: HookConfig): Promise<void> {
    const hooksDir = join(repoPath, "hooks")

    // Ensure hooks directory exists
    await fs.mkdir(hooksDir, { recursive: true })

    // Set up each hook
    await this.setupPreReceiveHook(hooksDir, config)
    await this.setupPostReceiveHook(hooksDir, config)
    await this.setupUpdateHook(hooksDir, config)

    // Make hooks executable
    const hooks = ["pre-receive", "post-receive", "update"]
    for (const hook of hooks) {
      await fs.chmod(join(hooksDir, hook), 0o755)
    }
  }

  /**
   * Set up pre-receive hook
   *
   * This hook runs before Git accepts any pushes and is used for:
   * - Access control validation
   * - Branch protection rules
   * - Commit message validation
   * - File size limits
   * - Prohibited file checks
   */
  private async setupPreReceiveHook(hooksDir: string, config: HookConfig): Promise<void> {
    const preReceiveHook = `#!/bin/bash
# Pre-receive hook for access control and validation
# Repository: ${config.owner}/${config.name}

# Read stdin (format: <old-value> <new-value> <ref-name>)
while read oldrev newrev refname; do
  # Skip if deleting a ref
  if [[ "$newrev" = "0000000000000000000000000000000000000000" ]]; then
    continue
  fi

  # Extract branch/tag name
  if [[ "$refname" == refs/heads/* ]]; then
    branch="\${refname#refs/heads/}"
    ref_type="branch"
  elif [[ "$refname" == refs/tags/* ]]; then
    branch="\${refname#refs/tags/}"
    ref_type="tag"
  else
    ref_type="other"
    branch="\${refname#refs/}"
  fi

  # Call API for access control and validation
  response=\$(curl -s -X POST "${this.apiEndpoint}/git/hooks/pre-receive" \\
    -H "Content-Type: application/json" \\
    -d "{
      \\"repository\\": \\"${config.owner}/${config.name}\\",
      \\"ref\\": \\"\$refname\\",
      \\"ref_type\\": \\"\$ref_type\\",
      \\"branch\\": \\"\$branch\\",
      \\"oldrev\\": \\"\$oldrev\\",
      \\"newrev\\": \\"\$newrev\\",
      \\"user\\": \\"\$GL_USERNAME\\"
    }")
  
  # Check response
  if [[ "\$response" != *"allowed"* ]]; then
    echo "Push rejected: \$(echo \$response | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
    exit 1
  fi

  # For non-empty pushes, validate commits
  if [[ "$oldrev" != "0000000000000000000000000000000000000000" ]]; then
    # Get list of commits being pushed
    commits=\$(git rev-list \$oldrev..\$newrev)
    
    # Check each commit
    for commit in \$commits; do
      # Validate commit message
      message=\$(git log --format=%B -n 1 \$commit)
      
      # Example: Require a minimum commit message length
      if [[ \${#message} -lt 10 ]]; then
        echo "Push rejected: Commit \$commit has a too short message. Minimum length is 10 characters."
        exit 1
      fi
      
      # Example: Check for prohibited files
      files_changed=\$(git diff-tree --no-commit-id --name-only -r \$commit)
      if echo "\$files_changed" | grep -q "\\.env\\|\\.pem\\|\\.key"; then
        echo "Push rejected: Commit \$commit contains prohibited files (.env, .pem, or .key files)"
        exit 1
      fi
    done
  fi
done

exit 0
`

    await fs.writeFile(join(hooksDir, "pre-receive"), preReceiveHook)
  }

  /**
   * Set up post-receive hook
   *
   * This hook runs after Git has accepted a push and is used for:
   * - Notifications
   * - CI/CD triggers
   * - Webhook delivery
   * - Cache invalidation
   */
  private async setupPostReceiveHook(hooksDir: string, config: HookConfig): Promise<void> {
    const postReceiveHook = `#!/bin/bash
# Post-receive hook for notifications and webhooks
# Repository: ${config.owner}/${config.name}

# Read stdin (format: <old-value> <new-value> <ref-name>)
while read oldrev newrev refname; do
  # Extract branch/tag name
  if [[ "$refname" == refs/heads/* ]]; then
    branch="\${refname#refs/heads/}"
    ref_type="branch"
  elif [[ "$refname" == refs/tags/* ]]; then
    branch="\${refname#refs/tags/}"
    ref_type="tag"
  else
    ref_type="other"
    branch="\${refname#refs/}"
  fi
  
  # Call webhook notification service
  curl -s -X POST "${this.apiEndpoint}/git/hooks/post-receive" \\
    -H "Content-Type: application/json" \\
    -d "{
      \\"repository\\": \\"${config.owner}/${config.name}\\",
      \\"ref\\": \\"\$refname\\",
      \\"ref_type\\": \\"\$ref_type\\",
      \\"branch\\": \\"\$branch\\",
      \\"oldrev\\": \\"\$oldrev\\",
      \\"newrev\\": \\"\$newrev\\",
      \\"user\\": \\"\$GL_USERNAME\\"
    }" > /dev/null 2>&1 &
  
  # Don't wait for webhook delivery to complete
done

# Update server info for dumb clients
git update-server-info

exit 0
`

    await fs.writeFile(join(hooksDir, "post-receive"), postReceiveHook)
  }

  /**
   * Set up update hook
   *
   * This hook runs once for each branch being updated and is used for:
   * - Branch-specific validations
   * - Protected branch enforcement
   */
  private async setupUpdateHook(hooksDir: string, config: HookConfig): Promise<void> {
    const updateHook = `#!/bin/bash
# Update hook for branch-specific validations
# Repository: ${config.owner}/${config.name}

# Arguments: <ref-name> <old-value> <new-value>
refname="$1"
oldrev="$2"
newrev="$3"

# Extract branch/tag name
if [[ "$refname" == refs/heads/* ]]; then
  branch="\${refname#refs/heads/}"
  ref_type="branch"
elif [[ "$refname" == refs/tags/* ]]; then
  branch="\${refname#refs/tags/}"
  ref_type="tag"
else
  ref_type="other"
  branch="\${refname#refs/}"
fi

# Call API for branch-specific validation
response=\$(curl -s -X POST "${this.apiEndpoint}/git/hooks/update" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"repository\\": \\"${config.owner}/${config.name}\\",
    \\"ref\\": \\"\$refname\\",
    \\"ref_type\\": \\"\$ref_type\\",
    \\"branch\\": \\"\$branch\\",
    \\"oldrev\\": \\"\$oldrev\\",
    \\"newrev\\": \\"\$newrev\\",
    \\"user\\": \\"\$GL_USERNAME\\"
  }")

# Check response
if [[ "\$response" != *"allowed"* ]]; then
  echo "Push rejected: \$(echo \$response | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
  exit 1
fi

exit 0
`

    await fs.writeFile(join(hooksDir, "update"), updateHook)
  }

  /**
   * Generate client-side pre-push hook
   *
   * This hook is not installed on the server but can be provided to clients
   * for client-side validations before pushing
   */
  async generateClientPrePushHook(config: HookConfig): Promise<string> {
    return `#!/bin/bash
# Pre-push hook for client-side validations
# Repository: ${config.owner}/${config.name}

# Read stdin (format: <local-ref> <local-sha> <remote-ref> <remote-sha>)
while read local_ref local_sha remote_ref remote_sha; do
  # Skip if pushing nothing
  if [[ "$local_sha" = "0000000000000000000000000000000000000000" ]]; then
    continue
  fi
  
  # Run tests before pushing
  echo "Running tests before pushing..."
  if ! npm test; then
    echo "Tests failed. Push aborted."
    exit 1
  fi
  
  # Check for large files
  large_files=\$(git diff --staged --name-only | xargs ls -l | awk '$5 > 5000000 {print $9}')
  if [[ -n "$large_files" ]]; then
    echo "Warning: You're about to push files larger than 5MB:"
    echo "$large_files"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
done

exit 0
`
  }

  /**
   * Update a specific hook
   */
  async updateHook(repoPath: string, hookName: string, content: string): Promise<void> {
    const hookPath = join(repoPath, "hooks", hookName)
    await fs.writeFile(hookPath, content)
    await fs.chmod(hookPath, 0o755)
  }

  /**
   * Get hook content
   */
  async getHookContent(repoPath: string, hookName: string): Promise<string> {
    const hookPath = join(repoPath, "hooks", hookName)
    try {
      return await fs.readFile(hookPath, "utf-8")
    } catch (error) {
      return ""
    }
  }
}
