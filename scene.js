import {createProductStory, mix, pose, smooth} from './product-story.js?v=415f1cf1e54d0d8d36609979c9945057f9a0c0aae5577fb35102793def4ae06c';
const story=document.querySelector('.coffee-story'),stage=document.querySelector('.scene');
const pouch=stage.querySelector('.image-object'),cup=stage.querySelector('.coffee-cup');
const beans=[...stage.querySelectorAll('.coffee-beans img')],title=stage.querySelector('.scene-type');
export function setOrigin(value){if(['ethiopia','colombia','guatemala'].includes(value))stage.dataset.origin=value;}
export function setRoast(value){stage.style.setProperty('--roast-depth',String(Math.max(0,Math.min(100,Number(value)||0))/100));}
const positions=[[.50,.65,5,.90],[.27,.51,-7,1],[.74,.53,8,.84],[.27,.58,-4,.65]];
createProductStory({story,stage,progressBar:document.querySelector('#story-progress'),chapterLabel:document.querySelector('#chapter-count'),paint({progress,index,fraction,width,height,mobile,landscape,reduced,pointer,slot}){
 const a=positions[Math.min(index,3)],b=positions[Math.min(index+1,3)],land=smooth((progress-2.12)/.82);
 const base=mobile?Math.min(width*.68,height*.4):Math.min(width*.35,height*.54);
 pouch.style.width=`${base}px`;cup.style.width=`${mobile?width*.86:Math.min(width*.44,height*.88)}px`;
 let x=mix(a[0],b[0],fraction)*width,y=mix(a[1],b[1],fraction)*height,scale=mix(a[3],b[3],fraction),opacity=1;
 let rotation=reduced?0:mix(a[2],b[2],fraction)+pointer*3;
 if(mobile){x=width*.47;y=slot.center;scale=Math.min(1,slot.height/(base*1.5*.91));opacity=smooth((slot.height-105)/70);rotation=reduced?0:mix(6,-5,smooth(progress/3));}
 if(landscape){x=width*.75;y=height*.59;scale=.82;}
 pose(pouch,x,y,rotation,scale*(1-land*.4),opacity*(1-land));
 const cupWidth=mobile?width*.86:Math.min(width*.44,height*.88),cupScale=mobile?Math.min(1,slot.height/(cupWidth/1.5*.86)):.95;
 pose(cup,mobile?width*.52:landscape?width*.75:width*.27,mobile?slot.center:height*.60,reduced?0:-4+land*4,cupScale*(.82+land*.18),opacity*land);
 title.style.opacity=String(1-smooth(progress/.6));
 const spread=Math.sin(smooth(progress/2.8)*Math.PI);
 beans.forEach((bean,i)=>{
  const angle=i*2.399+progress*.7,radius=(mobile?base*.50:base*.68)*spread;
  const bx=x+Math.cos(angle)*radius,by=y+Math.sin(angle)*radius*.9,endX=mobile?width*.52:width*.27,endY=mobile?slot.center:height*.60;
  pose(bean,mix(bx,endX,land),mix(by,endY,land),i*47+progress*90,(mobile?.6:1)*(1-land*.6),reduced?0:spread*(1-land)*opacity*.9);
 });
}});
document.documentElement.dataset.renderMode='photographic';
