import { drizzle } from 'drizzle-orm/node-postgres'
import { cached } from '@/lib/cached'
import { pool } from './client'
import * as schema from './schema'

export const db = cached('drizzle', () =>
  drizzle(pool, { schema, casing: 'snake_case' }),
)

export { schema }
