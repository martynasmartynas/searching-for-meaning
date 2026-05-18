// Seed the database.
//
//   pnpm db:seed              → starter dataset only (15 hand-curated rows)
//   pnpm db:seed 100          → starter dataset + 100 random rows
//   pnpm db:seed --random 100 → 100 random rows, no starter

import { db } from '../lib/db/db'
import { images } from '../lib/db/schema'
import { generateImage } from '../lib/fake/generateImage'
import { STARTER_DATASET } from '../lib/fake/starterDataset'
import { ingestRawImages } from '../lib/ingest/ingestImages'

function parseArgs() {
  const args = process.argv.slice(2)
  const randomFlagIdx = args.indexOf('--random')
  const skipStarter = randomFlagIdx >= 0
  const countArg = skipStarter ? args[randomFlagIdx + 1] : args[0]
  const random = Math.min(Math.max(Number(countArg ?? 0), 0), 50_000)
  return { skipStarter, random }
}

async function main() {
  const { skipStarter, random } = parseArgs()

  const starterInserted = skipStarter ? 0 : await ingestRawImages(STARTER_DATASET)
  const randomInserted =
    random > 0 ? await ingestRawImages(Array.from({ length: random }, generateImage)) : 0

  const total = await db.$count(images)
  console.log(
    `starter: ${starterInserted}/${skipStarter ? 0 : STARTER_DATASET.length}, ` +
      `random: ${randomInserted}/${random}, total in DB: ${total}`,
  )
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
