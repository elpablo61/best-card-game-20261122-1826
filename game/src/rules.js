// rules.js — the combat rules of Four Winds Duel, pure functions with no
// DOM in them so the same code drives live play and screenshot replays.
//
// A round: each side plays one card. Effective power = base power + 3 when
// the card's suit beats the enemy card's suit (the wind cycle
// Ember > Bloom > Tide > Gale > Ember) + 2 resonance when the card's suit
// matches the suit that won the previous round. The higher effective power
// wins the round and the loser loses life equal to the difference. A tie
// costs both sides 1 life. The duel ends when a life total reaches 0, or
// after round 12 when the life totals differ; a tie at round 12 plays on
// in sudden death until a round has a winner.

import { SUITS } from './deck.js';

export const MAX_ROUNDS = 12;
export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const ENERGY_PER_ROUND = 3;
export const MAX_ENERGY = 6;
export const ADVANTAGE_BONUS = 3;
export const RESONANCE_BONUS = 2;

export function hasAdvantage(attackerSuit, defenderSuit) {
  return SUITS[attackerSuit].beats === defenderSuit;
}

export function effectivePower(card, enemyCard, winningSuit) {
  let power = card.power;
  if (hasAdvantage(card.suit, enemyCard.suit)) power += ADVANTAGE_BONUS;
  if (winningSuit && card.suit === winningSuit) power += RESONANCE_BONUS;
  return power;
}

export function describeBonuses(card, enemyCard, winningSuit) {
  const parts = [];
  if (hasAdvantage(card.suit, enemyCard.suit)) parts.push(`+${ADVANTAGE_BONUS} wind advantage`);
  if (winningSuit && card.suit === winningSuit) parts.push(`+${RESONANCE_BONUS} resonance`);
  return parts;
}

// Resolve one round. Returns the outcome; never mutates its arguments.
export function resolveRound(playerCard, rivalCard, winningSuit) {
  const playerPower = effectivePower(playerCard, rivalCard, winningSuit);
  const rivalPower = effectivePower(rivalCard, playerCard, winningSuit);
  if (playerPower === rivalPower) {
    return {
      winner: 'tie',
      playerPower,
      rivalPower,
      playerDamage: 1,
      rivalDamage: 1,
      nextWinningSuit: winningSuit,
      line: `Tie at ${playerPower} — both sides lose 1 life.`,
    };
  }
  if (playerPower > rivalPower) {
    return {
      winner: 'player',
      playerPower,
      rivalPower,
      playerDamage: 0,
      rivalDamage: playerPower - rivalPower,
      nextWinningSuit: playerCard.suit,
      line: `${playerCard.name} wins the round ${playerPower} to ${rivalPower}.`,
    };
  }
  return {
    winner: 'rival',
    playerPower,
    rivalPower,
    playerDamage: rivalPower - playerPower,
    rivalDamage: 0,
    nextWinningSuit: rivalCard.suit,
    line: `${rivalCard.name} wins the round ${rivalPower} to ${playerPower}.`,
  };
}

export function isDuelOver(state) {
  if (state.playerLife <= 0 || state.rivalLife <= 0) return true;
  if (state.round > MAX_ROUNDS && state.playerLife !== state.rivalLife) return true;
  return false;
}

export function duelWinner(state) {
  if (state.playerLife <= 0 && state.rivalLife <= 0) return 'tie';
  if (state.rivalLife <= 0) return 'player';
  if (state.playerLife <= 0) return 'rival';
  if (state.round > MAX_ROUNDS) {
    if (state.playerLife > state.rivalLife) return 'player';
    if (state.rivalLife > state.playerLife) return 'rival';
  }
  return null;
}
