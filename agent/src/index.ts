import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { deploy } from './deploy';

const connection = new IORedis(process.env.REDIS_URL!);

const worker = new Worker('brizo-deploy', async (job: Job) => {
  const { repoUrl, branch, commitSha } = job.data;
  await deploy({ repoUrl, branch, commitSha });
  return { success: true };
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
