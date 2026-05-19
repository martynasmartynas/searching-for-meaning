// One-shot script that creates the `images` index and applies all settings.
// Idempotent — safe to re-run any time (e.g. after changing settings here).
//
//   pnpm meili:setup

import { meili } from '../lib/search/meili-client'

const INDEX = 'images'

async function main() {
  const existing = await meili.getIndexes()
  const found = existing.results.find((i) => i.uid === INDEX)

  if (!found) {
    const task = await meili.createIndex(INDEX, { primaryKey: 'bildnummer' })
    await meili.tasks.waitForTask(task.taskUid)
    console.log(`created index "${INDEX}"`)
  } else {
    console.log(`index "${INDEX}" already exists`)
  }

  const index = meili.index(INDEX)

  const settingsTask = await index.updateSettings({
    searchableAttributes: ['suchtext', 'fotografen', 'bildnummer'],

    filterableAttributes: [
      'fotografen',
      'agency',
      'orientation',
      'datum_ts',
      'width',
      'height',
      'allowed_territories',
      'denied_territories',
    ],

    sortableAttributes: ['datum_ts'],

    displayedAttributes: [
      'bildnummer',
      'suchtext',
      'fotografen',
      'agency',
      'datum_ts',
      'width',
      'height',
      'orientation',
      'allowed_territories',
      'denied_territories',
    ],

    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],

    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
      disableOnAttributes: ['bildnummer'],
    },

    // We previously forced German locale here, but Charabia's `deu` mode
    // over-segments Latin words (e.g. "Berlin" → "Be", "rl", "in") which
    // makes highlights and matches look broken. Auto-detect handles our
    // mixed German+English captions fine.
    localizedAttributes: null,

    // Keep abbreviations and multi-word names from being split by the tokenizer.
    dictionary: ['F.C.', 'St.', 'United Archives'],

    // Small set of obvious German ↔ international variants to demonstrate the hook.
    synonyms: {
      fußball: ['fussball', 'football', 'soccer'],
      münchen: ['munich', 'muenchen'],
      köln: ['cologne', 'koeln'],
    },
  })

  await meili.tasks.waitForTask(settingsTask.taskUid)
  console.log(`settings applied for "${INDEX}"`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
