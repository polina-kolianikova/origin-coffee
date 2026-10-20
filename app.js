import * as THREE from './assets/vendor/three.module.js';

const origins={
  ethiopia:{country:'Ethiopia',region:'Sidama',altitude:'1,800 to 2,200 m',notes:'Jasmine. Peach. Citrus.',color:'#cd9461',lat:'06° 45′ N'},
  colombia:{country:'Colombia',region:'Huila',altitude:'1,500 to 1,900 m',notes:'Caramel. Orange. Cocoa.',color:'#aeb27c',lat:'02° 32′ N'},
  guatemala:{country:'Guatemala',region:'Antigua',altitude:'1,500 to 1,700 m',notes:'Cocoa. Almond. Red apple.',color:'#c77954',lat:'14° 33′ N'}
};
let selectedOrigin='ethiopia',roast=30;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const roastInput=document.querySelector('#roast-level');
const originButtons=[...document.querySelectorAll('[data-origin]')];
function selectOrigin(key){
  if(!origins[key])return;selectedOrigin=key;const origin=origins[key];
  document.querySelector('#origin-region').textContent=origin.region;document.querySelector('#origin-altitude').textContent=origin.altitude;document.querySelector('#origin-notes').textContent=origin.notes;document.querySelector('#scene-origin').textContent=`${origin.country.toUpperCase()} / ${origin.region.toUpperCase()}`;document.querySelector('.scene-coordinate>span').textContent=origin.lat;
  originButtons.forEach(button=>{const active=button.dataset.origin===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  if(bagLabelMaterial){const old=bagLabelMaterial.map;bagLabelMaterial.map=makeBagLabel();bagLabelMaterial.needsUpdate=true;old.dispose();}updateRecipe();
}
originButtons.forEach(button=>button.addEventListener('click',()=>selectOrigin(button.dataset.origin)));
function updateRoast(){
  roast=Number(roastInput.value);const light=roast<38,medium=roast<72;
  document.querySelector('#roast-label').textContent=light?'LIGHT / 02':medium?'MEDIUM / 03':'DEEP / 04';
  document.querySelector('#roast-description').textContent=light?'Floral aromatics. Bright acidity. A delicate, tea-like body.':medium?'Round sweetness. Soft fruit. A smooth, balanced body.':'Chocolate notes. Gentle acidity. A full, lingering body.';
  document.querySelector('#brightness-bar').style.width=`${90-roast*.7}%`;document.querySelector('#body-bar').style.width=`${24+roast*.68}%`;document.querySelector('#roast-bar').style.width=`${12+roast*.88}%`;
  updateRecipe();
}
roastInput.addEventListener('input',updateRoast);

const brewForm=document.querySelector('#brew-form');
const doseInput=document.querySelector('#coffee-dose');
let recipe;
function updateRecipe(){
  const data=new FormData(brewForm);const dose=Math.round(Number(doseInput.value));
  if(!Number.isFinite(dose)||dose<10||dose>60){document.querySelector('#recipe-status').textContent='Choose a coffee dose from 10 to 60 grams.';return;}
  const ratio=Number(data.get('strength'));const method=data.get('method');const water=dose*ratio;const temp=(roast<38?95:roast<72?92:89)+(method==='frenchpress'?0:method==='aeropress'?-2:0);
  const methodData={pourover:{name:'Pour-over',time:'3:00',grind:'Medium-fine',steps:`Bloom with ${dose*3} ml for 30 seconds. Pour the remaining ${water-dose*3} ml in slow circles. Aim for an even bed.`},frenchpress:{name:'French press',time:'4:00',grind:'Coarse',steps:`Add ${dose} g of coarsely ground coffee. Pour all ${water} ml of water, stir gently and steep for 4 minutes. Press slowly.`},aeropress:{name:'AeroPress',time:'2:00',grind:'Medium-fine',steps:`Use ${dose} g of coffee and ${water} ml of water. Stir, steep for 90 seconds, then press gently for 30 seconds.${water>250?` Divide the coffee and water into ${Math.ceil(water/250)} equal batches to fit your brewer.`:''}`}}[method];
  document.querySelector('#water-amount').textContent=water;document.querySelector('#temperature').textContent=`${temp}°`;document.querySelector('#brew-time').textContent=methodData.time;document.querySelector('#recipe-method').textContent=`${methodData.name.toUpperCase()} / 01`;document.querySelector('#recipe-steps').textContent=methodData.steps;document.querySelector('#recipe-grind').textContent=`${methodData.grind.toUpperCase()} GRIND`;document.querySelector('#recipe-ratio').textContent=`1:${ratio} RATIO`;document.querySelector('#recipe-status').textContent='A small text file. A better tomorrow morning.';
  recipe={dose,water,temp,ratio,method:methodData.name,time:methodData.time,grind:methodData.grind,steps:methodData.steps,origin:origins[selectedOrigin].country,roast:roast<38?'Light':roast<72?'Medium':'Deep'};
}
brewForm.addEventListener('input',updateRecipe);brewForm.addEventListener('change',updateRecipe);
for(const [id,delta] of [['less-coffee',-1],['more-coffee',1]])document.querySelector(`#${id}`).addEventListener('click',()=>{doseInput.value=Math.max(10,Math.min(60,(Number(doseInput.value)||20)+delta));updateRecipe();});
doseInput.addEventListener('blur',()=>{doseInput.value=Math.max(10,Math.min(60,Math.round(Number(doseInput.value)||20)));updateRecipe();});
document.querySelector('#save-recipe').addEventListener('click',()=>{
  if(!brewForm.reportValidity())return;updateRecipe();const r=recipe;
  const text=`ORIGIN / YOUR STARTING POINT\n\n${r.origin}. ${r.roast} roast.\nMethod: ${r.method}\nCoffee: ${r.dose} g\nWater: ${r.water} ml\nRatio: 1:${r.ratio}\nTemperature: ${r.temp} C\nGrind: ${r.grind}\nTime: ${r.time}\n\n${r.steps}\n\nTaste and adjust. A recipe is a starting point.\n\nIndependent coffee brand concept by Polina Koljanikova.\n`;
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`origin-${r.method.toLowerCase().replaceAll(' ','-')}-recipe.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#recipe-status').textContent='Your brew recipe is ready. Here is to a good morning.';
});
updateRoast();

let renderer,scene,camera,bag,bagLabelMaterial,beanGroup,cup,coffeeMaterial,bagMaterial,ready=false,raf=0,visible=true;
let progress=0,pointerX=0,pointerY=0;
const story=document.querySelector('.coffee-story'),canvas=document.querySelector('#coffee-canvas');
const clamp=(value,a=0,b=1)=>Math.max(a,Math.min(b,value));const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};const lerp=(a,b,t)=>a+(b-a)*t;
const poses=[{x:1.9,y:-.05,rx:.02,ry:-.35,rz:-.13,scale:1.28,beans:0,cup:0},{x:-1.65,y:-.08,rx:.02,ry:.24,rz:.09,scale:1.13,beans:.6,cup:0},{x:1.8,y:.05,rx:.08,ry:-.38,rz:-.1,scale:1,beans:1,cup:0},{x:-1.65,y:.15,rx:.04,ry:.2,rz:.03,scale:.35,beans:.2,cup:1}];
function makeBagLabel(){
  const c=document.createElement('canvas');c.width=768;c.height=1024;const ctx=c.getContext('2d');const origin=origins[selectedOrigin];ctx.fillStyle=origin.color;ctx.fillRect(0,0,768,1024);
  let seed=717;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<18000;i++){ctx.fillStyle=`rgba(61,30,20,${rand()*.09})`;ctx.fillRect(rand()*768,rand()*1024,rand()*1.5+.3,rand()*1.5+.3);}
  ctx.fillStyle='#35201c';ctx.textAlign='left';ctx.font='130px Bebas,Impact,sans-serif';ctx.fillText('ORIGIN',65,150);ctx.strokeStyle='#35201c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(65,192);ctx.lineTo(704,192);ctx.stroke();ctx.font='20px DM,sans-serif';ctx.fillText('SPECIALTY COFFEE / FROM THE GROUND UP.',65,230);
  ctx.save();ctx.translate(60,297);ctx.font='180px Bebas,Impact,sans-serif';ctx.scale(.92,1);ctx.fillText('THE GOOD',0,140);ctx.fillText('GROUND.',0,288);ctx.restore();
  ctx.font='27px sans-serif';ctx.fillText(origin.country.toUpperCase(),65,684);ctx.font='22px sans-serif';ctx.fillText(`${origin.region.toUpperCase()} / SINGLE ORIGIN`,65,727);ctx.font='20px sans-serif';ctx.fillText(origin.notes.toUpperCase(),65,794);ctx.strokeStyle='#35201c';ctx.beginPath();ctx.moveTo(65,850);ctx.lineTo(704,850);ctx.stroke();ctx.font='19px sans-serif';ctx.fillText('WHOLE BEAN',65,903);ctx.textAlign='right';ctx.fillText('250 G',704,903);ctx.font='15px sans-serif';ctx.textAlign='left';ctx.fillText('GOOD COFFEE. NO SHORTCUTS.',65,960);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function environment(){const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,'#d7bfa1');g.addColorStop(.5,'#785339');g.addColorStop(1,'#241211');ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);ctx.fillStyle='#fff0d2';ctx.fillRect(120,15,85,330);ctx.fillStyle='#b77148';ctx.fillRect(620,80,180,210);ctx.fillStyle='#fff2de';ctx.fillRect(900,70,45,260);const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.PMREMGenerator(renderer);const env=p.fromEquirectangular(t).texture;t.dispose();p.dispose();return env;}
function createBagGeometry(){
  const g=new THREE.PlaneGeometry(1.72,2.68,44,56);const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);const ny=(y+1.34)/2.68;const edge=Math.pow(Math.abs(x)/.86,5);const taper=1-.18*Math.pow(ny,5)-.06*Math.pow(1-ny,6);pos.setX(i,x*taper);const bulge=.27*Math.sin(ny*Math.PI)*Math.max(0,1-edge);const creases=Math.sin(y*39+x*11)*.008*edge+Math.sin(y*23-x*13)*.006*edge;pos.setZ(i,.19+bulge+creases);}
  g.computeVertexNormals();return g;
}
function createBean(){
  const group=new THREE.Group();const geo=new THREE.SphereGeometry(.25,24,18);const material=new THREE.MeshPhysicalMaterial({color:0x6b3821,roughness:.56,metalness:0,clearcoat:.22,clearcoatRoughness:.45});
  const left=new THREE.Mesh(geo,material),right=new THREE.Mesh(geo,material);left.position.x=-.09;right.position.x=.09;left.scale.set(.56,.84,.72);right.scale.set(.56,.84,.72);left.rotation.z=-.1;right.rotation.z=.1;group.add(left,right);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.19,.125),new THREE.Vector3(.018,-.09,.16),new THREE.Vector3(-.015,.08,.16),new THREE.Vector3(0,.19,.125)]);const groove=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.009,5,false),new THREE.MeshStandardMaterial({color:0x251411,roughness:1}));group.add(groove);group.rotation.z=.3;return group;
}
function build(){
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.setClearColor(0x000000,0);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.set(0,.3,10);scene.environment=environment();
  scene.add(new THREE.HemisphereLight(0xffe7c6,0x371c17,2.3));const key=new THREE.DirectionalLight(0xffe6bf,4);key.position.set(-4,5,6);scene.add(key);const edge=new THREE.DirectionalLight(0xe39459,4);edge.position.set(4,2,-3);scene.add(edge);
  bag=new THREE.Group();scene.add(bag);bagMaterial=new THREE.MeshStandardMaterial({color:0xb77f48,roughness:.78,metalness:.03});bagLabelMaterial=new THREE.MeshStandardMaterial({map:makeBagLabel(),roughness:.85});
  const front=new THREE.Mesh(createBagGeometry(),bagLabelMaterial);bag.add(front);const back=new THREE.Mesh(createBagGeometry(),bagMaterial);back.rotation.y=Math.PI;bag.add(back);
  const sideShape=new THREE.Shape();sideShape.moveTo(-.18,-1.34);sideShape.lineTo(.18,-1.34);sideShape.quadraticCurveTo(.4,0,.23,1.3);sideShape.lineTo(-.23,1.3);sideShape.quadraticCurveTo(-.4,0,-.18,-1.34);const sideGeo=new THREE.ShapeGeometry(sideShape,24);
  for(const direction of [-1,1]){const side=new THREE.Mesh(sideGeo,new THREE.MeshStandardMaterial({color:0x9d673d,roughness:.83,side:THREE.DoubleSide}));side.rotation.y=Math.PI/2;side.position.x=direction*.78;bag.add(side);}
  const seamMat=new THREE.MeshStandardMaterial({color:0xa46d3f,roughness:.85});for(const y of [-1.31,1.31]){const seam=new THREE.Mesh(new THREE.BoxGeometry(y>0?1.44:1.6,.09,.42),seamMat);seam.position.y=y;bag.add(seam);for(let n=0;n<3;n++){const line=new THREE.Mesh(new THREE.BoxGeometry(y>0?1.44:1.6,.006,.005),new THREE.MeshStandardMaterial({color:0x5d3b24,roughness:.9}));line.position.set(0,y-.024+n*.024,.215);bag.add(line);}}
  const valve=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.02,32),new THREE.MeshStandardMaterial({color:0x7b4e2d,roughness:.8}));valve.rotation.x=Math.PI/2;valve.position.set(0,.87,-.4);bag.add(valve);
  beanGroup=new THREE.Group();scene.add(beanGroup);
  for(let i=0;i<22;i++){const bean=createBean();bean.userData={phase:i*.63,x:(Math.sin(i*3.17)*1.5),y:(Math.cos(i*2.39)*1.8),z:Math.sin(i*1.77)*.9};bean.rotation.set(i*.7,i*.9,i*.4);const size=.55+(i%4)*.14;bean.scale.setScalar(size);bean.userData.size=size;beanGroup.add(bean);}
  cup=new THREE.Group();scene.add(cup);const ceramic=new THREE.MeshPhysicalMaterial({color:0xe4cda6,roughness:.3,clearcoat:.65});
  const cupPoints=[[0,0],[.5,0],[.61,.04],[.65,.15],[.78,1.05],[.77,1.12],[.7,1.12],[.65,.98],[.52,.22],[.45,.14],[0,.14]].map(p=>new THREE.Vector2(...p));const cupMesh=new THREE.Mesh(new THREE.LatheGeometry(cupPoints,80),ceramic);cup.add(cupMesh);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.36,.087,18,56,Math.PI*1.7),ceramic);handle.position.set(.78,.62,0);handle.rotation.z=-Math.PI*.85;handle.scale.x=.8;cup.add(handle);
  coffeeMaterial=new THREE.MeshPhysicalMaterial({color:0x3d2114,roughness:.18,metalness:.02,clearcoat:.8});const coffee=new THREE.Mesh(new THREE.CircleGeometry(.688,64),coffeeMaterial);coffee.rotation.x=-Math.PI/2;coffee.position.y=1.04;cup.add(coffee);
  const crema=new THREE.Mesh(new THREE.TorusGeometry(.65,.014,8,64),new THREE.MeshStandardMaterial({color:0xc39358,roughness:.45}));crema.rotation.x=Math.PI/2;crema.position.y=1.045;cup.add(crema);
  const saucer=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.12,.065,64),ceramic);saucer.position.y=-.055;cup.add(saucer);const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.019,8,64),ceramic);ring.rotation.x=Math.PI/2;ring.position.y=-.016;cup.add(ring);
  const decalCanvas=document.createElement('canvas');decalCanvas.width=512;decalCanvas.height=128;const dc=decalCanvas.getContext('2d');dc.fillStyle='#3b241c';dc.textAlign='center';dc.font='bold 79px Impact,sans-serif';dc.fillText('ORIGIN',256,95);const decalTexture=new THREE.CanvasTexture(decalCanvas);decalTexture.colorSpace=THREE.SRGBColorSpace;const decal=new THREE.Mesh(new THREE.PlaneGeometry(.8,.2),new THREE.MeshStandardMaterial({map:decalTexture,transparent:true,roughness:.8,depthWrite:false}));decal.position.set(0,.55,.704);cup.add(decal);
  cup.visible=false;ready=true;document.body.classList.add('webgl');resize();
}
function resize(){if(!ready)return;const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function updateProgress(){const rect=story.getBoundingClientRect();progress=clamp(-rect.top/(story.offsetHeight-innerHeight))*3;document.querySelector('#story-progress').style.width=`${progress/3*100}%`;document.querySelector('#chapter-count').textContent=`0${Math.min(4,Math.floor(progress)+1)} / 04`;}
function render(time){
  raf=requestAnimationFrame(render);if(!ready||!visible||document.hidden)return;const mobile=innerWidth<=700,idle=reduced.matches?0:time*.0004;const index=Math.min(2,Math.floor(progress)),t=smooth(progress-index);const a=poses[index],b=poses[index+1];const beanAmount=lerp(a.beans,b.beans,t),cupAmount=lerp(a.cup,b.cup,t);
  bag.position.set(lerp(a.x,b.x,t),lerp(a.y,b.y,t),0);bag.scale.setScalar(lerp(a.scale,b.scale,t));bag.rotation.set(lerp(a.rx,b.rx,t)+pointerY*.018,lerp(a.ry,b.ry,t)+pointerX*.055,lerp(a.rz,b.rz,t)+Math.sin(idle)*.009);bag.visible=cupAmount<.97;
  if(mobile){const mx=[.42,.66,.46,.25],my=[-1.27,-1.48,-1.62,-1.5],ms=[.78,.64,.59,.28];bag.position.set(lerp(mx[index],mx[index+1],t),lerp(my[index],my[index+1],t),0);bag.scale.setScalar(lerp(ms[index],ms[index+1],t)*(1-cupAmount*.7));bag.rotation.set(.03,-.32,-.1);}
  if(reduced.matches){bag.rotation.set(0,-.2,-.05);if(!mobile){bag.position.set(1.85,0,0);bag.scale.setScalar(1.05*(1-cupAmount*.8));}}
  beanGroup.position.set(mobile?.75:lerp(a.x,b.x,t),mobile?-1.08:0,-.1);
  const roastColor=new THREE.Color().lerpColors(new THREE.Color(0xa36d3c),new THREE.Color(0x351b13),roast/100);
  beanGroup.children.forEach((bean,i)=>{const d=bean.userData;const expand=.7+beanAmount*.8;bean.position.set(d.x*expand,d.y*expand,d.z);bean.rotation.y=i*.9+(reduced.matches?0:Math.sin(idle+d.phase)*.1)+progress*.8;bean.rotation.z=i*.4+beanAmount*.6;bean.scale.setScalar(d.size*beanAmount*(mobile?.62:1));bean.visible=beanAmount>.01&&cupAmount<.95;bean.children.slice(0,2).forEach(half=>half.material.color.copy(roastColor));});
  bagMaterial.color.lerp(new THREE.Color(origins[selectedOrigin].color),.08);
  cup.visible=cupAmount>.01;cup.position.set(mobile?.2:-1.65,mobile?-1.82:-.95,0);cup.scale.setScalar((mobile?.84:1.65)*smooth(cupAmount));cup.rotation.set(.26,-.18+pointerX*.035,0);if(reduced.matches)cup.rotation.set(.26,-.18,0);
  camera.position.x=reduced.matches?0:pointerX*.05;camera.position.y=.3+(reduced.matches?0:pointerY*.025);camera.lookAt(0,0,0);renderer.render(scene,camera);
}
addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',()=>{updateProgress();resize();},{passive:true});addEventListener('pointermove',event=>{if(reduced.matches){pointerX=0;pointerY=0;return;}pointerX=(event.clientX/innerWidth-.5)*2;pointerY=(event.clientY/innerHeight-.5)*2;},{passive:true});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(story);canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;document.body.classList.remove('webgl');cancelAnimationFrame(raf);});
updateProgress();Promise.all([document.fonts.load('100px Bebas'),document.fonts.load('100px DM')]).catch(()=>{}).then(()=>{try{build();raf=requestAnimationFrame(render);}catch(error){canvas.hidden=true;document.body.classList.remove('webgl');console.warn('The coffee illustration is using its static fallback.',error.message);}});
