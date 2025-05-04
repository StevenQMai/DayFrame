import { pgTable, text, serial, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const TASK_COLORS = [
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#10B981", // green
  "#EF4444", // red
  "#9CA3AF", // gray
] as const;

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: numeric("start_time").notNull(), // in hours (0-24)
  duration: numeric("duration").notNull(), // in hours
  color: text("color").notNull(),
  isTimerActive: text("is_timer_active"),
  timerStartedAt: text("timer_started_at"), // timestamp when timer was started
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  name: true,
  startTime: true,
  duration: true,
  color: true,
}).extend({
  startTime: z.number()
    .min(0, "Start time must be between 0 and 24 hours")
    .max(24, "Start time must be between 0 and 24 hours"),
  duration: z.number()
    .min(0.5, "Duration must be at least 30 minutes")
    .max(24, "Duration cannot exceed 24 hours")
    .multipleOf(0.5, "Duration must be in increments of 30 minutes"),
  color: z.string().refine(color => TASK_COLORS.includes(color as any), {
    message: "Invalid color selection"
  })
});

export type InsertTask = z.infer<typeof insertTaskSchema>;

// Define the Task type with appropriate runtime types
// DB returns strings for numeric fields, but we want to use numbers in the application
export type Task = {
  id: number;
  name: string;
  startTime: number;
  duration: number;
  color: string;
  isTimerActive?: boolean;
  timerStartedAt?: number; // timestamp when timer was started
};
