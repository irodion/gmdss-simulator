import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(fastify: FastifyInstance, opts: { redisUrl: string }) {
  const redis = new Redis(opts.redisUrl, {
    maxRetriesPerRequest: 3,
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
}

export default fp(redisPlugin, { name: "redis" });
