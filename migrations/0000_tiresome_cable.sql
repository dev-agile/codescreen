CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"test_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"test_link" text NOT NULL,
	"status" text DEFAULT 'pending',
	"invited_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"score" integer,
	"auto_submitted" boolean DEFAULT false,
	CONSTRAINT "candidates_test_link_unique" UNIQUE("test_link")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"code_snippet" text,
	"options" jsonb,
	"answer" text,
	"test_cases" jsonb,
	"evaluation_guidelines" text,
	"image_url" text,
	"points" integer DEFAULT 1,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"response" text NOT NULL,
	"is_correct" boolean,
	"points" integer,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"passing_score" integer,
	"shuffle_questions" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"company" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
