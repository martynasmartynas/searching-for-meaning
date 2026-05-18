// Curated starter dataset. The first two entries are the canonical examples
// from the task brief; the rest are extensions in the same IMAGO-style shape.
// Hand-written (not faker output) so search-quality tests have stable, realistic
// captions to query against.

import type { FakeRawImage } from './generateImage'

export const STARTER_DATASET: FakeRawImage[] = [
  {
    suchtext:
      'J.Morris, Manchester Utd inside right 7th January 1948 UnitedArchives00421716 PUBLICATIONxINxGERxSUIxAUTxONLY',
    bildnummer: '0059987730',
    fotografen: 'IMAGO / United Archives International',
    datum: '01.01.1900',
    hoehe: '2460',
    breite: '3643',
  },
  {
    suchtext:
      'Michael Jackson 11 95 her Mann Musik Gesang Pop USA Hemd leger Studio hoch ganz stehend Bühne',
    bildnummer: '0056821849',
    fotografen: 'IMAGO / teutopress',
    datum: '01.11.1995',
    hoehe: '948',
    breite: '1440',
  },
  // --- Extensions ---
  {
    suchtext:
      'Steffi Graf Wimbledon 1988 her Frau Tennis Sport Sieg Pokal Match Centre Court',
    bildnummer: '0061203487',
    fotografen: 'IMAGO / Sven Simon',
    datum: '03.07.1988',
    hoehe: '1800',
    breite: '2700',
  },
  {
    suchtext:
      'Boris Becker Australian Open 1991 her Mann Tennis Sport Aufschlag Match Melbourne PUBLICATIONxNOTxINxUSA',
    bildnummer: '0062118293',
    fotografen: 'IMAGO / Werek',
    datum: '20.01.1991',
    hoehe: '2100',
    breite: '1400',
  },
  {
    suchtext:
      'Helmut Kohl Bundeskanzler Pressekonferenz Bonn 1990 Wiedervereinigung Politik Deutschland PUBLICATIONxINxGERxONLY',
    bildnummer: '0070445129',
    fotografen: 'IMAGO / Sven Simon',
    datum: '03.10.1990',
    hoehe: '1600',
    breite: '2400',
  },
  {
    suchtext:
      'Konrad Adenauer 1962 Bundestag Rede Politik Deutschland her Mann Anzug stehend',
    bildnummer: '0034501872',
    fotografen: 'IMAGO / United Archives International',
    datum: '15.06.1962',
    hoehe: '2200',
    breite: '1600',
  },
  {
    suchtext:
      'Marlene Dietrich Berlin 1930 her Frau Schauspielerin Studio Portrait Hollywood',
    bildnummer: '0012849301',
    fotografen: 'IMAGO / United Archives International',
    datum: '01.01.1900',
    hoehe: '2800',
    breite: '2100',
  },
  {
    suchtext:
      'Albert Einstein Princeton 1947 her Mann Physik Wissenschaft Portrait Studio',
    bildnummer: '0022114089',
    fotografen: 'IMAGO / United Archives International',
    datum: '01.01.1947',
    hoehe: '2400',
    breite: '1900',
  },
  {
    suchtext:
      'FC Bayern München Meisterschaft 1972 Mannschaft Pokal Jubel Bundesliga Spiel Stadion',
    bildnummer: '0045887621',
    fotografen: 'IMAGO / Werek',
    datum: '24.06.1972',
    hoehe: '1500',
    breite: '2300',
  },
  {
    suchtext:
      'Franz Beckenbauer DFB 1974 her Mann Fußball WM Weltmeisterschaft Trikot Mannschaft',
    bildnummer: '0048220177',
    fotografen: 'IMAGO / Horstmüller',
    datum: '07.07.1974',
    hoehe: '2000',
    breite: '1500',
  },
  {
    suchtext:
      'Diego Maradona Argentinien 1986 her Mann Fußball WM Mexico Tor Jubel',
    bildnummer: '0058992341',
    fotografen: 'IMAGO / Werek',
    datum: '22.06.1986',
    hoehe: '1800',
    breite: '2400',
  },
  {
    suchtext:
      'Angela Merkel Bundeskanzlerin EU-Gipfel Brüssel 2015 Pressekonferenz Politik PUBLICATIONxINxGERxSUIxAUTxONLY',
    bildnummer: '0089331204',
    fotografen: 'IMAGO / Future Image',
    datum: '18.06.2015',
    hoehe: '1700',
    breite: '2550',
  },
  {
    suchtext:
      'Borussia Dortmund Westfalenstadion 2012 Mannschaft Fans Choreo Bundesliga Spiel',
    bildnummer: '0091148822',
    fotografen: 'IMAGO / Sven Simon',
    datum: '05.05.2012',
    hoehe: '1900',
    breite: '2850',
  },
  {
    suchtext:
      'Konzert Bühne Live Auftritt 2018 Musik Pop Rock Lichtshow Publikum NOxSALExINxJPN',
    bildnummer: '0095661478',
    fotografen: 'IMAGO / Future Image',
    datum: '14.09.2018',
    hoehe: '2000',
    breite: '3000',
  },
  {
    suchtext:
      'Pelé Brasilien 1970 her Mann Fußball WM Mexico Jubel Tor Weltmeister',
    bildnummer: '0040659194',
    fotografen: 'IMAGO / Horstmüller',
    datum: '21.06.1970',
    hoehe: '2564',
    breite: '2916',
  },
]
