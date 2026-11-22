// ai.js — Kite the Trickster, the rival. The rival reads the table: it
// remembers which suit won the last round, favours cards that beat the
// player's most-played suit, spends cheaply when it is already ahead, and
// sometimes bluffs with a weak card to save a strong one for later.

import { effectivePower, hasAdvantage } from './rules.js';

export const RIVAL_NAME = 'Kite the Trickster';

export function chooseRivalCard(state, rng) {
  const hand = state.rivalHand;
  const affordable = hand.filter((c) => c.cost <= state.rivalEnergy);
  const pool = affordable.length > 0 ? affordable : hand.slice();
  if (pool.length === 0) return null;

  const playerSuits = {};
  for (const c of state.playerPlayed) playerSuits[c.suit] = (playerSuits[c.suit] || 0) + 1;
  const favourite = Object.keys(playerSuits).sort((a, b) => playerSuits[b] - playerSuits[a])[0];

  let best = null;
  let bestScore = -Infinity;
  for (const card of pool) {
    let score = card.power - card.cost * 1.2;
    if (favourite && hasAdvantage(card.suit, favourite)) score += 4;
    if (state.winningSuit && card.suit === state.winningSuit) score += 2;
    if (state.rivalLife < state.playerLife) score += card.power * 0.4;
    if (state.rivalLife > state.playerLife + 6 && card.cost >= 3) score -= 3;
    score += rng() * 2.5;
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  // One bluff in five: play the weakest affordable card and keep the strong ones.
  if (rng() < 0.2) {
    const weak = pool.slice().sort((a, b) => a.power - b.power)[0];
    if (weak.power <= 5) return weak;
  }
  return best;
}

// A one-line "tell" the rival gives away before the reveal, so the player
// can read the opponent and counter it.
export function rivalTell(state, rng) {
  const tells = [
    'Kite taps the table, eyes on your Ember cards…',
    'Kite hums a low tune and fans the hand wide.',
    'Kite grins — something strong is coming.',
    'Kite hesitates, then slides a card forward.',
    'Kite watches your last suit and nods slowly.',
  ];
  return tells[Math.floor(rng() * tells.length)];
}

// Estimate the rival's card from the player's point of view, used by the
// hint line under the arena.
export function hintFor(playerCard, rivalCard) {
  if (!playerCard || !rivalCard) return '';
  const mine = effectivePower(playerCard, rivalCard, null);
  const theirs = effectivePower(rivalCard, playerCard, null);
  if (mine > theirs) return 'Your card holds the wind — advantage yours.';
  if (mine < theirs) return 'Their card rides the wind — brace for it.';
  return 'Evenly matched — the wind decides.';
}
