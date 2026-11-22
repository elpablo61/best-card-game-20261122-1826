// deck.js — the cards of Four Winds Duel: four original suits, one deck
// composition per side, and a small seeded random generator so screenshot
// mode can replay the exact same table every time.

export const SUITS = {
  ember: { key: 'ember', name: 'Ember', glyph: '▲', color: '#e2483d', dark: '#8f1d16', beats: 'bloom' },
  tide: { key: 'tide', name: 'Tide', glyph: '●', color: '#2f7fe0', dark: '#144a8a', beats: 'gale' },
  gale: { key: 'gale', name: 'Gale', glyph: '◆', color: '#17a398', dark: '#0a5c55', beats: 'ember' },
  bloom: { key: 'bloom', name: 'Bloom', glyph: '■', color: '#8e5bd6', dark: '#4c2a86', beats: 'tide' },
};

export const SUIT_ORDER = ['ember', 'tide', 'gale', 'bloom'];

// Six named cards per suit. Cost is paid in embers; power is the card's
// strength before elemental advantage and resonance are applied.
const CARD_NAMES = {
  ember: ['Cinder Imp', 'Spark Fox', 'Flame Herald', 'Bonfire Knight', 'Pyre Dragon', 'Ember Sovereign'],
  tide: ['Dew Sprite', 'Ripple Eel', 'Coral Guard', 'Tidecaller', 'Abyss Leviathan', 'Ocean Monarch'],
  gale: ['Breeze Wisp', 'Dust Hawk', 'Storm Rider', 'Cyclone Djinn', 'Tempest Roc', 'Sky Sovereign'],
  bloom: ['Seedling', 'Thorn Vine', 'Petal Blade', 'Grove Warden', 'Ancient Treant', 'Bloom Queen'],
};

const CARD_STATS = [
  { cost: 1, power: 2 },
  { cost: 1, power: 4 },
  { cost: 2, power: 5 },
  { cost: 2, power: 6 },
  { cost: 3, power: 8 },
  { cost: 3, power: 9 },
];

export function buildDeck(owner) {
  const deck = [];
  for (const suitKey of SUIT_ORDER) {
    const names = CARD_NAMES[suitKey];
    for (let i = 0; i < names.length; i += 1) {
      deck.push({
        id: `${owner}-${suitKey}-${i}`,
        owner,
        suit: suitKey,
        name: names[i],
        cost: CARD_STATS[i].cost,
        power: CARD_STATS[i].power,
      });
    }
  }
  return deck;
}

export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// mulberry32 — tiny deterministic generator for screenshot replays.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function suitOf(card) {
  return SUITS[card.suit];
}

export function suitGlyph(card) {
  return SUITS[card.suit].glyph;
}
