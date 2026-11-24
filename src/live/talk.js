'use strict';
// Dialogue: one box along the bottom of the screen, in the manner of the old role-playing games but quicker.
// The speaker's portrait and name sit on the left; the words type themselves out fast. Space, Enter or a click
// finishes the line at once if it is still typing, and otherwise moves on. After the last line the box closes.
//   say([{ who: 'Vishwamitra', face: url, text: '…' }, …], done)   opens it; done() is called when it closes.
//                                                                   A line may also have wait: seconds it must stay up before it can be passed
//                                                                   or choices: [{ text, pick() }, …]: buttons (or keys 1, 2…) shown once it is typed; the
//                                                                   one chosen has its pick() called, and only then does the talk go on
//                                                                   or on(): called as the line comes up, for something to happen with it
//   talking()                                                       true while it is open
//   talkUpdate(dt)                                                  call once a frame
// The box makes its own elements and carries its own styles, so a page needs nothing in its HTML or stylesheet for it.
const TALK = { q: [], i: 0, n: 0, age: 0, held: 0, done: null };
{
  const st = document.createElement('style');
  st.textContent = `
  #talk { position: fixed; left: 50%; bottom: 22px; width: min(780px, calc(100vw - 32px)); box-sizing: border-box; display: flex; gap: 16px; align-items: stretch;
    padding: 16px 20px 16px 16px; color: #fff3df; background: rgba(24, 24, 26, .88); border: none; border-radius: 8px;
    cursor: pointer; user-select: none;
    transform: translate(-50%, 24px); opacity: 0; pointer-events: none; transition: transform .16s ease-out, opacity .16s ease-out; z-index: 20; }
  #talk.on { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
  #talk img { width: 92px; height: 92px; flex: none; border-radius: 6px; object-fit: cover; background: #2a2a2c; }
  #talk img[src=""] { display: none; }
  #talk .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  #talk b { font: 700 15px var(--f, Marcellus, Georgia, serif); letter-spacing: .16em; text-transform: uppercase; color: #ffd08a; }
  #talk p { margin: 0; font: 500 24px/1.32 var(--f, Marcellus, Georgia, serif); min-height: 2.64em; text-shadow: 0 1px 0 rgba(0, 0, 0, .5); }
  #talk p u { text-decoration: none; visibility: hidden; }
  #talk .nx { position: absolute; right: 16px; bottom: 9px; font: 700 12px var(--f, Marcellus, Georgia, serif); letter-spacing: .14em; color: #ffd08a; opacity: 0; }
  #talk.rdy .nx { opacity: .9; animation: talknx .7s ease-in-out infinite; }
  #talk.pick .nx { opacity: 0; animation: none; }
  #talk .ch { display: none; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  #talk.pick .ch { display: flex; }
  #talk .ch button { font: 600 18px var(--f, Marcellus, Georgia, serif); padding: 7px 14px; color: #fff3df; background: rgba(255, 255, 255, .08); border: none; border-radius: 4px; cursor: pointer; }
  #talk .ch button:hover { background: #ffd08a; color: #1a1a1c; }
  #talk .ch button i { font-style: normal; color: #ffd08a; margin-right: 8px; }
  #talk .ch button:hover i { color: #1a1a1c; }
  @keyframes talknx { 50% { transform: translateY(3px); } }`;
  document.head.append(st);
  const el = document.createElement('div');
  el.id = 'talk';
  el.innerHTML = '<img alt="" src=""><div class="tx"><b></b><p><span></span><u></u></p><div class="ch"></div></div><span class="nx">SPACE ▼</span>';
  document.body.append(el);
  TALK.el = el;
  TALK.img = el.querySelector('img');
  TALK.name = el.querySelector('b');
  TALK.shown = el.querySelector('p span');
  TALK.rest = el.querySelector('p u');
  TALK.ch = el.querySelector('.ch');
}
const talking = () => TALK.q.length > 0;
// what is on screen: the part of the line typed so far, and the rest of it present but invisible so the words never jump as they wrap
function talkDraw() {
  const L = TALK.q[TALK.i],
    n = Math.min(L.text.length, Math.floor(TALK.n));
  TALK.shown.textContent = L.text.slice(0, n);
  TALK.rest.textContent = L.text.slice(n);
  const typed = n >= L.text.length && TALK.held >= (L.wait || 0);
  TALK.el.classList.toggle('rdy', typed);
  TALK.el.classList.toggle('pick', typed && !!L.choices);
}
function talkLine() {
  const L = TALK.q[TALK.i];
  TALK.n = TALK.held = 0;
  TALK.name.textContent = L.who || '';
  TALK.img.src = L.face || '';
  if (L.on) L.on();
  TALK.ch.innerHTML = '';
  (L.choices || []).forEach((c, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<i>${i + 1}</i>${c.text}`;
    b.onclick = () => talkPick(i);
    TALK.ch.append(b);
  });
  // a drawn portrait is a cut-out, like a sticker: no box or border behind it
  const cut = (L.face || '').startsWith('data:image/svg');
  TALK.img.style.background = cut ? 'none' : '';
  TALK.img.style.border = cut ? 'none' : '';
  TALK.img.style.boxShadow = cut ? 'none' : '';
  talkDraw();
}
function say(lines, done) {
  TALK.q = lines;
  TALK.i = 0;
  TALK.age = 0;
  TALK.done = done || null;
  talkLine();
  TALK.el.classList.add('on');
}
function talkNext() {
  // a key that was already going down as the box opened does not count
  if (!talking() || TALK.age < 0.25) return;
  const L = TALK.q[TALK.i];
  if (TALK.held < (L.wait || 0)) return;
  if (TALK.n < L.text.length) {
    TALK.n = L.text.length;
    talkDraw();
  } else if (L.choices) return;
  else talkOn();
}
// a choice made: its pick() is called, and the talk goes on
function talkPick(i) {
  const L = TALK.q[TALK.i];
  if (!talking() || !L.choices || !TALK.el.classList.contains('pick') || !L.choices[i]) return;
  L.choices[i].pick();
  talkOn();
}
function talkOn() {
  if (++TALK.i < TALK.q.length) talkLine();
  else {
    const done = TALK.done;
    TALK.q = [];
    TALK.done = null;
    TALK.el.classList.remove('on', 'rdy', 'pick');
    if (done) done();
  }
}
// the words come at about eighty letters a second, with a short breath after a full stop or a comma
function talkUpdate(dt) {
  if (!talking()) return;
  TALK.age += dt;
  const L = TALK.q[TALK.i],
    was = TALK.held;
  TALK.held += dt;
  if (TALK.n >= L.text.length) {
    // a line that had to be waited out shows its prompt once the wait is over
    if (L.wait && was < L.wait && TALK.held >= L.wait) talkDraw();
    return;
  }
  const last = L.text[Math.floor(TALK.n) - 1];
  TALK.n += dt * (last === '.' || last === '?' || last === '!' ? 9 : last === ',' ? 28 : 80);
  talkDraw();
}
addEventListener('keydown', (e) => {
  if (talking() && /^Digit[1-9]$/.test(e.code)) {
    e.preventDefault();
    if (!e.repeat) talkPick(+e.code[5] - 1);
    return;
  }
  if (!talking() || !['Space', 'Enter', 'KeyE', 'KeyF'].includes(e.code)) return;
  e.preventDefault();
  if (!e.repeat) talkNext();
});
addEventListener('pointerdown', (e) => {
  if (talking() && e.button === 0) talkNext();
});

// Instructions: how to do a thing, shown the first time it can be done. They come up in the same place and the same dress as
// the dialogue box, but slimmer, with no portrait, and they stop nothing: the game goes on under them. While someone is
// speaking they stand aside.
//   tip(html)   what to show now (keys written as <kbd>W</kbd>); nothing, to show none. Call it every frame
{
  const st = document.createElement('style');
  st.textContent = `
  #tip { position: fixed; left: 50%; bottom: 22px; max-width: min(780px, calc(100vw - 32px)); box-sizing: border-box; padding: 11px 24px; color: #f1e4cc;
    background: rgba(24, 24, 26, .82); border: none; border-radius: 8px; font: italic 500 21px/1.45 var(--f, Marcellus, Georgia, serif); letter-spacing: .01em; text-align: center;
    user-select: none; pointer-events: none;
    transform: translate(-50%, 24px); opacity: 0; transition: transform .2s ease-out, opacity .2s ease-out; z-index: 19; }
  #tip.on { transform: translate(-50%, 0); opacity: 1; }
  #tip kbd { display: inline-block; min-width: 1.5em; margin: 0 2px; padding: 0 7px; box-sizing: border-box; font: normal 700 14px/1.6 var(--f, Marcellus, Georgia, serif); letter-spacing: .08em;
    color: #ffd08a; background: rgba(255, 255, 255, .1); border: none; border-radius: 5px; text-align: center; vertical-align: 2px; }`;
  document.head.append(st);
  const el = document.createElement('div');
  el.id = 'tip';
  document.body.append(el);
  TALK.tip = el;
}
function tip(html) {
  const show = html && !talking() ? html : '';
  if (show && show !== TALK.tipNow) TALK.tip.innerHTML = TALK.tipNow = show;
  TALK.tip.classList.toggle('on', !!show);
}
