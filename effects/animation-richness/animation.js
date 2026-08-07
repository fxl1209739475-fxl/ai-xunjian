window.__timelines = window.__timelines || {};

const tl = gsap.timeline({paused: true});
const scenes = [
  ["#scene-panels", 0, 5.5],
  ["#scene-tunnel", 5.5, 11],
  ["#scene-merge", 11, 16.5],
  ["#scene-pressure", 16.5, 22],
  ["#scene-fork", 22, 27.5],
  ["#scene-ripple", 27.5, 33]
];

function showScene(selector, start, end) {
  tl.set(selector, {autoAlpha: 1}, start);
  tl.to(selector, {autoAlpha: 0, duration: .2, ease: "power2.in"}, end - .2);
  tl.set(selector, {autoAlpha: 0}, end);
}

scenes.forEach(([selector, start, end]) => showScene(selector, start, end));

// 01: Four independent comic panels collide into one compound capability.
tl.from("#scene-panels .scene-code", {opacity: 0, y: -20, duration: .25}, .05);
tl.from("#scene-panels .panel-title", {x: -920, skewX: -8, duration: .58, ease: "expo.out"}, .12);
tl.from("#scene-panels .panel-title em", {x: 1040, duration: .62, ease: "expo.out"}, .34);
tl.from("#scene-panels .panel-a", {x: -680, y: -240, rotation: -18, duration: .62, ease: "back.out(1.25)"}, .72);
tl.from("#scene-panels .panel-b", {x: 680, y: -240, rotation: 18, duration: .62, ease: "back.out(1.25)"}, .94);
tl.from("#scene-panels .panel-c", {x: -680, y: 260, rotation: -16, duration: .62, ease: "back.out(1.25)"}, 1.16);
tl.from("#scene-panels .panel-d", {x: 680, y: 260, rotation: 16, duration: .62, ease: "back.out(1.25)"}, 1.38);
tl.from("#scene-panels .comic-panel b", {scale: .25, opacity: 0, stagger: .1, duration: .35, ease: "back.out(2.5)"}, 1.58);
tl.from("#scene-panels .panel-flash", {scaleY: 0, stagger: .08, duration: .28, ease: "power3.out"}, 2.02);
tl.from("#scene-panels .panel-core", {scale: 2.4, rotation: 16, opacity: 0, duration: .42, ease: "power4.in"}, 2.26);
tl.to("#scene-panels .panel-core", {rotation: -3, duration: .18, ease: "back.out(3)"}, 2.68);
tl.to("#scene-panels .comic-panel", {scale: .94, stagger: .04, duration: .15, yoyo: true, repeat: 1}, 2.72);
tl.from("#scene-panels .panel-verdict>*", {y: 80, opacity: 0, stagger: .12, duration: .36, ease: "back.out(2)"}, 3.28);
tl.from("#scene-panels .h-left", {x: -320, rotation: -25, opacity: 0, duration: .65, ease: "expo.out"}, 3.45);

// 02: The easy section crosses the tunnel quickly; the expensive section hits gates.
tl.from("#scene-tunnel .scene-code", {opacity: 0, y: -20, duration: .25}, 5.55);
tl.from("#scene-tunnel .tunnel-title", {x: -980, duration: .58, ease: "expo.out"}, 5.62);
tl.from("#scene-tunnel .tunnel-title em", {scaleX: .15, transformOrigin: "left", duration: .42, ease: "back.out(1.9)"}, 5.92);
tl.from("#scene-tunnel .tunnel-lines path", {strokeDasharray: 1500, strokeDashoffset: 1500, stagger: .025, duration: .72, ease: "power2.out"}, 6.18);
tl.fromTo("#scene-tunnel .fast-chip", {x: -300, y: 280, scale: .35, opacity: 0}, {x: 360, y: -400, scale: 1, opacity: 1, duration: .78, ease: "expo.out"}, 6.45);
tl.from("#scene-tunnel .opportunity-stack span", {x: -520, opacity: 0, stagger: .12, duration: .38, ease: "power3.out"}, 6.72);
tl.fromTo("#scene-tunnel .slow-chip", {x: -300, y: 430, scale: .4, opacity: 0}, {x: 0, y: 0, scale: 1, opacity: 1, duration: .82, ease: "power3.out"}, 7.16);
tl.from("#scene-tunnel .cost-gate", {scale: 2, opacity: 0, stagger: .28, duration: .28, ease: "power4.in"}, 7.72);
tl.to("#scene-tunnel .slow-chip", {x: -34, duration: .11, yoyo: true, repeat: 7, ease: "none"}, 8.18);
tl.to("#scene-tunnel .speed-lines", {x: 420, duration: .72, ease: "expo.out"}, 8.34);
tl.from("#scene-tunnel .tunnel-verdict", {y: 130, opacity: 0, duration: .45, ease: "expo.out"}, 9.05);
tl.from("#scene-tunnel .tunnel-verdict b", {color: "#ffffff", backgroundColor: "#f5b93d", duration: .26}, 9.42);

// 03: Four orbiting disciplines are pulled into a single center.
tl.from("#scene-merge .scene-code", {opacity: 0, y: -20, duration: .25}, 11.05);
tl.from("#scene-merge .merge-title", {y: -110, opacity: 0, duration: .5, ease: "expo.out"}, 11.12);
tl.from("#scene-merge .merge-title em", {x: -760, duration: .55, ease: "expo.out"}, 11.38);
tl.from("#scene-merge .merge-ghost", {scale: .75, rotation: -14, opacity: 0, duration: .75, ease: "power3.out"}, 11.52);
tl.from("#scene-merge .merge-paths .mp", {strokeDasharray: 520, strokeDashoffset: 520, stagger: .08, duration: .8, ease: "power2.out"}, 11.82);
tl.from("#scene-merge .merge-orb", {opacity: 0, scale: .25, rotation: 18, stagger: .16, duration: .46, ease: "back.out(2.2)"}, 12.08);
tl.to("#scene-merge .mo1", {x: 205, y: 205, scale: .58, duration: .68, ease: "power3.in"}, 12.92);
tl.to("#scene-merge .mo2", {x: -205, y: 205, scale: .58, duration: .68, ease: "power3.in"}, 12.98);
tl.to("#scene-merge .mo3", {x: 205, y: -205, scale: .58, duration: .68, ease: "power3.in"}, 13.04);
tl.to("#scene-merge .mo4", {x: -205, y: -205, scale: .58, duration: .68, ease: "power3.in"}, 13.1);
tl.from("#scene-merge .merge-core", {opacity: 0, scale: .1, rotation: -22, duration: .44, ease: "back.out(2.8)"}, 13.48);
tl.fromTo("#scene-merge .merge-ring", {opacity: .9, scale: .15, transformOrigin: "center"}, {opacity: 0, scale: 1.45, stagger: .12, duration: .75, ease: "power2.out"}, 13.62);
tl.to("#scene-merge .merge-core", {scale: 1.08, duration: .24, yoyo: true, repeat: 1, ease: "sine.inOut"}, 14.05);
tl.from("#scene-merge .merge-formula", {y: 110, opacity: 0, duration: .44, ease: "back.out(1.8)"}, 14.42);

// 04: Tokens arrive faster than the fixed intake can process them.
tl.from("#scene-pressure .scene-code", {opacity: 0, y: -20, duration: .25}, 16.55);
tl.from("#scene-pressure .pressure-title", {x: -940, duration: .56, ease: "expo.out"}, 16.62);
tl.from("#scene-pressure .pressure-title em", {scaleX: .15, transformOrigin: "left", duration: .42, ease: "back.out(1.8)"}, 16.92);
tl.from("#scene-pressure .pressure-slot", {x: 360, scale: .7, duration: .55, ease: "back.out(1.7)"}, 17.18);
document.querySelectorAll("#scene-pressure .pressure-token").forEach((token, index) => {
  const at = 17.38 + index * .12;
  const targetX = 570 - (index % 3) * 45;
  tl.to(token, {x: targetX, rotation: [-3, 2, -2][index % 3], duration: .5, ease: "power3.in"}, at);
  tl.to(token, {x: targetX - 45 - (index % 2) * 24, duration: .22, ease: "back.out(3)"}, at + .5);
});
tl.fromTo("#scene-pressure .shock-ring", {opacity: .88, scale: .15}, {opacity: 0, scale: 1.4, stagger: .12, duration: .68, ease: "power2.out"}, 18.52);
tl.to("#scene-pressure .pressure-slot", {x: 16, rotation: 1.4, duration: .08, yoyo: true, repeat: 8, ease: "none"}, 18.62);
tl.from("#scene-pressure .pressure-meter>*", {y: 70, opacity: 0, stagger: .1, duration: .32, ease: "back.out(2)"}, 19.04);
tl.from("#scene-pressure .pressure-meter i", {scaleX: 0, duration: .75, ease: "power2.out"}, 19.26);
tl.from("#scene-pressure .pressure-stamp", {scale: 2.5, rotation: 14, opacity: 0, duration: .28, ease: "power4.in"}, 19.82);
tl.to("#scene-pressure .pressure-stamp", {rotation: -5, duration: .16, ease: "back.out(3)"}, 20.1);

// 05: The runner chooses the launch-and-learn branch.
tl.from("#scene-fork .scene-code", {opacity: 0, y: -20, duration: .25}, 22.05);
tl.from("#scene-fork .fork-title", {x: -940, duration: .56, ease: "expo.out"}, 22.12);
tl.from("#scene-fork .fork-title em", {x: 980, duration: .58, ease: "expo.out"}, 22.38);
tl.from("#scene-fork .road-base", {strokeDasharray: 2200, strokeDashoffset: 2200, stagger: .08, duration: .88, ease: "power2.out"}, 22.68);
tl.from("#scene-fork .fork-start", {scale: .15, opacity: 0, duration: .42, ease: "back.out(2.6)"}, 22.82);
tl.from("#scene-fork .fork-loop span", {x: -360, opacity: 0, stagger: .12, duration: .38, ease: "power3.out"}, 23.18);
tl.from("#scene-fork .fork-launch span", {x: 360, opacity: 0, stagger: .12, duration: .38, ease: "power3.out"}, 23.28);
tl.to("#scene-fork .road-live", {strokeDashoffset: 0, duration: 1.28, ease: "power2.inOut"}, 23.52);
tl.to("#scene-fork .fork-runner", {x: 332, y: -660, rotation: 54, duration: 1.28, ease: "power2.inOut"}, 23.52);
tl.from("#scene-fork .fork-result.bad", {scale: .35, rotation: -18, opacity: 0, duration: .38, ease: "back.out(2)"}, 24.42);
tl.from("#scene-fork .fork-result.good", {scale: .35, rotation: 18, opacity: 0, duration: .38, ease: "back.out(2)"}, 24.76);
tl.to("#scene-fork .fork-result.good", {scale: 1.08, duration: .22, yoyo: true, repeat: 1}, 25.06);
tl.from("#scene-fork .fork-verdict", {y: 120, opacity: 0, duration: .44, ease: "expo.out"}, 25.34);

// 06: A single action propagates and then returns as feedback.
tl.from("#scene-ripple .scene-code, #scene-ripple .registration-mark", {opacity: 0, y: -20, stagger: .05, duration: .25}, 27.55);
tl.from("#scene-ripple .ripple-title", {x: -940, duration: .56, ease: "expo.out"}, 27.62);
tl.from("#scene-ripple .ripple-title em", {scaleX: .15, transformOrigin: "left", duration: .42, ease: "back.out(1.8)"}, 27.92);
tl.from("#scene-ripple .ripple-core", {scale: .08, opacity: 0, rotation: -18, duration: .46, ease: "back.out(2.7)"}, 28.22);
tl.fromTo("#scene-ripple .wave", {opacity: .9, scale: .12, transformOrigin: "center"}, {opacity: 0, scale: 1.35, stagger: .16, duration: .82, ease: "power2.out"}, 28.58);
tl.from("#scene-ripple .feedback-line", {strokeDasharray: 620, strokeDashoffset: 620, stagger: .1, duration: .72, ease: "power2.out"}, 28.78);
tl.from("#scene-ripple .ripple-node", {opacity: 0, scale: .25, rotation: 12, stagger: .16, duration: .42, ease: "back.out(2.2)"}, 29.08);
tl.to("#scene-ripple .ripple-node", {scale: 1.07, stagger: .08, duration: .18, yoyo: true, repeat: 1}, 29.82);
tl.from("#scene-ripple .feedback-chip", {opacity: 0, scale: 1.8, rotation: 8, duration: .28, ease: "power4.in"}, 30.18);
tl.to("#scene-ripple .ripple-core", {rotation: 360, duration: .82, ease: "power3.inOut"}, 30.34);
tl.from("#scene-ripple .ripple-formula>*", {y: 100, opacity: 0, stagger: .1, duration: .34, ease: "back.out(2)"}, 30.62);
tl.to("#scene-ripple .ripple-formula b", {scale: 1.08, duration: .22, yoyo: true, repeat: 1}, 31.32);

window.__timelines.main = tl;

const params = new URLSearchParams(window.location.search);
if (params.get("autoplay") === "1") {
  const start = Math.max(0, Math.min(32.9, Number(params.get("start") || 0)));
  tl.repeat(-1).play(start);
}
