import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  company: text("company"),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score"), // percentage
  shuffleQuestions: boolean("shuffle_questions").default(false),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  type: text("type").notNull(), // "multipleChoice", "coding", "subjective", "patternRecognition"
  content: text("content").notNull(),
  codeSnippet: text("code_snippet"),
  options: jsonb("options"), // for multiple choice or pattern recognition
  answer: text("answer"), // for multiple choice or pattern recognition, stored as index
  testCases: jsonb("test_cases"), // for coding questions
  evaluationGuidelines: text("evaluation_guidelines"), // for subjective questions
  imageUrl: text("image_url"), // for pattern recognition questions
  points: integer("points").default(1),
  order: integer("order").default(0),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  testId: integer("test_id").notNull(),
  invitedBy: integer("invited_by").notNull(),
  testLink: text("test_link").notNull().unique(),
  status: text("status").default("pending"), // "pending", "in_progress", "completed"
  invitedAt: timestamp("invited_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  autoSubmitted: boolean("auto_submitted").default(false),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  questionId: integer("question_id").notNull(),
  response: text("response").notNull(),
  isCorrect: boolean("is_correct"),
  points: integer("points"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  company: true,
});

export const insertTestSchema = createInsertSchema(tests).pick({
  title: true,
  description: true,
  duration: true,
  passingScore: true,
  shuffleQuestions: true,
  createdBy: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  testId: true,
  type: true,
  content: true,
  codeSnippet: true,
  options: true,
  answer: true,
  testCases: true,
  evaluationGuidelines: true,
  imageUrl: true,
  points: true,
  order: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  name: true,
  email: true,
  testId: true,
  invitedBy: true,
  testLink: true,
  status: true,
  startedAt: true,
  completedAt: true,
  score: true,
  autoSubmitted: true,
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  candidateId: true,
  questionId: true,
  response: true,
  isCorrect: true,
  points: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;
