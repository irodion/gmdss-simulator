import { eq, asc } from "drizzle-orm";
import { jurisdictions, lessons, lessonProgress, modules, quizzes } from "@gmdss-simulator/db";
import type { FastifyInstance } from "fastify";

import { getUnlockedModuleIds } from "../../lib/module-unlock.ts";

export default async function contentRoutes(fastify: FastifyInstance) {
  fastify.get("/modules", { onRequest: fastify.authenticate }, async (request, reply) => {
    const allModules = await fastify.db.select().from(modules).orderBy(asc(modules.orderIndex));
    const unlocked = await getUnlockedModuleIds(fastify.db, request.user.id, allModules);

    return reply.send(
      allModules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        locked: !unlocked.has(mod.id),
      })),
    );
  });

  fastify.get(
    "/modules/:id/lessons",
    { onRequest: fastify.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const moduleLessons = await fastify.db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, id))
        .orderBy(asc(lessons.orderIndex));

      if (moduleLessons.length === 0) {
        return reply.code(404).send({ error: "Module not found" });
      }

      const completed = await fastify.db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, request.user.id));

      const completedIds = new Set(completed.map((c) => c.lessonId));

      return reply.send(
        moduleLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          contentPath: lesson.contentPath,
          completed: completedIds.has(lesson.id),
        })),
      );
    },
  );

  fastify.get("/modules/:id/quiz", { onRequest: fastify.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [quiz] = await fastify.db.select().from(quizzes).where(eq(quizzes.moduleId, id)).limit(1);

    if (!quiz) {
      return reply.code(404).send({ error: "Quiz not found" });
    }

    const questions = (quiz.questions as any[]).map(({ correct_answer: _, ...rest }) => rest);

    return reply.send({
      id: quiz.id,
      title: quiz.title,
      passThreshold: quiz.passThreshold,
      questions,
    });
  });

  fastify.get("/jurisdictions", async (_request, reply) => {
    const all = await fastify.db
      .select({
        id: jurisdictions.id,
        label: jurisdictions.label,
        callingChannel: jurisdictions.callingChannel,
        dscChannel: jurisdictions.dscChannel,
      })
      .from(jurisdictions);

    return reply.send(all);
  });

  fastify.get("/jurisdictions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [jurisdiction] = await fastify.db
      .select()
      .from(jurisdictions)
      .where(eq(jurisdictions.id, id))
      .limit(1);

    if (!jurisdiction) {
      return reply.code(404).send({ error: "Jurisdiction not found" });
    }

    return reply.send(jurisdiction);
  });

  fastify.get("/scenarios", { onRequest: fastify.authenticate }, async (_request, reply) => {
    return reply.send([]);
  });

  fastify.get("/scenarios/:id", { onRequest: fastify.authenticate }, async (_request, reply) => {
    return reply.code(404).send({ error: "Scenarios not available in Phase 1" });
  });
}
