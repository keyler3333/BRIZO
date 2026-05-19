import type { NextApiRequest, NextApiResponse } from 'next';
import { deployQueue } from '@/lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const event = req.headers['x-github-event'];
  if (event === 'push') {
    const payload = req.body;
    const repoUrl = payload.repository.clone_url;
    const branch = payload.ref.replace('refs/heads/', '');
    await deployQueue.add('deploy', {
      repoUrl,
      branch,
      commitSha: payload.after,
    });
  }
  res.status(200).end();
}
