// state.js — the duel's state and its transitions: starting a duel,
// dealing, playing a round, drawing back up, and ending. Rendering and
// input live elsewhere; this file only moves the numbers and the cards.

import { buildDeck, shuffle } from './deck.js';
import {
  HAND_SIZE, START_LIFE, ENERGY_PER_ROUND, MAX_ENERGY,
  resolveRound, isDuelOver, duelWinner,
} from './rules.js';
import { chooseRivalCard } from './ai.js';

export function newDuel(seed) {
  const rng = seed;
  const playerDeck = shuffle(buildDeck('player'), rng);
  const rivalDeck = shuffle(buildDeck('rival'), rng);
  const state = {
    rng,
    phase: 'choose', // choose | reveal | over
    round: 1,
    playerLife: START_LIFE,
    rivalLife: START_LIFE,
    playerEnergy: ENERGY_PER_ROUND,
    rivalEnergy: ENERGY_PER_ROUND,
    playerDeck,
    rivalDeck,
    playerHand: [],
    rivalHand: [],
    playerDiscard: [],
    rivalDiscard: [],
    playerPlayed: [],
    rivalPlayed: [],
    playerCard: null,
    rivalCard: null,
    lastOutcome: null,
    winningSuit: null,
    roundsWon: 0,
    roundsLost: 0,
    damageDealt: 0,
    damageTaken: 0,
    log: ['The duel begins. Play a card — the wind favours the bold.'],
    tell: '',
    winner: null,
    suddenDeath: false,
  };
  drawUp(state, 'player');
  drawUp(state, 'rival');
  return state;
}

function drawUp(state, side) {
  const hand = side === 'player' ? state.playerHand : state.rivalHand;
  const deck = side === 'player' ? state.playerDeck : state.rivalDeck;
  const discard = side === 'player' ? state.playerDiscard : state.rivalDiscard;
  while (hand.length < HAND_SIZE) {
    if (deck.length === 0) {
      if (discard.length === 0) return;
      deck.push(...shuffle(discard.splice(0), state.rng));
    }
    hand.push(deck.pop());
  }
}

export function startRound(state) {
  state.playerEnergy = Math.min(MAX_ENERGY, state.playerEnergy + ENERGY_PER_ROUND);
  state.rivalEnergy = Math.min(MAX_ENERGY, state.rivalEnergy + ENERGY_PER_ROUND);
  state.playerCard = null;
  state.rivalCard = null;
  state.lastOutcome = null;
  state.phase = 'choose';
}

export function playPlayerCard(state, cardId) {
  if (state.phase !== 'choose') return false;
  const idx = state.playerHand.findIndex((c) => c.id === cardId);
  if (idx < 0) return false;
  const card = state.playerHand[idx];
  if (card.cost > state.playerEnergy) return false;
  state.playerHand.splice(idx, 1);
  state.playerEnergy -= card.cost;
  state.playerCard = card;
  state.playerPlayed.push(card);

  const rivalCard = chooseRivalCard(state, state.rng);
  const rIdx = state.rivalHand.findIndex((c) => c.id === rivalCard.id);
  state.rivalHand.splice(rIdx, 1);
  state.rivalEnergy -= rivalCard.cost;
  state.rivalCard = rivalCard;
  state.rivalPlayed.push(rivalCard);

  const outcome = resolveRound(card, rivalCard, state.winningSuit);
  state.lastOutcome = outcome;
  state.playerLife = Math.max(0, state.playerLife - outcome.playerDamage);
  state.rivalLife = Math.max(0, state.rivalLife - outcome.rivalDamage);
  state.damageDealt += outcome.rivalDamage;
  state.damageTaken += outcome.playerDamage;
  if (outcome.winner === 'player') state.roundsWon += 1;
  if (outcome.winner === 'rival') state.roundsLost += 1;
  state.winningSuit = outcome.nextWinningSuit;
  state.log.unshift(
    `Round ${state.round}: ${card.name} (${outcome.playerPower}) vs ${rivalCard.name} (${outcome.rivalPower}) — ${outcome.line}`,
  );
  state.log = state.log.slice(0, 6);
  state.playerDiscard.push(card);
  state.rivalDiscard.push(rivalCard);
  state.phase = 'reveal';
  return true;
}

export function advanceAfterReveal(state) {
  if (state.phase !== 'reveal') return;
  if (isDuelOver(state)) {
    state.phase = 'over';
    state.winner = duelWinner(state);
    state.log.unshift(
      state.winner === 'player'
        ? 'Victory! The four winds bow to you.'
        : state.winner === 'rival'
          ? 'Defeat. Kite keeps the table — for now.'
          : 'A dead-even duel. The winds call it a draw.',
    );
    return;
  }
  state.round += 1;
  if (state.round > 12) state.suddenDeath = true;
  drawUp(state, 'player');
  drawUp(state, 'rival');
  startRound(state);
}

// Headless replay used by screenshot mode: play rounds with a fixed
// picker until the duel reaches the requested end, then stop.
export function simulateToEnd(state, picker) {
  let guard = 0;
  while (state.phase !== 'over' && guard < 60) {
    guard += 1;
    const affordable = state.playerHand.filter((c) => c.cost <= state.playerEnergy);
    const pool = affordable.length > 0 ? affordable : state.playerHand;
    const pick = picker(pool, state);
    if (!pick) break;
    playPlayerCard(state, pick.id);
    advanceAfterReveal(state);
  }
  return state;
}

export function strongestCard(pool) {
  return pool.slice().sort((a, b) => b.power - a.power)[0];
}

export function weakestCard(pool) {
  return pool.slice().sort((a, b) => a.power - b.power)[0];
}
