// One submitted frame per invalidation. No idle animation loop.
export function createRenderControl({renderer,canvas,story,paint,onResize,maxDpr=1.4,desktopBudget=2200000,mobileBudget=950000}) {
  const data=document.documentElement.dataset;
  let queued=0,frames=0,visible=true,quality=1,disposed=false,lastTime=0,samples=[];
  function metrics(mode){data.renderFrames=String(frames);data.drawCalls=String(renderer.info.render.calls);data.triangles=String(renderer.info.render.triangles);data.renderDpr=renderer.getPixelRatio().toFixed(2);data.renderMode=mode;}
  function stop(mode){if(queued)cancelAnimationFrame(queued);queued=0;metrics(mode);}
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;const budget=innerWidth<701?mobileBudget:desktopBudget;const dpr=Math.max(.85,Math.min(devicePixelRatio,maxDpr,Math.sqrt(budget/(w*h)))*quality);renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);onResize(w,h);invalidate();}
  function draw(now){queued=0;if(disposed)return;if(document.hidden){stop('hidden');return;}if(!visible){stop('offscreen');return;}const start=performance.now();paint(now);frames++;const submitted=performance.now()-start,interval=now-lastTime;lastTime=now;if(interval>250)samples=[];if(frames>10&&interval<100)samples.push(submitted);if(samples.length>20)samples.shift();if(samples.length===20&&samples.filter(ms=>ms>28).length>=15&&quality>.78){quality=Math.max(.78,quality-.1);samples=[];resize();}metrics(queued?'active':'idle');}
  function invalidate(){if(disposed)return;if(document.hidden){stop('hidden');return;}if(!visible){stop('offscreen');return;}if(!queued){data.renderMode='active';queued=requestAnimationFrame(draw);}}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();else stop('offscreen');});observer.observe(story);
  const visibility=()=>document.hidden?stop('hidden'):invalidate();document.addEventListener('visibilitychange',visibility);addEventListener('resize',resize,{passive:true});addEventListener('pageshow',invalidate);addEventListener('pagehide',()=>stop('hidden'));
  metrics('idle');resize();
  return {invalidate,resize,dispose(){disposed=true;stop('idle');observer.disconnect();document.removeEventListener('visibilitychange',visibility);removeEventListener('resize',resize);}};
}
