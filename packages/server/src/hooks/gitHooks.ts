import fs from 'fs'

export async function fireWebhook(event: 'push' | 'tag', data: any) {
  let webhooks = {}
  try {
    webhooks = JSON.parse(fs.readFileSync('webhooks.json', 'utf-8'))
  } catch {
    // No webhooks.json or invalid JSON
    webhooks = {}
  }

  for (const url of webhooks[event] || []) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(console.error)
  }
}
