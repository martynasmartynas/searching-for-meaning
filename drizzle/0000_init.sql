CREATE TABLE "images" (
	"bildnummer" text PRIMARY KEY NOT NULL,
	"suchtext" text NOT NULL,
	"photographer_id" bigint NOT NULL,
	"datum" date NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"allowed_territories" text[],
	"denied_territories" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photographers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photographers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_photographer_id_photographers_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_datum_idx" ON "images" USING btree ("datum");--> statement-breakpoint
CREATE INDEX "images_photographer_idx" ON "images" USING btree ("photographer_id");