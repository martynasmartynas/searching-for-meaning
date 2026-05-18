import { drizzle } from 'drizzle-orm/node-postgres'
import { pool } from './client'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var __drizzle: ReturnType<typeof drizzle<typeof schema>> | undefined
}

export const db =
  globalThis.__drizzle ?? drizzle(pool, { schema, casing: 'snake_case' })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__drizzle = db
}

export { schema }
