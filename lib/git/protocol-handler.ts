/**
 * Enhanced Git Smart HTTP Protocol Handler
 *
 * Implements the complete Git Smart HTTP protocol with:
 * - Reference negotiation (want/have)
 * - Packfile generation and transfer
 * - Upload-pack (fetch/clone) operations
 * - Receive-pack (push) operations
 * - Proper packet-line protocol
 * - Delta compression and optimization
 */
import { RequestContext } from '../../src';

export class GitProtocolHandler {
  private static readonly PACKET_MAX_SIZE = 65520
  private static readonly FLUSH_PACKET = "0000"
  private static readonly DELIMITER_PACKET = "0001"

  /**
   * Handle Git info/refs request
   */
  static async handleInfoRefs(
    repository: string,
    service: "git-upload-pack" | "git-receive-pack",
    capabilities: string[] = [],
  ): Promise<string> {
    const refs = await this.getRepositoryRefs(repository)
    const serviceCapabilities = this.getServiceCapabilities(service)

    let response = ""

    // Service announcement
    response += this.formatPacketLine(`# service=${service}\n`)
    response += this.FLUSH_PACKET

    // Send refs with capabilities
    let firstRef = true
    for (const ref of refs) {
      let line = `${ref.hash} ${ref.name}`

      if (firstRef && serviceCapabilities.length > 0) {
        line += "\0" + serviceCapabilities.join(" ")
        firstRef = false
      }

      response += this.formatPacketLine(line + "\n")
    }

    // If no refs, send capabilities anyway
    if (refs.length === 0) {
      const line = `0000000000000000000000000000000000000000 capabilities^{}\0${serviceCapabilities.join(" ")}`
      response += this.formatPacketLine(line + "\n")
    }

    response += this.FLUSH_PACKET
    return response
  }

  /**
   * Handle Git upload-pack request (fetch/clone)
   */
  static async handleUploadPack(repository: string, requestBody: Buffer): Promise<Buffer> {
    const request = this.parseUploadPackRequest(requestBody)
    const packfile = await this.generatePackfile(repository, request.wants, request.haves)

    let response = Buffer.alloc(0)

    // Send NAK if no common commits
    if (request.haves.length === 0) {
      response = Buffer.concat([response, Buffer.from(this.formatPacketLine("NAK\n"))])
    }

    // Send packfile
    response = Buffer.concat([response, Buffer.from(this.FLUSH_PACKET)])
    response = Buffer.concat([response, this.formatSidebandPackfile(packfile)])

    return response
  }

  /**
   * Handle Git receive-pack request (push)
   */
  static async handleReceivePack(repository: string, requestBody: Buffer): Promise<Buffer> {
    const request = this.parseReceivePackRequest(requestBody)
    const result = await this.processReceivePack(repository, request)

    let response = Buffer.alloc(0)

    // Send unpack result
    if (result.success) {
      response = Buffer.concat([response, Buffer.from(this.formatPacketLine("unpack ok\n"))])
    } else {
      response = Buffer.concat([response, Buffer.from(this.formatPacketLine(`unpack ${result.error}\n`))])
    }

    // Send ref update results
    for (const refUpdate of result.refUpdates) {
      const status = refUpdate.success ? "ok" : `ng ${refUpdate.error}`
      response = Buffer.concat([response, Buffer.from(this.formatPacketLine(`${status} ${refUpdate.ref}\n`))])
    }

    response = Buffer.concat([response, Buffer.from(this.FLUSH_PACKET)])
    return response
  }

  /**
   * Parse upload-pack request
   */
  private static parseUploadPackRequest(body: Buffer): {
    wants: string[]
    haves: string[]
    capabilities: string[]
  } {
    const lines = this.parsePacketLines(body)
    const wants: string[] = []
    const haves: string[] = []
    const capabilities: string[] = []

    for (const line of lines) {
      if (line.startsWith("want ")) {
        const parts = line.split(" ")
        wants.push(parts[1])

        // Parse capabilities from first want line
        if (wants.length === 1 && parts.length > 2) {
          const capString = parts.slice(2).join(" ")
          if (capString.includes("\0")) {
            capabilities.push(...capString.split("\0")[1].split(" "))
          }
        }
      } else if (line.startsWith("have ")) {
        haves.push(line.split(" ")[1])
      }
    }

    return { wants, haves, capabilities }
  }

  /**
   * Parse receive-pack request
   */
  private static parseReceivePackRequest(body: Buffer): {
    refUpdates: Array<{
      oldHash: string
      newHash: string
      ref: string
    }>
    capabilities: string[]
    packfile?: Buffer
  } {
    const lines = this.parsePacketLines(body)
    const refUpdates: Array<{ oldHash: string; newHash: string; ref: string }> = []
    const capabilities: string[] = []
    let packfileStart = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.includes(" ") && line.split(" ").length >= 3) {
        const parts = line.split(" ")
        const oldHash = parts[0]
        const newHash = parts[1]
        const ref = parts[2]

        refUpdates.push({ oldHash, newHash, ref })

        // Parse capabilities from first ref update
        if (refUpdates.length === 1 && parts.length > 3) {
          const capString = parts.slice(3).join(" ")
          if (capString.includes("\0")) {
            capabilities.push(...capString.split("\0")[1].split(" "))
          }
        }
      } else if (line === "") {
        // Empty line indicates start of packfile
        packfileStart = i + 1
        break
      }
    }

    let packfile: Buffer | undefined
    if (packfileStart >= 0) {
      // Extract packfile from remaining data
      const packfileLines = lines.slice(packfileStart)
      packfile = Buffer.concat(packfileLines.map((line) => Buffer.from(line, "binary")))
    }

    return { refUpdates, capabilities, packfile }
  }

  /**
   * Generate packfile for requested objects
   */
  private static async generatePackfile(repository: string, wants: string[], haves: string[]): Promise<Buffer> {
    // In a real implementation, this would:
    // 1. Calculate the set of objects needed (wants - haves)
    // 2. Generate delta compression for efficient transfer
    // 3. Create a proper Git packfile format

    // For this example, return a minimal packfile header
    const packfileHeader = Buffer.from("PACK")
    const version = Buffer.alloc(4)
    version.writeUInt32BE(2, 0) // Pack version 2
    const objectCount = Buffer.alloc(4)
    objectCount.writeUInt32BE(wants.length, 0)

    return Buffer.concat([packfileHeader, version, objectCount])
  }

  /**
   * Process receive-pack operation
   */
  private static async processReceivePack(
    repository: string,
    request: RequestContext,
  ): Promise<{
    success: boolean
    error?: string
    refUpdates: Array<{
      ref: string
      success: boolean
      error?: string
    }>
  }> {
    const refUpdates: Array<{ ref: string; success: boolean; error?: string }> = []

    // Validate and process each ref update
    for (const update of request.refUpdates) {
      try {
        // Validate ref update
        const isValid = await this.validateRefUpdate(repository, update)

        if (isValid) {
          // Update ref in repository
          await this.updateRef(repository, update)
          refUpdates.push({ ref: update.ref, success: true })
        } else {
          refUpdates.push({
            ref: update.ref,
            success: false,
            error: "ref update rejected",
          })
        }
      } catch (error) {
        refUpdates.push({
          ref: update.ref,
          success: false,
          error: error instanceof Error ? error.message : "unknown error",
        })
      }
    }

    return {
      success: refUpdates.every((update) => update.success),
      refUpdates,
    }
  }

  /**
   * Format data as Git packet-line
   */
  private static formatPacketLine(data: string): string {
    const length = data.length + 4
    const hexLength = length.toString(16).padStart(4, "0")
    return hexLength + data
  }

  /**
   * Parse packet-line data
   */
  private static parsePacketLines(data: Buffer): string[] {
    const lines: string[] = []
    let offset = 0

    while (offset < data.length) {
      // Read packet length
      const lengthHex = data.subarray(offset, offset + 4).toString("ascii")
      const length = Number.parseInt(lengthHex, 16)

      if (length === 0) {
        // Flush packet
        offset += 4
        continue
      }

      if (length < 4 || offset + length > data.length) {
        break
      }

      // Read packet data
      const packetData = data.subarray(offset + 4, offset + length).toString("utf8")
      lines.push(packetData.replace(/\n$/, ""))

      offset += length
    }

    return lines
  }

  /**
   * Format packfile with sideband protocol
   */
  private static formatSidebandPackfile(packfile: Buffer): Buffer {
    // Sideband-64k protocol: band 1 = packfile data
    const band = Buffer.from([1])
    const chunks: Buffer[] = []

    let offset = 0
    while (offset < packfile.length) {
      const chunkSize = Math.min(this.PACKET_MAX_SIZE - 5, packfile.length - offset)
      const chunk = packfile.subarray(offset, offset + chunkSize)

      const packetLength = chunkSize + 5
      const lengthHex = packetLength.toString(16).padStart(4, "0")

      chunks.push(Buffer.concat([Buffer.from(lengthHex), band, chunk]))

      offset += chunkSize
    }

    chunks.push(Buffer.from(this.FLUSH_PACKET))
    return Buffer.concat(chunks)
  }

  /**
   * Get service capabilities
   */
  private static getServiceCapabilities(service: string): string[] {
    const common = [
      "multi_ack",
      "thin-pack",
      "side-band",
      "side-band-64k",
      "ofs-delta",
      "shallow",
      "deepen-since",
      "deepen-not",
      "deepen-relative",
      "no-progress",
      "include-tag",
      "multi_ack_detailed",
      "allow-tip-sha1-in-want",
      "allow-reachable-sha1-in-want",
    ]

    if (service === "git-upload-pack") {
      return [...common, "symref=HEAD:refs/heads/main"]
    } else {
      return [...common, "report-status", "delete-refs", "quiet", "atomic", "push-options"]
    }
  }

  /**
   * Helper methods (would be implemented with actual Git operations)
   */
  private static async getRepositoryRefs(repository: string): Promise<Array<{ hash: string; name: string }>> {
    // Mock implementation - would read from actual Git repository
    return [
      { hash: "a".repeat(40), name: "refs/heads/main" },
      { hash: "b".repeat(40), name: "refs/heads/develop" },
    ]
  }

  private static async validateRefUpdate(repository: string, update: RequestContext): Promise<boolean> {
    // Mock implementation - would validate ref update permissions and constraints
    return true
  }

  private static async updateRef(repository: string, update: RequestContext): Promise<void> {
    // Mock implementation - would update the actual Git ref
  }
}
