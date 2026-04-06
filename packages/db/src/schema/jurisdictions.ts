import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const jurisdictions = pgTable("jurisdictions", {
  id: varchar({ length: 50 }).primaryKey(),
  label: varchar({ length: 255 }).notNull(),
  channelPlan: jsonb("channel_plan").notNull(),
  callingChannel: integer("calling_channel").notNull().default(16),
  dscChannel: integer("dsc_channel").notNull().default(70),
  notes: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
