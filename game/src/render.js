// render.js — draws the whole table into the DOM: the score bar, the
// rival's hand, the arena where cards clash, the player's hand, the duel
// log, and the title / victory / defeat overlays.

import { SUITS, suitOf } from './deck.js';
import { RIVAL_NAME } from './ai.js';
import { MAX_ROUNDS, START_LIFE } from './rules.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function lifeBar(life, max) {
  const wrap = el('div', 'lifebar');
  const fill = el('div', 'lifebar-fill');
  fill.style.width = `${Math.max(0, (life / max) * 100)}%`;
  wrap.appendChild(fill);
  return wrap;
}

function energyPips(energy) {
  const wrap = el('span', 'pips');
  for (let i = 0; i < 6; i += 1) {
    const pip = el('span', 'pip' + (i < energy ? ' lit' : ''));
    pip.textContent = '●';
    wrap.appendChild(pip);
  }
  return wrap;
}

export function cardElement(card, opts) {
  const o = opts || {};
  const suit = suitOf(card);
  const node = el('div', 'card' + (o.faceDown ? ' back' : '') + (o.selected ? ' selected' : '') + (o.affortless && card.cost > o.energy ? ' too-costly' : ''));
  node.dataset.cardId = card.id;
  if (o.faceDown) {
    const glyph = el('div', 'card-back-glyph', '✦');
    const label = el('div', 'card-back-label', 'FOUR WINDS');
    node.append(glyph, label);
    return node;
  }
  node.style.setProperty('--suit', suit.color);
  node.style.setProperty('--suit-dark', suit.dark);
  const top = el('div', 'card-top');
  const power = el('span', 'card-power', String(card.power));
  const cost = el('span', 'card-cost');
  cost.title = `Costs ${card.cost} ember${card.cost > 1 ? 's' : ''}`;
  for (let i = 0; i < card.cost; i += 1) cost.appendChild(el('span', 'ember-dot', '●'));
  top.append(power, cost);
  const art = el('div', 'card-art');
  art.appendChild(el('div', 'card-glyph', suit.glyph));
  art.appendChild(el('div', 'card-suit-name', suit.name.toUpperCase()));
  const name = el('div', 'card-name', card.name);
  const foot = el('div', 'card-foot', `PWR ${card.power} · COST ${card.cost}`);
  foot.title = `${suit.name} beats ${SUITS[suit.beats].name}`;
  node.title = `${card.name} — ${suit.name}, power ${card.power}, cost ${card.cost} embers, beats ${SUITS[suit.beats].name}`;
  node.append(top, art, name, foot);
  return node;
}

function renderHeader(root, state) {
  const header = el('header', 'scorebar');
  const you = el('div', 'side you');
  you.append(el('div', 'side-name', 'YOU'), el('div', 'side-life', `❤ ${state.playerLife} / ${START_LIFE}`));
  you.appendChild(lifeBar(state.playerLife, START_LIFE));
  const mid = el('div', 'mid');
  mid.appendChild(el('div', 'round-label', state.suddenDeath ? 'SUDDEN DEATH' : `ROUND ${Math.min(state.round, MAX_ROUNDS)} / ${MAX_ROUNDS}`));
  const score = el('div', 'score-line', `Rounds ${state.roundsWon} – ${state.roundsLost}  ·  Damage ${state.damageDealt} dealt / ${state.damageTaken} taken`);
  mid.appendChild(score);
  const energy = el('div', 'energy-line');
  energy.appendChild(el('span', '', 'Embers '));
  energy.appendChild(energyPips(state.playerEnergy));
  mid.appendChild(energy);
  const rival = el('div', 'side rival');
  rival.append(el('div', 'side-name', RIVAL_NAME.toUpperCase()), el('div', 'side-life', `❤ ${state.rivalLife} / ${START_LIFE}`));
  rival.appendChild(lifeBar(state.rivalLife, START_LIFE));
  header.append(you, mid, rival);
  root.appendChild(header);
}

function renderRivalHand(root, state) {
  const row = el('div', 'rival-row');
  row.appendChild(el('div', 'row-label', `${RIVAL_NAME} · ${state.rivalHand.length} cards · ${state.rivalDeck.length} in deck`));
  const hand = el('div', 'hand rival-hand');
  for (const card of state.rivalHand) hand.appendChild(cardElement(card, { faceDown: true }));
  row.appendChild(hand);
  root.appendChild(row);
}

function renderArena(root, state, onPlay) {
  const arena = el('section', 'arena');
  const label = el('div', 'arena-label', state.phase === 'reveal' ? 'THE CLASH' : 'CHOOSE A CARD — CLICK ONE, THEN PLAY IT');
  arena.appendChild(label);
  const slots = el('div', 'arena-slots');
  const mySlot = el('div', 'arena-slot');
  mySlot.appendChild(el('div', 'slot-name', 'YOUR CARD'));
  if (state.playerCard) mySlot.appendChild(cardElement(state.playerCard, { selected: false }));
  else mySlot.appendChild(el('div', 'slot-empty', '—'));
  const vs = el('div', 'vs', 'VS');
  const rivalSlot = el('div', 'arena-slot');
  rivalSlot.appendChild(el('div', 'slot-name', 'RIVAL CARD'));
  if (state.rivalCard) rivalSlot.appendChild(cardElement(state.rivalCard, {}));
  else if (state.phase === 'reveal') rivalSlot.appendChild(el('div', 'slot-empty', '—'));
  else rivalSlot.appendChild(cardElement({ id: 'hidden', suit: 'ember', name: '?', cost: 0, power: 0 }, { faceDown: true }));
  slots.append(mySlot, vs, rivalSlot);
  arena.appendChild(slots);

  if (state.lastOutcome) {
    const out = state.lastOutcome;
    const banner = el('div', 'outcome ' + out.winner, out.line);
    const powers = el('div', 'powers', `You ${out.playerPower} — ${out.rivalPower} ${RIVAL_NAME}`);
    arena.append(banner, powers);
    const next = el('button', 'btn primary', 'NEXT ROUND  ⏎');
    next.addEventListener('click', onPlay);
    if (state.phase !== 'over') arena.appendChild(next);
  } else if (state.tell) {
    arena.appendChild(el('div', 'tell', state.tell));
  }
  root.appendChild(arena);
}

function renderPlayerHand(root, state, selectedId, onSelect) {
  const row = el('div', 'player-row');
  row.appendChild(el('div', 'row-label', `YOUR HAND · ${state.playerHand.length} cards · ${state.playerDeck.length} in deck · ${state.playerDiscard.length} discarded`));
  const hand = el('div', 'hand player-hand');
  state.playerHand.forEach((card, i) => {
    const node = cardElement(card, { selected: card.id === selectedId, energy: state.playerEnergy, effortless: true });
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${card.name}, power ${card.power}, cost ${card.cost} embers, ${suitOf(card).name}`);
    node.addEventListener('click', () => onSelect(card.id));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(card.id);
      }
    });
    const key = el('span', 'key-hint', String(i + 1));
    node.appendChild(key);
    hand.appendChild(node);
  });
  row.appendChild(hand);
  const controls = el('div', 'controls');
  const playBtn = el('button', 'btn primary big', '▶  PLAY SELECTED CARD');
  playBtn.disabled = !selectedId;
  playBtn.addEventListener('click', () => onSelect(selectedId, true));
  const hint = el('div', 'keys-hint', 'Keys 1–5 select · Enter plays · R restarts · M mutes');
  controls.append(playBtn, hint);
  row.appendChild(controls);
  root.appendChild(row);
}

function renderLog(root, state) {
  const aside = el('aside', 'log');
  aside.appendChild(el('div', 'log-title', 'DUEL LOG'));
  for (const line of state.log) aside.appendChild(el('div', 'log-line', line));
  if (state.winningSuit) {
    aside.appendChild(el('div', 'log-line resonance', `Resonance: ${SUITS[state.winningSuit].name} cards gain +2 next round.`));
  }
  root.appendChild(aside);
}

function overlay(root, kind, title, subtitle, stats, buttonLabel, onButton) {
  const ov = el('div', `overlay ${kind}`);
  const panel = el('div', 'panel');
  panel.appendChild(el('div', 'panel-title', title));
  if (subtitle) panel.appendChild(el('div', 'panel-sub', subtitle));
  if (stats) {
    const list = el('div', 'panel-stats');
    for (const [k, v] of stats) list.appendChild(el('div', 'stat', `${k}: ${v}`));
    panel.appendChild(list);
  }
  const btn = el('button', 'btn primary big', buttonLabel);
  btn.addEventListener('click', onButton);
  panel.appendChild(btn);
  ov.appendChild(panel);
  root.appendChild(ov);
}

export function renderTable(root, state, ui, handlers) {
  root.innerHTML = '';
  renderHeader(root, state);
  renderRivalHand(root, state);
  renderArena(root, state, handlers.nextRound);
  renderPlayerHand(root, state, ui.selectedId, handlers.selectCard);
  renderLog(root, state);
}

export function renderTitle(root, onStart) {
  root.innerHTML = '';
  const hero = el('div', 'title-screen');
  hero.appendChild(el('div', 'title-kicker', 'A CARD DUEL OF THE FOUR WINDS'));
  hero.appendChild(el('div', 'title-main', 'FOUR WINDS DUEL'));
  hero.appendChild(el('div', 'title-sub', 'Outwit Kite the Trickster. Play the right wind at the right moment.'));
  const suits = el('div', 'title-suits');
  for (const key of ['ember', 'tide', 'gale', 'bloom']) {
    const s = SUITS[key];
    const chip = el('div', 'suit-chip');
    chip.style.setProperty('--suit', s.color);
    chip.append(el('div', 'suit-chip-glyph', s.glyph), el('div', 'suit-chip-name', s.name), el('div', 'suit-chip-beats', `beats ${SUITS[s.beats].name}`));
    suits.appendChild(chip);
  }
  hero.appendChild(suits);
  const how = el('div', 'how-to');
  how.appendChild(el('div', 'how-title', 'HOW TO PLAY'));
  const rules = [
    'Each round you and Kite play one card. Higher effective power wins the round.',
    'Ember beats Bloom, Bloom beats Tide, Tide beats Gale, Gale beats Ember — advantage is +3 power.',
    'A card of the suit that won the last round gains +2 resonance.',
    'Cards cost embers: you gain 3 each round (max 6). The loser of a round loses life equal to the power gap.',
    'Reduce Kite to 0 life — or hold more life after 12 rounds — to win.',
  ];
  for (const r of rules) how.appendChild(el('div', 'how-line', '•  ' + r));
  hero.appendChild(how);
  const btn = el('button', 'btn primary big', '▶  START THE DUEL');
  btn.addEventListener('click', onStart);
  hero.appendChild(btn);
  hero.appendChild(el('div', 'title-foot', 'Keyboard: 1–5 select a card · Enter plays · R restarts · M mutes'));
  root.appendChild(hero);
}

export function renderGameOver(root, state, onAgain) {
  const win = state.winner === 'player';
  const stats = [
    ['Final life', `${state.playerLife} — ${state.rivalLife}`],
    ['Rounds won', `${state.roundsWon} – ${state.roundsLost}`],
    ['Damage dealt', String(state.damageDealt)],
    ['Rounds played', String(state.round - 1)],
  ];
  if (win) {
    overlay(root, 'win', '🏆  VICTORY', 'The four winds bow to you. Kite tips a hat and deals again — but the table is yours.', stats, '↻  PLAY AGAIN', onAgain);
  } else if (state.winner === 'rival') {
    overlay(root, 'loss', 'DEFEAT', 'Kite keeps the table — for now. Study the wind cycle, spend your embers wisely, and challenge again.', stats, '↻  CHALLENGE AGAIN', onAgain);
  } else {
    overlay(root, 'draw', 'A DEAD-EVEN DUEL', 'Neither side yields. The winds call it a draw — deal again and break it.', stats, '↻  DEAL AGAIN', onAgain);
  }
}
