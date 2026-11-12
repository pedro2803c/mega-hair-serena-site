(function () {
"use strict";
var html = document.documentElement;
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
(function intro() {
if (!html.classList.contains("intro-pending")) return;
var el = document.querySelector(".intro");
var opened = false;
function open() {
if (opened) return;
opened = true;
html.classList.add("intro-open");
setTimeout(function () {
html.classList.remove("intro-pending", "intro-open");
if (el) el.remove();
try { sessionStorage.setItem("serena-intro", "1"); } catch (e) {}
}, 1150);
}
setTimeout(open, 2300);
if (el) el.addEventListener("click", open);
window.addEventListener("keydown", open, { once: true });
})();
(function strands() {
var hero = document.querySelector(".hero__section");
var canvas = document.querySelector(".hero__strands");
if (!hero || !canvas || !canvas.getContext) return;
var ctx = canvas.getContext("2d");
var w = 0, h = 0, dpr = 1;
var lines = [];
var mouse = { x: -9999, y: -9999, strength: 0, target: 0 };
var running = false;
var t0 = performance.now();
function rand(a, b) { return a + Math.random() * (b - a); }
function build() {
var count = w < 720 ? 4 : 7;
lines = [];
for (var i = 0; i < count; i++) {
var alpha = rand(0.35, 0.85);
var grad = ctx.createLinearGradient(0, 0, w, 0);
var leftFade = w < 1100 ? 0.0 : 0.28;
grad.addColorStop(0, "rgba(214,168,76,0)");
grad.addColorStop(leftFade, "rgba(214,168,76," + (alpha * 0.18) + ")");
grad.addColorStop(0.62, "rgba(255,236,180," + alpha + ")");
grad.addColorStop(0.88, "rgba(214,168,76," + (alpha * 0.55) + ")");
grad.addColorStop(1, "rgba(214,168,76,0)");
lines.push({
base: rand(0.22, 0.78),
tilt: rand(-0.32, -0.08),
amp: rand(18, 58),
freq: rand(0.0018, 0.0042),
speed: rand(0.00025, 0.0006),
phase: rand(0, Math.PI * 2),
width: rand(0.7, 1.9),
grad: grad,
glint: rand(0, 1),
glintSpeed: rand(0.00004, 0.00009)
});
}
}
function resize() {
dpr = Math.min(window.devicePixelRatio || 1, 2);
w = hero.clientWidth;
h = hero.clientHeight;
canvas.width = Math.round(w * dpr);
canvas.height = Math.round(h * dpr);
canvas.style.width = w + "px";
canvas.style.height = h + "px";
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
build();
}
function yAt(l, x, t) {
var y = h * l.base + l.tilt * (x - w / 2) +
l.amp * Math.sin(x * l.freq + t * l.speed + l.phase) +
l.amp * 0.38 * Math.sin(x * l.freq * 2.3 - t * l.speed * 1.4 + l.phase * 2);
if (mouse.strength > 0.01) {
var dx = x - mouse.x;
var infl = Math.exp(-(dx * dx) / (2 * 170 * 170));
var dy = mouse.y - y;
var near = Math.exp(-(dy * dy) / (2 * 220 * 220));
y += dy * 0.32 * infl * near * mouse.strength;
}
return y;
}
function draw(now) {
var t = now - t0;
mouse.strength += (mouse.target - mouse.strength) * 0.06;
ctx.clearRect(0, 0, w, h);
ctx.globalCompositeOperation = "lighter";
ctx.shadowColor = "rgba(241,212,138,0.75)";
ctx.lineCap = "round";
for (var i = 0; i < lines.length; i++) {
var l = lines[i];
ctx.beginPath();
for (var x = -20; x <= w + 20; x += 10) {
var y = yAt(l, x, t);
if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
}
ctx.strokeStyle = l.grad;
ctx.lineWidth = l.width;
ctx.shadowBlur = 10;
ctx.stroke();
var gxp = ((l.glint + t * l.glintSpeed) % 1) * (w * 0.75) + w * 0.25;
var gyp = yAt(l, gxp, t);
var r = 26;
var g = ctx.createRadialGradient(gxp, gyp, 0, gxp, gyp, r);
g.addColorStop(0, "rgba(255,246,216,0.9)");
g.addColorStop(0.25, "rgba(241,212,138,0.45)");
g.addColorStop(1, "rgba(214,168,76,0)");
ctx.shadowBlur = 0;
ctx.fillStyle = g;
ctx.beginPath();
ctx.arc(gxp, gyp, r, 0, Math.PI * 2);
ctx.fill();
}
ctx.globalCompositeOperation = "source-over";
if (running && !reduce) requestAnimationFrame(draw);
}
function start() {
if (running) return;
running = true;
requestAnimationFrame(draw);
}
hero.addEventListener("pointermove", function (e) {
var r = canvas.getBoundingClientRect();
mouse.x = e.clientX - r.left;
mouse.y = e.clientY - r.top;
mouse.target = 1;
});
hero.addEventListener("pointerleave", function () { mouse.target = 0; });
resize();
var resizeTimer;
window.addEventListener("resize", function () {
clearTimeout(resizeTimer);
resizeTimer = setTimeout(function () { resize(); if (reduce) draw(performance.now()); }, 150);
});
if (reduce) { draw(performance.now()); return; }
if ("IntersectionObserver" in window) {
new IntersectionObserver(function (entries) {
if (entries[0].isIntersecting) start(); else running = false;
}).observe(hero);
} else {
start();
}
})();
(function compare() {
var box = document.querySelector(".compare");
if (!box) return;
var range = box.querySelector(".compare__range");
var hinted = false;
function set(v) { box.style.setProperty("--pos", v + "%"); }
range.addEventListener("input", function () { hinted = true; set(range.value); });
if (reduce || !("IntersectionObserver" in window)) return;
var io = new IntersectionObserver(function (entries) {
if (!entries[0].isIntersecting || hinted) return;
io.disconnect();
var start = performance.now(), dur = 1800;
(function step(now) {
if (hinted) return;
var k = Math.min(1, (now - start) / dur);
var v = 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k);
set(v.toFixed(2));
range.value = Math.round(v);
if (k < 1) requestAnimationFrame(step);
})(start);
}, { threshold: 0.5 });
io.observe(box);
})();
(function reel() {
var video = document.querySelector(".reel__video");
if (!video || reduce || !("IntersectionObserver" in window)) return;
var userPaused = false;
video.addEventListener("pause", function () { if (video.dataset.auto !== "1") userPaused = true; video.dataset.auto = ""; });
video.addEventListener("play", function () { userPaused = false; });
new IntersectionObserver(function (entries) {
var vis = entries[0].isIntersecting;
if (vis && !userPaused) {
var p = video.play();
if (p && p.catch) p.catch(function () {});
} else if (!vis && !video.paused) {
video.dataset.auto = "1";
video.pause();
}
}, { threshold: 0.45 }).observe(video);
})();
(function hairTime() {
var section = document.querySelector("#tempo");
if (!section) return;
var growth = parseFloat(section.getAttribute("data-growth")) || 1;
var now = document.getElementById("hairNow");
var dream = document.getElementById("hairDream");
var nowOut = document.getElementById("hairNowOut");
var dreamOut = document.getElementById("hairDreamOut");
var wait = document.getElementById("hairWait");
var waitUnit = document.getElementById("hairWaitUnit");
var diffEl = document.getElementById("hairDiff");
var yearEl = document.getElementById("hairYear");
var monthsEl = document.getElementById("hairMonths");
var note = document.getElementById("hairNote");
var bars = [];
for (var m = 1; m <= 12; m++) {
var bar = document.createElement("span");
bar.className = "roi__bar";
bar.innerHTML = "<i></i><small>" + m + "</small>";
monthsEl.appendChild(bar);
bars.push(bar);
}
var tweens = new WeakMap();
function animateNumber(el, to, fmt) {
var from = tweens.get(el) || 0;
if (reduce) { el.textContent = fmt(to); tweens.set(el, to); return; }
var start = performance.now(), dur = 450;
(function step(t) {
var k = Math.min(1, (t - start) / dur);
var e = 1 - Math.pow(1 - k, 3);
var v = from + (to - from) * e;
el.textContent = fmt(v);
tweens.set(el, v);
if (k < 1) requestAnimationFrame(step);
})(start);
}
function fill(range) {
var p = (range.value - range.min) / (range.max - range.min) * 100;
range.style.setProperty("--p", p + "%");
}
var oneDec = function (v) { return (Math.round(v * 10) / 10).toLocaleString("pt-BR"); };
var whole = function (v) { return Math.round(v); };
function update(e) {
var a = +now.value, b = +dream.value;
if (b <= a) {
if (e && e.target === now) { b = Math.min(+dream.max, a + 5); dream.value = b; }
else { a = Math.max(+now.min, b - 5); now.value = a; }
}
fill(now); fill(dream);
nowOut.textContent = a + " cm";
dreamOut.textContent = b + " cm";
var diff = b - a;
var months = diff / growth;
if (months >= 12) {
var years = months / 12;
animateNumber(wait, years, oneDec);
waitUnit.textContent = years < 1.05 ? "ano" : "anos";
} else {
animateNumber(wait, Math.ceil(months), whole);
waitUnit.textContent = Math.ceil(months) === 1 ? "mês" : "meses";
}
animateNumber(diffEl, diff, function (v) { return Math.round(v) + " cm"; });
var yearGrowth = Math.min(diff, 12 * growth);
yearEl.textContent = "+" + Math.round(yearGrowth) + " cm";
bars.forEach(function (bar, i) {
var grown = growth * (i + 1);
bar.style.setProperty("--h", Math.max(6, Math.min(100, grown / diff * 100)) + "%");
bar.classList.toggle("is-paid", grown >= diff);
bar.classList.toggle("is-payback", Math.ceil(months) === i + 1);
});
var pct = Math.min(100, Math.round(12 * growth / diff * 100));
note.textContent = pct >= 100
? "Mesmo assim seriam " + Math.ceil(months) + " meses de espera. No salão, é no mesmo dia."
: "Em 1 ano você teria só " + pct + "% do comprimento que deseja";
}
now.addEventListener("input", update);
dream.addEventListener("input", update);
update();
})();
})();
