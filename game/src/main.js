// main.js — bootstrap for Four Winds Duel. Wires state, rendering and
// input together, and runs the deterministic screenshot modes the maker
// uses to capture the game's own renders:
//   ?shot=title            the title screen
//   ?shot=play&seed=7      a mid-duel table after a few rounds
//   ?shot=win&seed=7       the victory screen (player-favoured replay)
//   ?shot=loss&seed=7      the defeat screen (rival-favoured replay)
// Without a shot parameter the game starts on the title screen as usual.

import { makeRng } from './deck.js';
import { newDuel, playPlayerCard, advanceAfterReveal, simulateToEnd, strongestCard, weakestCard } from './state.js';
import { renderTable, renderTitle, renderGameOver } from './render.js';
import { rivalTell } from './ai.js';
import { bindKeyboard, makeController } from './input.js';
import {
  ensureAudio, playFlip, playSelect, playWinRound, playLoseRound,
  playVictory, playDefeat, toggleMute, isMuted,
} from './audio.js';

const root = document.getElementById('app');

const game = {
  screen: 'title',
  state: null,
  ui: { selectedId: null },
  muted: false,

  startDuel(seed) {
    const rng = makeRng(seed === undefined ? (Date.now() % 2147483647) : seed);
    this.state = newDuel(rng);
    this.state.tell = rivalTell(this.state, rng);
    this.screen = 'table';
    this.ui.selectedId = null;
    this.render();
  },

  selectCard(cardId, playNow) {
    if (!this.state || this.state.phase !== 'choose') return;
    const card = this.state.playerHand.find((c) => c.id === cardId);
    if (!card) return;
    if (playNow && this.ui.selectedId === cardId) {
      this.playSelected();
      return;
    }
    this.ui.selectedId = cardId;
    playSelect();
    this.render();
  },

  playSelected() {
    if (!this.state || this.state.phase !== 'choose') return;
    const id = this.ui.selectedId;
    if (!id) return;
    const card = this.state.playerHand.find((c) => c.id === id);
    if (!card || card.cost > this.state.playerEnergy) return;
    ensureAudio();
    playFlip();
    const ok = playPlayerCard(this.state, id);
    if (!ok) return;
    this.ui.selectedId = null;
    this.state.tell = rivalTell(this.state, this.state.rng);
    const outcome = this.state.lastOutcome;
    if (outcome) {
      if (outcome.winner === 'player') playWinRound();
      else if (outcome.winner === 'rival') playLoseRound();
    }
    this.render();
  },

  advance() {
    if (!this.state) return;
    if (this.state.phase === 'reveal') {
      advanceAfterReveal(this.state);
      if (this.state.phase === 'over') {
        if (this.state.winner === 'player') playVictory();
        else if (this.state.winner === 'rival') playDefeat();
      }
      this.render();
      return;
    }
    if (this.state.phase === 'over') {
      this.startDuel();
    }
  },

  toggleMute() {
    this.muted = toggleMute();
    this.render();
  },

  render() {
    if (this.screen === 'title' || !this.state) {
      renderTitle(root, () => {
        ensureAudio();
        this.startDuel();
      });
      return;
    }
    if (this.state.phase === 'over') {
      renderTable(root, this.state, this.ui, {
        selectCard: () => {},
        nextRound: () => this.advance(),
      });
      renderGameOver(root, this.state, () => this.startDuel());
      return;
    }
    renderTable(root, this.state, this.ui, {
      selectCard: (id, playNow) => this.selectCard(id, playNow),
      nextRound: () => this.advance(),
    });
    const mute = document.createElement('button');
    mute.className = 'mute-btn';
    mute.textContent = isMuted() ? '🔇 Sound off (M)' : '🔊 Sound on (M)';
    mute.addEventListener('click', () => this.toggleMute());
    root.appendChild(mute);
  },
};

function runShotMode(params) {
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '7');
  if (shot === 'title') {
    game.render();
    return true;
  }
  if (shot === 'play') {
    game.startDuel(seed);
    const rng = game.state.rng;
    for (let i = 0; i < 4 && game.state.phase !== 'over'; i += 1) {
      const affordable = game.state.playerHand.filter((c) => c.cost <= game.state.playerEnergy);
      const pool = affordable.length > 0 ? affordable : game.state.playerHand;
      const pick = pool[Math.floor(rng() * pool.length)];
      playPlayerCard(game.state, pick.id);
      advanceAfterReveal(game.state);
    }
    game.state.tell = rivalTell(game.state, rng);
    game.render();
    return true;
  }
  if (shot === 'win' || shot === 'loss') {
    game.startDuel(seed);
    simulateToEnd(game.state, shot === 'win' ? strongestCard : weakestCard);
    game.render();
    return true;
  }
  return false;
}

const params = new URLSearchParams(window.location.search);
if (!runShotMode(params)) {
  game.render();
}

bindKeyboard(makeController(game));

window.__fourWinds = game;
