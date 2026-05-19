import { Pool } from 'pg'
import { cached } from '@/lib/cached'

export const pool = cached(
  'pgPool',
  () => new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }),
)
