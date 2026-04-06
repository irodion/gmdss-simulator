import { eq, asc, sql } from "drizzle-orm";
import { lessons, lessonProgress, modules, quizzes, quizAttempts } from "@gmdss-simulator/db";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { isModuleUnlocked } from "../../lib/module-unlock.ts";

const quizSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selected: z.string(),
    }),
  ),
});

export default async function progressRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/", async (request, reply) => {
    const userId = request.user.id;

    const allModules = await fastify.db.select().from(modules).orderBy(asc(modules.orderIndex));
    const allLessons = await fastify.db.select().from(lessons);
    const allQuizzes = await fastify.db
      .select({ id: quizzes.id, moduleId: quizzes.moduleId })
      .from(quizzes);

    const completedLessons = await fastify.db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
    const completedSet = new Set(completedLessons.map((l) => l.lessonId));

    const bestQuizScores = await fastify.db
      .select({
        quizId: quizAttempts.quizId,
        bestScore: sql<number>`MAX(${quizAttempts.score})`,
        passed: sql<boolean>`BOOL_OR(${quizAttempts.passed})`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .groupBy(quizAttempts.quizId);

    const quizScoreMap = new Map(bestQuizScores.map((q) => [q.quizId, q]));
    const quizByModule = new Map(allQuizzes.map((q) => [q.moduleId, q.id]));

    const moduleProgress: Record<
      string,
      {
        lessonsCompleted: number;
        lessonsTotal: number;
        quizBestScore: number | null;
        quizPassed: boolean;
        status: "locked" | "in_progress" | "completed";
      }
    > = {};

    for (const mod of allModules) {
      const modLessons = allLessons.filter((l) => l.moduleId === mod.id);
      const lessonsCompleted = modLessons.filter((l) => completedSet.has(l.id)).length;
      const modQuizId = quizByModule.get(mod.id);
      const quizScore = modQuizId ? quizScoreMap.get(modQuizId) : undefined;

      let locked = false;
      if (mod.prerequisiteModuleId) {
        const prereqQuizId = quizByModule.get(mod.prerequisiteModuleId);
        locked = prereqQuizId ? !quizScoreMap.get(prereqQuizId)?.passed : false;
      }

      const quizPassed = quizScore?.passed ?? false;
      let status: "locked" | "in_progress" | "completed";
      if (locked) {
        status = "locked";
      } else if (quizPassed && lessonsCompleted === modLessons.length) {
        status = "completed";
      } else {
        status = "in_progress";
      }

      moduleProgress[mod.id] = {
        lessonsCompleted,
        lessonsTotal: modLessons.length,
        quizBestScore: quizScore ? Number(quizScore.bestScore) : null,
        quizPassed,
        status,
      };
    }

    return reply.send({ modules: moduleProgress });
  });

  fastify.post("/lesson/:id/complete", async (request, reply) => {
    const userId = request.user.id;
    const { id: lessonId } = request.params as { id: string };

    const [lesson] = await fastify.db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) {
      return reply.code(404).send({ error: "Lesson not found" });
    }

    const [mod] = await fastify.db
      .select()
      .from(modules)
      .where(eq(modules.id, lesson.moduleId))
      .limit(1);

    if (!(await isModuleUnlocked(fastify.db, userId, mod?.prerequisiteModuleId ?? null))) {
      return reply.code(403).send({ error: "Module is locked" });
    }

    await fastify.db.insert(lessonProgress).values({ userId, lessonId }).onConflictDoNothing();

    return reply.send({ success: true });
  });

  fastify.post("/quiz/:id/submit", async (request, reply) => {
    const userId = request.user.id;
    const { id: quizId } = request.params as { id: string };

    const parsed = quizSubmitSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Validation failed" });
    }

    const [quiz] = await fastify.db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);

    if (!quiz) {
      return reply.code(404).send({ error: "Quiz not found" });
    }

    const [mod] = await fastify.db
      .select()
      .from(modules)
      .where(eq(modules.id, quiz.moduleId))
      .limit(1);

    if (!(await isModuleUnlocked(fastify.db, userId, mod?.prerequisiteModuleId ?? null))) {
      return reply.code(403).send({ error: "Module is locked" });
    }

    const questions = quiz.questions as Array<{
      id: string;
      correct_answer: string;
      explanation: string;
    }>;
    const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a.selected]));

    const results = questions.map((q) => {
      const selected = answerMap.get(q.id);
      const correct = selected === q.correct_answer;
      return {
        questionId: q.id,
        correct,
        ...(correct ? {} : { correctAnswer: q.correct_answer, explanation: q.explanation }),
      };
    });

    const correctCount = results.filter((r) => r.correct).length;
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const passed = score >= quiz.passThreshold;

    await fastify.db.insert(quizAttempts).values({
      userId,
      quizId,
      score,
      passed,
      answers: parsed.data.answers,
      results,
    });

    const unlocked: string[] = [];
    if (passed) {
      const nextModules = await fastify.db
        .select({ id: modules.id })
        .from(modules)
        .where(eq(modules.prerequisiteModuleId, quiz.moduleId));

      for (const next of nextModules) {
        unlocked.push(next.id);
      }
    }

    return reply.send({ score, passed, threshold: quiz.passThreshold, results, unlocked });
  });

  fastify.get("/attempts", async (_request, reply) => {
    return reply.send([]);
  });

  fastify.get("/attempts/:id", async (_request, reply) => {
    return reply.code(404).send({ error: "No simulator attempts in Phase 1" });
  });
}
