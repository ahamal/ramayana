'use strict';
// Dialogue: one box along the bottom of the screen, in the manner of the old role-playing games but quicker.
// The speaker's portrait and name sit on the left; the words type themselves out fast. Space, Enter or a click
// finishes the line at once if it is still typing, and otherwise moves on. After the last line the box closes.
//   say([{ who: 'Vishwamitra', face: url, text: '…' }, …], done)   opens it; done() is called when it closes.
//                                                                   A line may also have wait: seconds it must stay up before it can be passed
//   talking()                                                       true while it is open
//   talkUpdate(dt)                                                  call once a frame
// The box makes its own elements and carries its own styles, so a page needs nothing in its HTML or stylesheet for it.
const TALK = { q: [], i: 0, n: 0, age: 0, held: 0, done: null };
{
  const st = document.createElement('style');
  st.textContent = `
  #talk { position: fixed; left: 50%; bottom: 22px; width: min(780px, calc(100vw - 32px)); box-sizing: border-box; display: flex; gap: 16px; align-items: stretch;
    padding: 16px 20px 16px 16px; color: #fff3df; background: linear-gradient(#2a1838f2, #170d22f2); border: 2px solid #e9c07a; border-radius: 8px;
    box-shadow: 0 0 0 1px #170d22, 0 0 0 4px rgba(233, 192, 122, .28), 0 14px 40px rgba(0, 0, 0, .55); cursor: pointer; user-select: none;
    transform: translate(-50%, 24px); opacity: 0; pointer-events: none; transition: transform .16s ease-out, opacity .16s ease-out; z-index: 20; }
  #talk.on { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
  #talk img { width: 92px; height: 92px; flex: none; border-radius: 6px; object-fit: cover; background: #2a1a24; border: 2px solid #e9c07a; box-shadow: 0 0 0 1px #170d22; }
  #talk img[src=""] { display: none; }
  #talk .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  #talk b { font: 400 15px Marcellus, serif; letter-spacing: .14em; text-transform: uppercase; color: #ffd08a; }
  #talk p { margin: 0; font: 20px/1.42 Marcellus, Georgia, serif; min-height: 2.84em; text-shadow: 0 1px 0 rgba(0, 0, 0, .5); }
  #talk p u { text-decoration: none; visibility: hidden; }
  #talk .nx { position: absolute; right: 16px; bottom: 9px; font: 12px Marcellus, serif; letter-spacing: .12em; color: #ffd08a; opacity: 0; }
  #talk.rdy .nx { opacity: .9; animation: talknx .7s ease-in-out infinite; }
  @keyframes talknx { 50% { transform: translateY(3px); } }`;
  document.head.append(st);
  const el = document.createElement('div');
  el.id = 'talk';
  el.innerHTML = '<img alt="" src=""><div class="tx"><b></b><p><span></span><u></u></p></div><span class="nx">SPACE ▼</span>';
  document.body.append(el);
  TALK.el = el;
  TALK.img = el.querySelector('img');
  TALK.name = el.querySelector('b');
  TALK.shown = el.querySelector('p span');
  TALK.rest = el.querySelector('p u');
}
const talking = () => TALK.q.length > 0;
// what is on screen: the part of the line typed so far, and the rest of it present but invisible so the words never jump as they wrap
function talkDraw() {
  const L = TALK.q[TALK.i],
    n = Math.min(L.text.length, Math.floor(TALK.n));
  TALK.shown.textContent = L.text.slice(0, n);
  TALK.rest.textContent = L.text.slice(n);
  TALK.el.classList.toggle('rdy', n >= L.text.length && TALK.held >= (L.wait || 0));
}
function talkLine() {
  const L = TALK.q[TALK.i];
  TALK.n = TALK.held = 0;
  TALK.name.textContent = L.who || '';
  TALK.img.src = L.face || '';
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
  } else if (++TALK.i < TALK.q.length) talkLine();
  else {
    const done = TALK.done;
    TALK.q = [];
    TALK.done = null;
    TALK.el.classList.remove('on', 'rdy');
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
  if (!talking() || !['Space', 'Enter', 'KeyE', 'KeyF'].includes(e.code)) return;
  e.preventDefault();
  if (!e.repeat) talkNext();
});
addEventListener('pointerdown', (e) => {
  if (talking() && e.button === 0) talkNext();
});
