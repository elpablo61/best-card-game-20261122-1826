# Four Winds Duel

[![competition](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/elpablo61/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![entries](https://make.fun/badge/best-card-game-20261122-1826/elpablo61/best-card-game-20261122-1826/entries.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/elpablo61/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original card duel for make.fun's **best-card-game-20261122-1826** bounty.
You face **Kite the Trickster** across a felt table in a duel of the four
winds — Ember, Tide, Gale and Bloom. Each round you both play one card;
higher effective power wins the round and the loser takes damage equal to
the gap. First to 0 life loses; after 12 rounds the higher life total wins.

## The rules

- **Wind cycle:** Ember beats Bloom, Bloom beats Tide, Tide beats Gale,
  Gale beats Ember. A card with the advantage gains **+3 power**.
- **Resonance:** a card whose suit won the previous round gains **+2 power**.
- **Embers:** cards cost 1–3 embers. You gain 3 embers each round (max 6);
  unspent embers carry over, so saving for a big card is a real decision.
- **Ties** cost both sides 1 life. A tie on life after round 12 plays on in
  sudden death until a round has a winner.
- **Kite reads you:** the rival tracks your most-played suit, favours cards
  that beat it, spends cheaply while ahead, and bluffs with a weak card
  about one time in five. Its "tell" line hints at what is coming.

## How to play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). No network request is made — everything is local files, and all
sounds are synthesized with WebAudio.

- Click a card to select it (or press **1–5**), then **Play Card** or **Enter**.
- Click a selected card again to play it immediately.
- **R** restarts the duel, **M** toggles sound.

## Layout

- `game/index.html` — the page; `game/styles.css` — table, cards, overlays
- `game/src/deck.js` — the four suits, the 24 named cards, seeded shuffle
- `game/src/rules.js` — combat math: advantage, resonance, round resolution
- `game/src/ai.js` — Kite the Trickster: rival picks and tells
- `game/src/state.js` — duel state, dealing, rounds, sudden death
- `game/src/render.js` — the table: score bar, hands, arena, log, overlays
- `game/src/input.js` — keyboard and mouse control
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files)
- `game/src/main.js` — bootstrap, plus deterministic `?shot=` screenshot modes
- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `/output/dossier.json` via `buildDossier`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Screenshots

`?shot=title`, `?shot=clash&seed=7`, `?shot=win&seed=7` and `?shot=loss&seed=7`
replay deterministic states of the game itself for the screenshots in
`screenshots/` (title, a mid-duel clash with both cards face-up, the
victory screen and the defeat screen).

## License

MIT — see [LICENSE](LICENSE).
