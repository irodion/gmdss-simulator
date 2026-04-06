import { and, eq } from "drizzle-orm";
import { quizzes, quizAttempts } from "@gmdss-simulator/db";
import type { Database } from "@gmdss-simulator/db";

/**
 * Check if a module is unlocked for a user by verifying they passed
 * the prerequisite module's quiz. Returns true if the module has no
 * prerequisite or the prerequisite quiz was passed.
 */
export async function isModuleUnlocked(
  db: Database,
  userId: string,
  prerequisiteModuleId: string | null,
): Promise<boolean> {
  if (!prerequisiteModuleId) return true;

  const prereqQuiz = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.moduleId, prerequisiteModuleId))
    .limit(1);

  if (prereqQuiz.length === 0) return false;

  const passed = await db
    .select({ id: quizAttempts.id })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, prereqQuiz[0]!.id),
        eq(quizAttempts.passed, true),
      ),
    )
    .limit(1);

  return passed.length > 0;
}

/**
 * Batch-check which modules are unlocked for a user.
 * Fetches all quizzes and passing attempts in two queries instead of N+1.
 */
export async function getUnlockedModuleIds(
  db: Database,
  userId: string,
  allModules: Array<{ id: string; prerequisiteModuleId: string | null }>,
): Promise<Set<string>> {
  const allQuizzes = await db.select({ id: quizzes.id, moduleId: quizzes.moduleId }).from(quizzes);

  const passedQuizIds = await db
    .select({ quizId: quizAttempts.quizId })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.passed, true)));

  const passedSet = new Set(passedQuizIds.map((p) => p.quizId));
  const quizByModule = new Map(allQuizzes.map((q) => [q.moduleId, q.id]));

  const unlocked = new Set<string>();
  for (const mod of allModules) {
    if (!mod.prerequisiteModuleId) {
      unlocked.add(mod.id);
      continue;
    }
    const prereqQuizId = quizByModule.get(mod.prerequisiteModuleId);
    if (prereqQuizId && passedSet.has(prereqQuizId)) {
      unlocked.add(mod.id);
    }
  }

  return unlocked;
}
