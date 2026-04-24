CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" varchar(255) NOT NULL,
	"transaction_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
