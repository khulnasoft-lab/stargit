import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data/logs.json');

export function logEvent(eventType: string, repo: string, payload: any) {
  let logs: any[] = [];
  if (fs.existsSync(LOG_PATH)) {
    logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  }

  logs.unshift({
    event: eventType,
    repo,
    payload,
    timestamp: Date.now(),
  });

  fs.writeFileSync(LOG_PATH, JSON.stringify(logs.slice(0, 1000), null, 2)); // keep last 1000 events
}
