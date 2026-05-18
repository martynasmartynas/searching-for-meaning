import { faker } from '@faker-js/faker/locale/de'

const PHOTOGRAPHERS = [
  'IMAGO / United Archives International',
  'IMAGO / teutopress',
  'IMAGO / Sven Simon',
  'IMAGO / Horstmüller',
  'IMAGO / Werek',
  'IMAGO / Pressefoto Baumann',
  'IMAGO / Hans Rauchensteiner',
  'IMAGO / Future Image',
]

const SUBJECTS = [
  'Michael Jackson', 'Helmut Kohl', 'Steffi Graf', 'Boris Becker',
  'Marlene Dietrich', 'Albert Einstein', 'Konrad Adenauer', 'Angela Merkel',
  'Franz Beckenbauer', 'Bayern München', 'FC Schalke 04', 'Borussia Dortmund',
  'Manchester Utd', 'J. Morris', 'Diego Maradona', 'Pelé',
]

const CONTEXTS = [
  'Studio', 'Bühne', 'Konzert', 'Spiel', 'Pressekonferenz',
  'Interview', 'Empfang', 'Training', 'Match', 'Auftritt',
  'Portrait', 'Empfang Berlin', 'Live-Auftritt',
]

const TERRITORY_TAGS = [
  'PUBLICATIONxINxGERxSUIxAUTxONLY',
  'PUBLICATIONxNOTxINxUSA',
  'PUBLICATIONxINxGERxONLY',
  'NOxSALExINxJPN',
  null, null, null, // weight toward no restriction
]

export type FakeRawImage = {
  bildnummer: string
  suchtext: string
  fotografen: string
  datum: string         // DD.MM.YYYY
  hoehe: string         // px
  breite: string        // px
}

export function generateImage(): FakeRawImage {
  const subject  = faker.helpers.arrayElement(SUBJECTS)
  const context  = faker.helpers.arrayElement(CONTEXTS)
  const year     = faker.number.int({ min: 1900, max: 2025 })
  const month    = String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0')
  const day      = String(faker.number.int({ min: 1, max: 28 })).padStart(2, '0')
  const territory = faker.helpers.arrayElement(TERRITORY_TAGS)
  const bildnummer = String(faker.number.int({ min: 1_000_000, max: 99_999_999 }))
    .padStart(10, '0')

  const captionParts = [
    subject,
    `${month} ${String(year).slice(-2)}`,
    faker.helpers.arrayElement(['her Mann', 'die Frau', 'eine Gruppe', 'das Team', '']),
    faker.lorem.words({ min: 3, max: 10 }),
    context,
    `UnitedArchives${bildnummer}`,
    territory,
  ].filter(Boolean).join(' ')

  return {
    bildnummer,
    suchtext: captionParts,
    fotografen: faker.helpers.arrayElement(PHOTOGRAPHERS),
    datum: `${day}.${month}.${year}`,
    hoehe: String(faker.number.int({ min: 600, max: 4000 })),
    breite: String(faker.number.int({ min: 800, max: 5000 })),
  }
}
