const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;

// Native scroll is the clock. No idle loop or delayed input queue is needed.
export function createProductStory({story, stage, paint, progressBar, chapterLabel}) {
  const chapters = [...story.querySelectorAll('.chapter')];
  const obstacleNodes = [...story.querySelectorAll('.chapters h1,.chapters h2,.chapters .eyebrow,.body-copy,.ingredient-list,.variant-picker,.variant-description,.solid-link,.text-link,.fine-note,.hero-description,.origin-facts,.origin-switcher,.roast-control,.note-explorer,.note-status,.signature-link,.chapter-kicker,.side-description,.intro-description')]; // taste-skill-ignore: measure existing approved labels to prevent product collisions.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let anchors = [], obstacles = [], quietSlots = [], width = 0, height = 0, frame = 0, visible = true, pointer = 0;
  function measure() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    anchors = chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY);
    obstacles = obstacleNodes.filter(node => getComputedStyle(node).display !== 'none').map(node => {
      const rect = node.getBoundingClientRect();
      return {top:rect.top + scrollY, bottom:rect.bottom + scrollY};
    });
    quietSlots = anchors.map(anchor => spaceAt(anchor).slot);
    schedule();
  }
  function spaceAt(y) {
    let bottom = 95, slot = {center:height * .7, height:0};
    const blocks = obstacles.map(rect => ({top:Math.max(95,rect.top-y-18),bottom:Math.min(height-60,rect.bottom-y+18)})).filter(rect => rect.bottom>95 && rect.top<height-60).sort((a,b)=>a.top-b.top);
    for (const block of [...blocks,{top:height-60,bottom:height-60}]) {
      const gap = block.top-bottom;
      if (gap>slot.height) slot={center:bottom+gap/2,height:gap};
      bottom=Math.max(bottom,block.bottom);
    }
    return {blocks, slot};
  }
  function draw() {
    frame = 0;
    if (document.hidden || !anchors.length || !visible) return;
    const y = scrollY;
    let index = 0;
    while (index < anchors.length - 1 && y >= anchors[index + 1]) index++;
    const next = Math.min(index + 1, anchors.length - 1);
    const fraction = next === index ? 0 : clamp((y - anchors[index]) / Math.max(1, anchors[next] - anchors[index]));
    const progress = index + fraction;
    const space = spaceAt(y), blocks = space.blocks;
    let slot = space.slot;
    if (progressBar) progressBar.style.transform = `scaleX(${progress / (chapters.length - 1)})`;
    if (chapterLabel) chapterLabel.textContent = `${String(index + 1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`; // taste-skill-ignore: sequential progress through the four real story chapters.
    const motionReduced = reduced.matches;
    if (motionReduced && width <= 700) {
      // A quiet, fixed product placement yields to passing text instead of travelling with it.
      const quiet = quietSlots[index], center = quiet.center;
      const fixedHeight = Math.min(width * .58, height * .31, quiet.height);
      const free = blocks.every(block => block.bottom <= center - fixedHeight / 2 || block.top >= center + fixedHeight / 2);
      slot = {center, height:free ? fixedHeight : 0};
    }
    paint({progress: motionReduced ? index : progress, index, fraction: motionReduced ? 0 : smooth(fraction), width, height, slot, mobile: width <= 700, landscape: height < 500 && width > 700, reduced: motionReduced, pointer: motionReduced ? 0 : pointer});
    stage.dataset.chapter = String(index + 1);
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  for (const chapter of chapters) resize.observe(chapter);
  for (const obstacle of obstacleNodes) resize.observe(obstacle);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) schedule();
  }, {rootMargin:'100px'});
  intersection.observe(story);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', measure, {passive:true});
  stage.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches) return;
    pointer = clamp(event.clientX / width, 0, 1) - .5;
    schedule();
  }, {passive:true});
  stage.addEventListener('pointerleave', () => { pointer = 0; schedule(); });
  reduced.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  document.fonts.ready.then(measure);
  for (const image of stage.querySelectorAll('img')) {
    image.decode().then(schedule).catch(() => {});
  }
  measure();
  return {invalidate:schedule};
}

export function pose(node, x, y, rotate, scale = 1, opacity = 1) {
  node.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
  node.style.opacity = String(opacity);
}
