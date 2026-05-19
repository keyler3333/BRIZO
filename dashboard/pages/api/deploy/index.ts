import type { NextApiRequest, NextApiResponse } from 'next';
import { deployQueue } from '@/lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { repoUrl, branch, commitSha } = req.body;
  await deployQueue.add('deploy', { repoUrl, branch, commitSha });
  res.status(200).json({ success: true });
}
