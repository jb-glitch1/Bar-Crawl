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
      if (g.run.flags.gig_tourist) { BC.ui.say(['"Best. Speakeasy. Ever. I told NO one."'], { speaker: 'Tourist' }); return; }
      BC.ui.say(['A wide-eyed tourist leans in:', '"Psst — which way to the secret speakeasy? I heard it\'s unreal."'], { speaker: 'Tourist' }, () => {
        BC.ui.choose('Point them to Reggie\'s?', ['"Behind the sad fridge shop."', '"...what speakeasy?"'], (i) => {
          if (i === 0) {
            g.run.flags.gig_tourist = true; g.run.cash += 5;
            BC.ui.say(['"You\'re a LEGEND." They press $5 into your palm and melt into the night. (+$5)'], { speaker: 'Tourist' });
            BC.audio && BC.audio.sfx('stamp');
          } else {
            BC.ui.say(['"...you\'re no fun." They wander off.'], { speaker: 'Tourist' });
          }
        });
      });
    },

    // a raccoon running a trash empire (once per loop)
    raccoon(g, a) {
      if (g.run.flags.gig_raccoon) { BC.ui.toast('The raccoon guards its trash empire. Respect it.'); return; }
      g.run.flags.gig_raccoon = true; g.run.cash += 3;
      BC.ui.say(['A raccoon is elbow-deep in a trash can.', 'It freezes. It judges you. It flicks three quarters at your feet and resumes.', '(+$3. You have been dismissed.)'], { speaker: 'Raccoon' });
      BC.audio && BC.audio.sfx('confirm');
    },

    // a street-corner coin bet (repeatable gambling gag)
    bet(g, a) {
      BC.ui.choose('A guy grins: "Bet you $5 this coin lands heads. You in? ($3 stake)"', ['"You\'re on."', 'Decline'], (i) => {
        if (i !== 0) return;
        if (g.run.cash < 3) { BC.ui.toast('"Come back when you got stake money, champ."'); return; }
        if (Math.random() < 0.5) { g.run.cash += 5; BC.ui.toast('TAILS! You win $5. He is genuinely stunned.', { good: true }); BC.audio && BC.audio.sfx('stamp'); }
        else { g.run.cash -= 3; BC.ui.toast('Heads. You lose $3. "Pleasure doin\' business."'); BC.audio && BC.audio.sfx('cancel'); }
      });
    }
  };
})();
