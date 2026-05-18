import { sql } from 'drizzle-orm'
import {
  bigint,
  bigserial,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const agencies = pgTable('agencies', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const photographers = pgTable(
  'photographers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    agencyId: bigint('agency_id', { mode: 'number' }).references(() => agencies.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('photographers_agency_name_uq').on(t.agencyId, t.name).nullsNotDistinct(),
  ],
)

export const images = pgTable(
  'images',
  {
    bildnummer: text('bildnummer').primaryKey(),
    suchtext: text('suchtext').notNull(),
    photographerId: bigint('photographer_id', { mode: 'number' })
      .notNull()
      .references(() => photographers.id),
    datum: date('datum', { mode: 'date' }).notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    allowedTerritories: text('allowed_territories').array(),
    deniedTerritories: text('denied_territories').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index('images_datum_idx').on(t.datum),
    index('images_photographer_idx').on(t.photographerId),
  ],
)

export type Agency = typeof agencies.$inferSelect
export type NewAgency = typeof agencies.$inferInsert
export type Photographer = typeof photographers.$inferSelect
export type NewPhotographer = typeof photographers.$inferInsert
export type Image = typeof images.$inferSelect
export type NewImage = typeof images.$inferInsert
