// input.js — keyboard and mouse control. Clicking a card selects it;
// clicking it again (or pressing Enter, or the Play button) plays it.
// Keys 1–5 pick a hand slot, Enter plays the selection, R restarts the
// duel, M toggles sound.

import { playSelect } from './audio.js';

export function bindKeyboard(controller) {
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const key = e.key.toLowerCase();
    if (key >= '1' && key <= '5') {
      const idx = Number(key) - 1;
      controller.selectByIndex(idx);
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (controller.phase() === 'title') {
        e.preventDefault();
        controller.start();
        return;
      }
      if (controller.phase() === 'reveal' || controller.phase() === 'over') {
        e.preventDefault();
        controller.advance();
        return;
      }
      e.preventDefault();
      controller.playSelected();
      return;
    }
    if (key === 'r') {
      controller.restart();
      return;
    }
    if (key === 'm') {
      controller.toggleMute();
    }
  });
}

export function makeController(game) {
  return {
    phase() {
      return game.screen === 'title' ? 'title' : game.state.phase;
    },
    start() {
      game.startDuel();
    },
    restart() {
      game.startDuel();
    },
    advance() {
      game.advance();
    },
    toggleMute() {
      game.toggleMute();
    },
    selectByIndex(idx) {
      const hand = game.state ? game.state.playerHand : [];
      const card = hand[idx];
      if (card) game.selectCard(card.id);
    },
    playSelected() {
      if (game.ui.selectedId) game.playSelected();
    },
    selectCard(cardId, playNow) {
      game.selectCard(cardId, playNow);
    },
  };
}

export { playSelect };
