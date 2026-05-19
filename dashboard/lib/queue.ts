import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

export const deployQueue = new Queue('brizo-deploy', { connection });
