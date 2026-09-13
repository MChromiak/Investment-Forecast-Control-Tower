import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const controlTowerStateTable = pgTable("control_tower_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertControlTowerStateSchema = createInsertSchema(
  controlTowerStateTable,
).omit({ updatedAt: true });

export type InsertControlTowerState = z.infer<
  typeof insertControlTowerStateSchema
>;
export type ControlTowerStateRow =
  typeof controlTowerStateTable.$inferSelect;