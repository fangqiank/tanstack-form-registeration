CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TABLE "test_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"newsletter" boolean DEFAULT false NOT NULL,
	"notifications" boolean DEFAULT false NOT NULL,
	"privacy_public" boolean DEFAULT false NOT NULL,
	"marketing_emails" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"birth_date" text,
	"gender" "gender",
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "test_user_preferences" ADD CONSTRAINT "test_user_preferences_user_id_test_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."test_users"("id") ON DELETE cascade ON UPDATE no action;