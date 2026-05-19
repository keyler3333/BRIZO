import fs from 'fs-extra';
import { exec } from 'child_process';

const NGINX_CONF = '/etc/nginx/sites-enabled';

export async function updateNginx(subdomain: string, port: string) {
  const config = `
server {
    listen 80;
    server_name ${subdomain};
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
  const confPath = `${NGINX_CONF}/${subdomain}.conf`;
  await fs.writeFile(confPath, config.trim());
  exec('nginx -s reload');
}
