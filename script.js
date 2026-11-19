'use strict';

const scene = document.querySelector('#scene');
const action = document.querySelector('#action');
const canvas = document.querySelector('#tiara');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const headline = document.querySelector('#headline');
const message = document.querySelector('#message');
const label = document.querySelector('#label');
const stars = document.querySelector('.stars');

for (let i = 0; i < 52; i++) {
  const star = document.createElement('i');
  star.textContent = i % 6 === 0 ? '✦' : '·';
  star.style.left = ((i * 61.803 + 9) % 100) + '%';
  star.style.top = ((i * i * 7.13 + 5) % 91) + '%';
  stars.append(star);
}

let opened = false;
let frame = 0;
let revealTime = 0;
const wires = [];
const crystals = [];
// Model the bands and filigree around an elliptical headband.
function point(angle, height, radius = 1) {
  return [190 * Math.sin(angle) * radius, height, 89 * Math.cos(angle) * radius];
}
function strand(curve, width, steps) {
  let previous = curve(0);
  for (let i = 1; i <= steps; i++) {
    const next = curve(i / steps);
    wires.push({a: previous, b: next, width});
    previous = next;
  }
}
for (const height of [0, 8, 19]) {
  strand(t => point((t - .5) * 5.25, height), height === 8 ? 3 : 6, 100);
}
for (let i = -30; i <= 30; i++) {
  crystals.push({p: point(i * .072, 10, 1.016), w: 3.3, h: 4.3, pink: false});
}
for (let i = -3; i <= 3; i++) {
  const angle = i * .47;
  const height = 146 - Math.abs(i) * 29;
  const width = .248;
  for (const sign of [-1, 1]) {
    strand(t => point(angle + sign * width * Math.sin(Math.PI * t) * (.55 + .85 * (1-t)), 20 + height * t), 4.4, 32);
    strand(t => point(angle + sign * (.015 + .18 * t + .055 * Math.sin(2 * Math.PI * t)), 21 + height * .44 * Math.sin(Math.PI * t)), 2.7, 28);
  }
  crystals.push({p: point(angle, 22 + height * .56, 1.02), w: 9 + height * .045, h: height * .25, pink: true});
  crystals.push({p: point(angle, 24 + height, 1.01), w: 5.8, h: 8, pink: false});
}

function render(time) {
  if (!opened || canvas.hidden) return;
  const w = scene.clientWidth, h = scene.clientHeight;
  const density = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * density) || canvas.height !== Math.round(h * density)) {
    canvas.width = Math.round(w * density);
    canvas.height = Math.round(h * density);
  }
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(w / 475, h / 300);
  const angle = reducedMotion.matches ? -.12 : .62 * Math.sin((time - revealTime) / 1700);
  function project([x, y, z]) {
    const depth = z * Math.cos(angle) - x * Math.sin(angle);
    const factor = scale * 680 / (680 - depth);
    return {x: w / 2 + (x * Math.cos(angle) + z * Math.sin(angle)) * factor,
      y: h * .56 + (54 - y + depth * .24) * factor, z: depth, factor};
  }
  const shapes = wires.map(wire => {
    const a = project(wire.a), b = project(wire.b);
    return {a,b,z:(a.z+b.z)/2,width:wire.width};
  });
  for (const jewel of crystals) {
    const pos = project(jewel.p);
    shapes.push({pos,jewel,z:pos.z + 3});
  }
  shapes.sort((a,b) => a.z-b.z);
  ctx.lineCap = 'round';
  for (const shape of shapes) {
    if (shape.jewel) {
      const {pos,jewel} = shape;
      const dx = jewel.w * pos.factor, dy = jewel.h * pos.factor;
      const rim = [[0,-dy],[dx,-dy*.16],[dx*.66,dy*.59],[0,dy],[-dx*.66,dy*.59],[-dx,-dy*.16]];
      const colors = jewel.pink ? ['#ffe8ee','#d97e9e','#a44c74','#ed9cb7','#fff1ee','#f5bed0'] :
        ['#fffdf1','#ddc7bd','#bda690','#fcecd3','#fff9e3','#ffffff'];
      for (let k=0;k<rim.length;k++) {
        const v=rim[k], next=rim[(k+1)%rim.length];
        ctx.beginPath(); ctx.moveTo(pos.x-dx*.18,pos.y-dy*.23);
        ctx.lineTo(pos.x+v[0],pos.y+v[1]);ctx.lineTo(pos.x+next[0],pos.y+next[1]);
        ctx.closePath();ctx.fillStyle=colors[k];ctx.fill();
      }
    } else {
      const {a,b,width}=shape;
      const shine = .5+.5*Math.sin((a.x/w)*20+shape.z*.024);
      for (const [thickness,color,offset] of [[1,'#79502e',0],[.69,'#e0b171',-.55],[.25,shine>.45?'#fff1c3':'#f0cd90',-1]]) {
        ctx.beginPath();ctx.moveTo(a.x,a.y+offset*scale);ctx.lineTo(b.x,b.y+offset*scale);
        ctx.strokeStyle=color;ctx.lineWidth=width*a.factor*thickness;ctx.stroke();
      }
    }
  }
  if (!reducedMotion.matches) frame=requestAnimationFrame(render);
}
function redraw(){
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(render);
}
window.addEventListener('resize',redraw);
reducedMotion.addEventListener('change',redraw);
action.addEventListener('click',()=>{
  if (action.getAttribute('aria-busy')==='true') return;
  opened=!opened;
  scene.classList.toggle('open',opened);
  if (opened) {
    action.setAttribute('aria-busy','true');
    window.setTimeout(()=>{
      revealTime = performance.now();
      canvas.hidden=false;
      headline.innerHTML='¡Feliz díaaa<br><em>para ti, gordita!</em>';
      message.textContent='Porque eres una princesa en todo el sentido, en el cual, humildemente, tu servidor está feliz de compartir contigo. Con cariño, para la princesa que no pude tener Disney, que es la princesa Antunne, la más bonita. ♡';
      label.textContent='Volver a cerrar la caja';
      action.removeAttribute('aria-busy');
      redraw();
    },reducedMotion.matches?0:900);
  } else {
    cancelAnimationFrame(frame);
    canvas.hidden=true;
    headline.innerHTML='Un regalo<br><em>para ti.</em>';
    message.textContent='Gordita, preparé esta cajita pensando en ti. Toca el botón cuando estés lista. ♡';
    label.textContent='Abrir mi regalo';
  }
});
