import { Octokit } from '@octokit/core';

export async function registerWebhook(project: any, accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });
  const [owner, repo] = project.githubRepoUrl.replace('https://github.com/', '').split('/');
  await octokit.request('POST /repos/{owner}/{repo}/hooks', {
    owner,
    repo,
    config: {
      url: `https://brizo.app/api/webhooks/github`,
      content_type: 'json',
    },
    events: ['push'],
  });
}
