# Bar-Crawl

A cozy-turned-deranged top-down bar crawl. It's 5 PM; the bars close at 2 AM.
Hit every bar, earn every stamp on your punch card, and get home before last
call — or loop the night and try again, sharper each time. They say the night
you finish the WHOLE card is the one that finally sticks.

Vibe: **Pokémon** traversal + **Animal Crossing** tone + **Undertale** encounters
+ **Majora's Mask** time-loop + classic top-down **Zelda** flip-screen camera.

Built in vanilla HTML5 + Canvas + JavaScript. No frameworks, no build step, no
dependencies, no external art or audio — every sprite (and the pixel font) is
drawn in code and every note is synthesized with the Web Audio API.

## Play

It needs to be served over HTTP (browsers block some features on `file://`):

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works. To share it, push to GitHub and enable **GitHub
Pages** (Settings → Pages → deploy from branch) — the repo is already a static
site.

**On a phone**: touch controls appear automatically (analog d-pad + A/B/MENU;
tapping the screen also confirms). Use **Add to Home Screen** to install it and
play fullscreen.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Move |
| Z / Enter / Space | Confirm · talk · pet animals · advance text |
| X / Shift | Cancel / back out · hop on/off your **bike** |
| M / Tab / Esc | **Status** menu — time, tipsiness, town map, items (Z flips sound) |

On the title screen, **X** opens the **SOUND TEST** (the house band takes
requests). You start in your apartment — **walk out the door** to begin, or
**nap on your bed** to skip an hour. An always-on HUD shows the countdown
clock, your tipsiness, and your stamps.

## The night

- **Pick your night** at the title: *Casual* (long night, blackouts only cost
  an hour), *A night out* (the classic), or *LAST CALL* (short night, heavy
  pours).
- **Time** runs continuously from 5 PM (about an hour for a classic night,
  daylight sliding into dusk, lamplight, and deep night). Some things keep
  **hours**: happy hour at the Newt till 7, trivia at 8, the karaoke crowd at
  9, Reggie's at 10, the Everything Burrito after midnight. Routing is the
  puzzle.
- **Tipsiness** rises when you order a drink to take on each bar's challenge —
  and you choose the **pour**: easy, regular, or STRONG. It's a double-edged
  meter:
  - **Floor:** some things only open up once you're a little drunk (a certain
    speakeasy, a *secret* dartboard bullseye, Confident Nonsense).
  - **Ceiling:** hit 100% and you **black out**, get sent home, and drop an
    item somewhere in town — it'll be waiting on that tile next loop.
  - **Sober up:** the midnight diner, bottled water, a nap, or an energy drink
    at the corner store. A **double espresso** makes time itself run slower.
- **Getting around:** walk, find a **bike** in the park (yours for good),
  grab one of the terrible **scooters** parked around town, or hail a **cab**
  ($8 flat to any district you've visited tonight).
- **Challenges** are replayable once stamped; new personal bests pay $5.
- **The loop:** miss last call or black out and the night resets — but you
  keep what you learned (passwords, schedules, the map, your bike) and the
  town remembers: bartenders bring up your shame, the paper runs a headline,
  and your Déjà Brew tab keeps growing. Bars you've beaten in any loop greet
  you with "The usual?" and skip the pitch.
- Pet **every** animal in one night. It affects nothing. It matters completely.

## The crawl (12 stamps)

The Tipsy Newt · The Hail Mary · Off-Key West · Pour Decisions · The Sticky
Floor · Reggie's (find it…) · Witz End · The Cellar Door · Sleigh It Ain't So ·
Sobering Thoughts · Déjà Brew · the Perfect Cocktail.

## Development

```
index.html            loads everything in dependency order
style.css             centers + pixel-scales the canvas; touch-control layout
manifest.json         PWA install (fullscreen, icons)
js/                   engine, systems, world, scenes
  font.js             the 5x7 bitmap pixel font
  scenes/             title, overworld, bar interior, ending, sound test
  scenes/minigames/   memory, trivia, karaoke, darts, tasting, wits, burrito, dungeon
tests/                headless test suite (node tests/run.js, zero deps)
tools/gen-icons.js    regenerates the PWA icons
```

Tests boot the real game under a canvas mock and drive it with synthetic
input — they run in CI on every push (`.github/workflows/tests.yml`).
