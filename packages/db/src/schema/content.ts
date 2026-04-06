import { integer, jsonb, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const modules = pgTable("modules", {
  id: varchar({ length: 50 }).primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  orderIndex: integer("order_index").notNull().unique(),
  prerequisiteModuleId: varchar("prerequisite_module_id", {
    length: 50,
  }).references((): any => modules.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: varchar({ length: 50 }).primaryKey(),
    moduleId: varchar("module_id", { length: 50 })
      .notNull()
      .references(() => modules.id),
    title: varchar({ length: 255 }).notNull(),
    orderIndex: integer("order_index").notNull(),
    contentPath: varchar("content_path", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("lessons_module_order").on(t.moduleId, t.orderIndex)],
);

export const quizzes = pgTable("quizzes", {
  id: varchar({ length: 50 }).primaryKey(),
  moduleId: varchar("module_id", { length: 50 })
    .notNull()
    .unique()
    .references(() => modules.id),
  title: varchar({ length: 255 }).notNull(),
  passThreshold: integer("pass_threshold").notNull().default(70),
  questions: jsonb().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
