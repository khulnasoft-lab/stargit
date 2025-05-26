// Helper to extract pushed branch names from a git-receive-pack request
export async function extractPushedRefs(req: any): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of req.raw) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf-8');
  const refLines = body.split('\n').filter((line) => line.includes('refs/heads/'));
  const branchNames = refLines.map(line => {
    const match = line.match(/refs\/heads\/([^\0\s]+)/);
    return match?.[1] || null;
  }).filter(Boolean) as string[];
  return [...new Set(branchNames)]; // deduplicate
}
