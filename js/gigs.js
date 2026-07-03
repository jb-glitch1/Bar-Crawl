// Little optional side-gigs scattered around town. Each is wired to an overworld
// actor via its `gig` field and dispatched from talkActor. Most pay cash (your
// energy-drink fund) and none are required to win.
(function () {
  const BC = window.BC || (window.BC = {});

  BC.gigs = {
    // tip a street musician for a burst of pep (speed)
    busker(g, a) {
      BC.ui.choose('A busker strums hopefully at you. Drop $2?', ['Tip $2', 'Keep walking'], (i) => {
        if (i !== 0) return;
        if (g.run.cash < 2) { BC.ui.toast('"...no cash, no concert, my friend."'); return; }
        g.run.cash -= 2;
        g.run.energized = Math.max(g.run.energized, 12);
        BC.ui.toast('The busker shreds a solo JUST for you. (+pep)', { good: true });
        BC.audio && BC.audio.sfx('stamp');
      });
    },

    // point a tourist toward the speakeasy for a tip (once per loop)
    tourist(g, a) {
      const po = { speaker: 'Tourist', portrait: a.colors };
      if (g.run.flags.gig_tourist) { BC.ui.say(['"Best. Speakeasy. Ever. I told NO one."'], po); return; }
      BC.ui.say(['A wide-eyed tourist leans in:', '"Psst — which way to the secret speakeasy? I heard it\'s unreal."'], po, () => {
        BC.ui.choose('Point them to Reggie\'s?', ['"Behind the sad fridge shop."', '"...what speakeasy?"'], (i) => {
          if (i === 0) {
            g.run.flags.gig_tourist = true; g.run.cash += 5;
            BC.ui.say(['"You\'re a LEGEND." They press $5 into your palm and melt into the night. (+$5)'], po);
            BC.audio && BC.audio.sfx('stamp'); if (BC.fx) BC.fx.coins();
          } else {
            BC.ui.say(['"...you\'re no fun." They wander off.'], po);
          }
        });
      });
    },

    // a raccoon running a trash empire (once per loop)
    raccoon(g, a) {
      if (g.run.flags.gig_raccoon) { BC.ui.toast('The raccoon guards its trash empire. Respect it.'); return; }
      g.run.flags.gig_raccoon = true; g.run.cash += 3;
      BC.ui.say(['A raccoon is elbow-deep in a trash can.', 'It freezes. It judges you. It flicks three quarters at your feet and resumes.', '(+$3. You have been dismissed.)'], { speaker: 'Raccoon', portrait: a.colors, portraitKind: 'dog' });
      BC.audio && BC.audio.sfx('confirm'); if (BC.fx) BC.fx.coins();
    },

    // Gary. He's late for the thing. He is ALWAYS late for the thing.
    // He's on a different screen every loop; the mystery resolves stupidly.
    gary(g, a) {
      const lines = g.loopPick([
        [0, ["Can't talk. Late for the thing."]],
        [3, ['The thing got moved. Now I\'m early.', 'Worse, somehow.']],
        [6, ['You again? I see you EVERYWHERE.', 'Are YOU following the thing too?']],
        [10, ['...Fine. The thing is TRIVIA NIGHT.', 'My brother hosts it. Eight o\'clock. I have never ONCE made it.', 'Go. GO. Tell him Gary says hi.']]
      ]);
      if (g.meta.loops >= 10) g.learn('gary_thing');
      BC.ui.say(lines, { speaker: 'Gary (?)', portrait: a.colors });
    },

    // your future self only exists at the edge of a blackout (85-99 tipsy)
    futureself(g, a) {
      const po = { speaker: 'Future You', portrait: a.colors };
      if (g.run.flags.gig_future) { BC.ui.say(['"Still here. Still proud. Still: NOT the fourth one."'], po); return; }
      g.run.flags.gig_future = true;
      g.run.cash += 20;
      if (BC.fx) BC.fx.coins();
      BC.audio && BC.audio.sting && BC.audio.sting('stamp');
      BC.ui.say([
        'A figure flickers at the edge of the porch light. They look like you. Rough-night version.',
        '"Listen. Twenty bucks. Water at the store. Do NOT order the fourth one."',
        '"...See you at sunrise. Hopefully."  (+$20)'
      ], po);
    },

    // a street-corner coin bet (repeatable gambling gag)
    bet(g, a) {
      BC.ui.choose('A guy grins: "Bet you $5 this coin lands heads. You in? ($3 stake)"', ['"You\'re on."', 'Decline'], (i) => {
        if (i !== 0) return;
        if (g.run.cash < 3) { BC.ui.toast('"Come back when you got stake money, champ."'); return; }
        if (Math.random() < 0.5) { g.run.cash += 5; BC.ui.toast('TAILS! You win $5. He is genuinely stunned.', { good: true }); BC.audio && BC.audio.sfx('stamp'); if (BC.fx) BC.fx.coins(); }
        else { g.run.cash -= 3; BC.ui.toast('Heads. You lose $3. "Pleasure doin\' business."'); BC.audio && BC.audio.sfx('cancel'); }
      });
    }
  };
})();
