const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;

// Native scroll is the clock. Mobile photos stay with their own chapter copy.
export function createProductStory({story, stage, paint, progressBar, chapterLabel}) {
  const chapters = [...story.querySelectorAll('.chapter')];
  const mobileFlow = matchMedia('(max-width:700px), (max-width:1000px) and (pointer:coarse)');
  const productFrames = [...story.querySelectorAll('.mobile-product-stage')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let anchors = [], mobileFrames = [], width = 0, height = 0, frame = 0, visible = true, pointer = 0;
  function measure() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    anchors = chapters.map(chapter => chapter.getBoundingClientRect().top + scrollY);
    mobileFrames = productFrames.map(node => {
      const rect = node.getBoundingClientRect();
      return {node, top:rect.top + scrollY, height:rect.height};
    });
    schedule();
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
    if (progressBar) progressBar.style.transform = `scaleX(${progress / Math.max(1, chapters.length - 1)})`;
    if (chapterLabel) chapterLabel.textContent = `${String(index + 1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
    if (mobileFlow.matches) {
      // Reserved frames make toolbar resizing and reverse scroll independent of text layout.
      for (const item of mobileFrames) {
        const journey = clamp((y + innerHeight - item.top) / (innerHeight + item.height));
        item.node.style.setProperty('--product-y', `${reduced.matches ? 0 : (journey - .5) * -32}px`);
        item.node.style.setProperty('--product-turn', `${reduced.matches ? 0 : (journey - .5) * 5}deg`);
      }
      return;
    }
    const motionReduced = reduced.matches;
    paint({progress: motionReduced ? index : progress, index, fraction: motionReduced ? 0 : smooth(fraction), width, height, mobile:false, landscape:height < 500 && width > 700, reduced:motionReduced, pointer:motionReduced ? 0 : pointer});
    stage.dataset.chapter = String(index + 1);
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  for (const chapter of chapters) resize.observe(chapter);
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
  mobileFlow.addEventListener('change', measure);
  document.addEventListener('visibilitychange', schedule);
  document.fonts.ready.then(measure);
  measure();
  return {invalidate:schedule};
}

export function pose(node, x, y, rotate, scale = 1, opacity = 1) {
  node.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
  node.style.opacity = String(opacity);
}
