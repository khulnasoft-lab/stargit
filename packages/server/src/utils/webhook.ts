import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export async function triggerWebhook(event: 'push' | 'tag', org: string, repo: string, payload: object) {
  const filePath = path.join(process.cwd(), 'data/webhooks.json');
  if (!fs.existsSync(filePath)) return;

  const webhooks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const targets = webhooks[`${org}/${repo}`]?.[event] || [];

  for (const url of targets) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`Webhook to ${url} failed:`, err);
    }
  }
}
