/**
 * REST routes for simulator attempt records.
 */

import { eq, desc } from "drizzle-orm";
import { simulatorAttempts } from "@gmdss-simulator/db";
import type { FastifyInstance } from "fastify";

export default async function attemptRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  /** List the authenticated user's simulator attempts (most recent first). */
  fastify.get("/", async (request, reply) => {
    const userId = request.user.id;

    const attempts = await fastify.db
      .select({
        id: simulatorAttempts.id,
        scenarioId: simulatorAttempts.scenarioId,
        overallScore: simulatorAttempts.overallScore,
        startedAt: simulatorAttempts.startedAt,
        endedAt: simulatorAttempts.endedAt,
      })
      .from(simulatorAttempts)
      .where(eq(simulatorAttempts.userId, userId))
      .orderBy(desc(simulatorAttempts.startedAt))
      .limit(50);

    return reply.send(attempts);
  });

  /** Get a single attempt with full detail. */
  fastify.get("/:id", async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    const [attempt] = await fastify.db
      .select()
      .from(simulatorAttempts)
      .where(eq(simulatorAttempts.id, id))
      .limit(1);

    if (!attempt || attempt.userId !== userId) {
      return reply.code(404).send({ error: "Attempt not found" });
    }

    return reply.send(attempt);
  });
}
