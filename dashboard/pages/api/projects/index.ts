import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/db';
import { registerWebhook } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session) return res.status(401).end();

  if (req.method === 'POST') {
    const { name, githubRepoUrl, branch, dockerfilePath } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        githubRepoUrl,
        branch: branch || 'main',
        dockerfilePath: dockerfilePath || './Dockerfile',
        userId: session.user.id,
      },
    });
    await registerWebhook(project, session.accessToken);
    return res.json(project);
  }

  if (req.method === 'GET') {
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
    });
    return res.json(projects);
  }

  res.status(405).end();
}
