CREATE TABLE "ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"insight" text,
	"origin" text,
	"created_at" timestamp DEFAULT now()
);
