import docker from './docker';
import { v4 as uuidv4 } from 'uuid';

export async function createRedisInstance(plan: 'basic' | 'cluster') {
  const password = uuidv4().slice(0, 12);
  const name = `regis-${uuidv4().slice(0, 8)}`;

  if (plan === 'basic') {
    const container = await docker.createContainer({
      Image: 'redis:7-alpine',
      name,
      Env: [`REDIS_PASSWORD=${password}`],
      HostConfig: {
        PortBindings: { '6379/tcp': [{ HostPort: '0' }] },
        RestartPolicy: { Name: 'always' },
      },
    });
    await container.start();
    const info = await container.inspect();
    const hostPort = info.NetworkSettings.Ports['6379/tcp'][0].HostPort;
    return { name, host: 'localhost', port: hostPort, password };
  }

  if (plan === 'cluster') {
    const containers = [];
    for (let i = 0; i < 6; i++) {
      const container = await docker.createContainer({
        Image: 'redis:7-alpine',
        name: `${name}-node-${i}`,
        Cmd: ['redis-server', '--cluster-enabled', 'yes', '--cluster-config-file', 'nodes.conf', '--requirepass', password],
        HostConfig: { PortBindings: { '6379/tcp': [{ HostPort: '0' }] } },
      });
      await container.start();
      containers.push(container);
    }
    const ips: string[] = [];
    for (const container of containers) {
      const info = await container.inspect();
      ips.push(info.NetworkSettings.IPAddress);
    }
    const exec = require('child_process').execSync;
    const joinCmd = `redis-cli --cluster create ${ips.map(ip => `${ip}:6379`).join(' ')} --cluster-replicas 1 -a ${password}`;
    exec(joinCmd);
    return { name, hosts: ips, port: 6379, password };
  }

  throw new Error('Invalid plan');
}
