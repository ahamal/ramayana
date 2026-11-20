'use strict';
// Level 1: the nights at Siddhashrama. For now only the bare stage: the shared clearing with Rama under the player's control,
// no practice dummies, no target boards and no workshop buttons. Waves, the altar's health and winning and losing go here.

// the shared files call ui() whenever a control changes state; this page has only the weapon bar to keep in step
function ui() {
  $('arrows').style.display = who === 'rama' ? '' : 'none';
}

let shown = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = tick(now);
  heroUpdate(dt);
  shotsUpdate(dt);
  worldUpdate(dt);
  cameraUpdate(dt);
  composer.render();
  // the curtain lifts only once the scene has run for a moment
  if (!shown && T > 0.8) {
    shown = 1;
    $('load').style.opacity = 0;
    setTimeout(() => $('load').remove(), 700);
  }
}
ui();
pickKind(0);
requestAnimationFrame(frame);
window.L = { rama, grunts, summon, state: () => ({ move, firing, shots: shots.length }) };
