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
| Z / Enter / Space | Confirm · talk · pet dogs · advance text |
| X / Shift | Cancel / back out · hop on/off your **bike** |
| M / Tab / Esc | **Status** menu — time, tipsiness, punch card, items, cash |

You start in your apartment — **walk out the door** to begin the night. An
always-on HUD shows the **countdown clock** (top-left) and your **tipsiness**
(top-right).

## The night

- **Time** runs continuously from 5 PM to 2 AM (about an hour for a full night;
  it starts in daylight and slides into dusk and deep night as you go).
- **Tipsiness** rises when you **order a drink** to take on each bar's challenge.
  It warps the world — the screen sways, the music muffles, hidden things appear
  — and it's a double-edged sword:
  - **Floor:** some things only open up once you're a little drunk (a certain
    speakeasy, a *secret* dartboard bullseye…).
  - **Ceiling:** hit 100% and you **black out**, get sent home, and drop an item
    somewhere in town to retrace next loop.
  - **Sober up:** eat at the midnight diner, or buy an **energy drink** (and a
    speed boost) at the corner store with your nightly cash.
- **Getting around:** walk anywhere, find a **bike** in the park (yours for good,
  parks included), or rent a **scooter** (fast on streets, battery always
  insultingly low, banned from parks). Townsfolk wander and there are dogs to pet.
- **Challenges** are replayable once stamped, and each keeps a **high score**.
- **The loop:** reach 2 AM or black out and the night resets — but you keep what
  you learned (passwords, the map, where the bike is) and your items, so each run
  you go further. Clear the whole punch card before last call to win.

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
