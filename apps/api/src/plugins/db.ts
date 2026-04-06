import { createClient, type Database } from "@gmdss-simulator/db";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

async function dbPlugin(fastify: FastifyInstance, opts: { databaseUrl: string }) {
  const { db, sql } = createClient(opts.databaseUrl);

  fastify.decorate("db", db);

  fastify.addHook("onClose", async () => {
    await sql.end();
  });
}

export default fp(dbPlugin, { name: "db" });
