-- Sequin replication prerequisites.
--   * publication `sequin_pub` — declares which tables Sequin can subscribe to
--   * logical slot `sequin_slot` — Postgres' bookmark into the WAL
--   * REPLICA IDENTITY FULL — makes UPDATE/DELETE events include the full row
--                             so Sequin's `changes` field is populated
--
-- Idempotent: safe to re-run after a fresh DB if these objects already exist.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'sequin_pub') THEN
    CREATE PUBLICATION sequin_pub FOR TABLE images, photographers, agencies;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'sequin_slot') THEN
    PERFORM pg_create_logical_replication_slot('sequin_slot', 'pgoutput');
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE public.images REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER TABLE public.photographers REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER TABLE public.agencies REPLICA IDENTITY FULL;
