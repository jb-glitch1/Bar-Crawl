# Bar-Crawl

A cozy-turned-deranged top-down bar crawl. It's 5 PM; the bars close at 2 AM.
Hit every bar, earn every stamp on your punch card, and get home before last
call — or loop the night and try again, sharper each time.

Vibe: **Pokémon** traversal + **Animal Crossing** tone + **Undertale** encounters
+ **Majora's Mask** time-loop + classic top-down **Zelda** flip-screen camera.

Built in vanilla HTML5 + Canvas + JavaScript. No frameworks, no build step, no
dependencies, no external art or audio — every sprite is drawn in code and every
note is synthesized with the Web Audio API.

## Play

It needs to be served over HTTP (browsers block some features on `file://`):

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works. To share it, push to GitHub and enable **GitHub
Pages** (Settings → Pages → deploy from branch) — the repo is already a static
site, so the root is all you need.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Move |
| Z / Enter / Space | Confirm, talk, advance text |
| X / Shift | Cancel · hop on/off your **bike** (once you find it) |
| Enter… wait, that's confirm | (use **M / Tab / Esc**) for the **Status** menu — time, tipsiness, punch card |

## The night

- **Time** runs continuously from 5 PM to 2 AM (~20 real minutes for a full
  night). It isn't shown by default — check the **Status** menu (M).
- **Tipsiness** rises every time you clear a bar's challenge (a celebratory
  drink). It warps the world — the screen sways, the music muffles — and it's
  a double-edged sword:
  - **Floor:** some things only open up once you're a little drunk (a certain
    speakeasy, a *secret* dartboard bullseye…).
  - **Ceiling:** hit 100% and you **black out**, get sent home, and drop an
    item somewhere in town that you'll have to retrace next loop.
- **Getting around:** walk anywhere, find a **bike** in the park (yours for
  good, even in the parks), or rent a **scooter** (fast on streets, battery
  always insultingly low, banned from parks).
- **The loop:** reach 2 AM or black out and the night resets — but you keep
  what you learned (passwords, the map, where the bike is) and your items, so
  each run you go further. Clear the whole punch card before last call to win.

## The crawl (12 stamps)

The Tipsy Newt · The Hail Mary · Off-Key West · Pour Decisions · The Sticky
Floor · Reggie's (find it…) · Witz End · The Cellar Door · Sleigh It Ain't So ·
Sobering Thoughts · Déjà Brew · the Perfect Cocktail.

## Project layout

```
index.html            loads everything in dependency order
style.css             centers + pixel-scales the canvas
js/                   engine, systems, world, scenes
  scenes/             title, overworld, bar interior, ending
  scenes/minigames/   memory, trivia, rhythm, darts, tasting, wits, burrito, dungeon
```
