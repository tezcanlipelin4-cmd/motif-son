
const scroller   = document.getElementById('panoScroller');
const panoScene  = document.getElementById('panoScene');
const layerBg    = document.getElementById('layer-bg');
const layerKuzu  = document.getElementById('layer-kuzu');
const layerKoc   = document.getElementById('layer-koc');
const layerNs    = document.getElementById('layer-ns');
const bird       = document.getElementById('bird');
let currentOverlay = null;

// ── Scene sizing ───────────────────────────
// All layers are 7680×1080. Scale to fit 100vh.
function setSceneSize() {
  const scale  = window.innerHeight / 1080;
  const W      = Math.round(7680 * scale);
  panoScene.style.width = W + 'px';
}
setSceneSize();
window.addEventListener('resize', setSceneSize);

// ── Parallax loop ──────────────────────────
// arka plan  → 0.25x speed → offset = s * (1 - 0.25) = s * 0.75
// nesneler   → 0.60x speed → offset = s * (1 - 0.60) = s * 0.40
// kadınlar → 1.00x (no X offset — all layers scroll together, composition intact)
// Parallax = subtle Y breathing driven by scroll velocity
let _prevScrollPara = 0, _yBg = 0, _yNs = 0;
(function parallaxLoop() {
  const s = scroller.scrollLeft;
  const vel = s - _prevScrollPara;
  _prevScrollPara = s;
  // velocity pushes layers; they spring back to 0 when scroll stops
  _yBg = (_yBg + vel * 0.025) * 0.93;
  _yNs = (_yNs + vel * 0.012) * 0.96;
  // clamp so layers never drift more than 28px
  _yBg = Math.max(-28, Math.min(28, _yBg));
  _yNs = Math.max(-14, Math.min(14, _yNs));
  layerBg.style.transform   = `translateY(${_yBg}px)`;
  layerKuzu.style.transform = `translateY(${(_yNs * 0.6).toFixed(2)}px)`;
  layerKoc.style.transform  = `translateY(${(_yNs * 0.8).toFixed(2)}px)`;
  layerNs.style.transform   = `translateY(${_yNs}px)`;
  requestAnimationFrame(parallaxLoop);
})();

// ── Kadın ölçek + hover + press ───────────────────────────────────────────────
const _wCenters = [0.276, 0.416, 0.534, 0.653, 0.811];
const _wLayers  = ['layer-k1','layer-k2','layer-k3','layer-k4','layer-k5']
                    .map(id => document.getElementById(id));
_wLayers.forEach((l,i) => { l.style.transformOrigin = `${_wCenters[i]*100}% 100%`; });
const _wScales = [1,1,1,1,1];
let   _wHover  = -1, _wPress = -1;

function womanHover(idx, entering) {
  _wHover = entering ? idx : -1;
  _wLayers.forEach((l,i) => {
    l.classList.toggle('woman-hov', i === idx && entering);
    if (!entering || i !== idx) l.classList.remove('woman-hov');
  });
}
function womanClick(e, idx, overlayId) {
  e.stopPropagation();
  _wPress = idx;
  _wLayers[idx].classList.remove('woman-hov');
  _wLayers[idx].classList.add('woman-prs');
  setTimeout(() => {
    _wPress = -1;
    _wLayers[idx].classList.remove('woman-prs');
    showOverlay(overlayId);
  }, 150);
}
(function womanScaleLoop() {
  const s  = scroller.scrollLeft;
  const sw = panoScene.offsetWidth || window.innerWidth * 5;
  const vw = window.innerWidth;
  _wLayers.forEach((layer, i) => {
    const wx   = _wCenters[i] * sw - s;
    const dist = Math.abs(wx - vw / 2);
    const prox = Math.max(0, 1 - dist / (vw * 0.65));
    const hov  = (i === _wHover) ? 0.03 : 0;
    const prs  = (i === _wPress) ? -0.07 : 0;
    const tgt  = 1 + prox * 0.045 + hov + prs;
    _wScales[i] += (tgt - _wScales[i]) * 0.09;
    layer.style.transform = `scale(${_wScales[i].toFixed(4)})`;
  });
  requestAnimationFrame(womanScaleLoop);
})();

// ── Bird ──────────────────────────────────
// bird: sprite sheet animasyonu CSS ile çalışıyor
let birdX = window.innerWidth / 2 - 150, prevScroll = 0, smoothVel = 0, birdT = 0;
(function birdLoop() {
  const cur = scroller.scrollLeft;
  const raw = cur - prevScroll; prevScroll = cur;
  smoothVel = smoothVel * 0.88 + raw * 0.12;
  birdX    += smoothVel * 0.38;
  birdX     = Math.max(-160, Math.min(window.innerWidth - 160, birdX));
  birdT    += 0.014;
  const floatY  = Math.sin(birdT) * 12 + Math.sin(birdT * 1.6) * 5;
  const lean    = Math.max(-12, Math.min(12, smoothVel * 0.7));
  bird.style.left      = birdX + 'px';
  bird.style.transform = `scaleX(-1) translateY(${floatY}px) rotate(${lean * 0.3}deg)`;
  requestAnimationFrame(birdLoop);
})();

// ── Hero → Pano ───────────────────────────
function showPanoramic() {
  const hero = document.getElementById('hero');
  const pano = document.getElementById('pano');
  hero.classList.remove('active');
  setTimeout(() => {
    hero.style.display = 'none';
    pano.style.display = 'block';
    requestAnimationFrame(() => pano.classList.add('active'));
  }, 400);
  let scrolled = false;
  const ind = document.getElementById('scrollIndicator');
  scroller.addEventListener('scroll', () => {
    if (!scrolled) { scrolled = true; ind.classList.add('hidden'); }
  }, {passive:true});
}

// ── Mouse drag ────────────────────────────
let isDown=false, startX, scrollLeft0;
scroller.addEventListener('mousedown', e => {
  isDown=true; scroller.style.cursor='grabbing';
  startX=e.pageX-scroller.offsetLeft; scrollLeft0=scroller.scrollLeft;
});
scroller.addEventListener('mouseleave', ()=>{isDown=false;scroller.style.cursor='grab'});
scroller.addEventListener('mouseup',    ()=>{isDown=false;scroller.style.cursor='grab'});
scroller.addEventListener('mousemove',  e=>{
  if(!isDown) return; e.preventDefault();
  scroller.scrollLeft = scrollLeft0-(e.pageX-scroller.offsetLeft-startX)*1.2;
});

// ── Wheel ─────────────────────────────────
document.addEventListener('wheel', e=>{
  if(currentOverlay) return;
  e.preventDefault();
  scroller.scrollLeft += e.deltaY*2.5 + e.deltaX;
}, {passive:false});

// ── Keyboard ──────────────────────────────
document.addEventListener('keydown', e=>{
  if(currentOverlay){ if(e.key==='Escape') closeOverlay(currentOverlay); return; }
  const s=180;
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();scroller.scrollLeft+=s}
  if(e.key==='ArrowLeft' ||e.key==='ArrowUp')  {e.preventDefault();scroller.scrollLeft-=s}
});

// ── Overlays ──────────────────────────────
function showOverlay(id){
  if(currentOverlay) closeOverlay(currentOverlay,true);
  currentOverlay=id;
  const el=document.getElementById(id);
  el.scrollTop=0; el.style.display='block';
  requestAnimationFrame(()=>el.classList.add('open'));
}
function closeOverlay(id,instant){
  const el=document.getElementById(id);
  el.classList.remove('open');
  if(instant) el.style.display='none';
  else setTimeout(()=>el.style.display='none',600);
  if(currentOverlay===id) currentOverlay=null;
}
