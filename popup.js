var COUNT = 25, SPAWN_MS = 120, CANDIDATES = 15;
var LAUGH_SRC = 'img/laugh.mp3';

var popups = [];
var queue = [];
var timer = null;
var laughs = [];
var show = null;

function laugh() {
  var a = new Audio(LAUGH_SRC);
  a.volume = 0.5;
  a.play().catch(function () {});
  laughs.push(a);
}

function hush() {
  laughs.forEach(function (a) { a.pause(); });
  laughs = [];
}

function stopSpawning() {
  clearTimeout(timer);
  timer = null;
  queue = [];
}

function closeAll() {
  stopSpawning();
  var open = popups;
  popups = [];
  open.forEach(function (w) { if (!w.closed) w.close(); });
  hush();
}

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

function scatter() {
  var s = screen, placed = [];
  for (var n = 0; n < COUNT; n++) {
    var w = Math.round(s.availWidth * rand(0.12, 0.28));
    var h = Math.round(s.availHeight * rand(0.12, 0.3));
    var best = null, bestDist = -1;
    for (var k = 0; k < CANDIDATES; k++) {
      var x = rand(0, s.availWidth - w), y = rand(0, s.availHeight - h);
      var cx = (x + w / 2) / s.availWidth, cy = (y + h / 2) / s.availHeight;
      var d = Infinity;
      placed.forEach(function (p) { d = Math.min(d, Math.hypot(cx - p.cx, cy - p.cy)); });
      if (d > bestDist) { bestDist = d; best = { x: x, y: y, w: w, h: h, cx: cx, cy: cy }; }
    }
    placed.push(best);
  }
  return placed;
}

function spawnNext() {
  var spot = queue.shift();
  if (!spot) { timer = null; return; }
  var s = screen;
  var w = window.open('popup.html?seed=' + show.seed + '&t0=' + show.t0, '_blank', [
    'popup',
    'width=' + spot.w,
    'height=' + spot.h,
    'left=' + Math.round(s.availLeft + spot.x),
    'top=' + Math.round(s.availTop + spot.y)
  ].join(','));
  if (!w) {
    // pop-up blocker got us
    stopSpawning();
    document.getElementById('blocked').hidden = false;
    return;
  }
  popups.push(w);
  laugh();
  timer = setTimeout(spawnNext, SPAWN_MS);
}

document.querySelector('.enter').addEventListener('click', function (e) {
  e.preventDefault();
  if (timer || popups.length) return;
  document.getElementById('blocked').hidden = true;
  queue = scatter();
  show = { seed: Math.floor(Math.random() * 2147483647), t0: Date.now() };
  spawnNext();
});

window.addEventListener('message', function (e) {
  if (e.origin !== location.origin) return;
  if (e.data === 'stop') stopSpawning();
  if (e.data === 'close') closeAll();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') stopSpawning();
});
