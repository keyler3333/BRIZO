import simpleGit from 'simple-git';
import docker from './docker';
import path from 'path';
import { updateNginx } from './nginx';
import slugify from 'slugify';

export async function deploy({ repoUrl, branch, commitSha }: any) {
  const appName = slugify(repoUrl + '-' + branch, { lower: true });
  const workDir = path.join('/tmp/brizo-builds', appName + '-' + Date.now());

  await simpleGit().clone(repoUrl, workDir, ['--branch', branch, '--single-branch']);

  const imageName = `brizo-${appName}:${commitSha?.substring(0, 7) || 'latest'}`;

  const stream = await docker.buildImage(
    { context: workDir, src: ['Dockerfile', '.'] },
    { t: imageName }
  );
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });

  const containers = await docker.listContainers({ all: true, filters: { name: [appName] } });
  for (const c of containers) {
    const container = docker.getContainer(c.Id);
    await container.stop().catch(() => {});
    await container.remove();
  }

  const container = await docker.createContainer({
    Image: imageName,
    name: appName,
    ExposedPorts: { '80/tcp': {} },
    HostConfig: { PortBindings: { '80/tcp': [{ HostPort: '0' }] } },
  });
  await container.start();

  const info = await container.inspect();
  const hostPort = info.NetworkSettings.Ports['80/tcp'][0].HostPort;

  const subdomain = `${appName}.brizo.app`;
  await updateNginx(subdomain, hostPort);
}
