// Win screen — the full punch card, cleared before 2 AM.
(function () {
  const BC = window.BC || (window.BC = {});
  const S = BC.scenes || (BC.scenes = {});
  let t = 0;

  S.win = {
    enter() { t = 0; if (BC.audio) BC.audio.setMood('early'); },
    update(dt) {
      t += dt;
      if (t > 0.6 && (BC.input.pressed('a') || BC.input.pressed('start'))) {
        BC.game.newRun();
        BC.setScene('home', {});
      }
    },
    render(ctx) {
      BC.rect(ctx, 0, 0, BC.W, BC.H, '#0a0a14');
      const g = BC.game;
      BC.text(ctx, 'LAST CALL SURVIVED', BC.W / 2, 46, { color: '#ffe27a', size: 14, align: 'center' });
      BC.text(ctx, 'You cleared the whole crawl.', BC.W / 2, 70, { color: '#cfe', size: 9, align: 'center' });
      BC.text(ctx, 'Loops it took: ' + g.meta.loops, BC.W / 2, 96, { color: '#9ab', size: 9, align: 'center' });
      BC.text(ctx, 'Wins: ' + g.meta.wins, BC.W / 2, 110, { color: '#9ab', size: 9, align: 'center' });
      if ((t % 1.0) < 0.6) {
        BC.text(ctx, 'Press Z to go again', BC.W / 2, BC.H - 30, { color: '#fff', size: 9, align: 'center' });
      }
    }
  };
})();
