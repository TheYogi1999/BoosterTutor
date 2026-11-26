/* v0.105 — one depth model for physical background cards in both scenes. */
function cardRainProfiles105(seed=1,count=12,sizeScale=1){
 const noise=n=>{const v=Math.sin(n*127.1+seed)*43758.5453;return v-Math.floor(v);};
 const ranks=Array.from({length:count},(_,i)=>i);
 for(let i=count-1;i>0;i--){const j=Math.floor(noise(i+181)*(i+1));[ranks[i],ranks[j]]=[ranks[j],ranks[i]];}
 return ranks.map((rank,i)=>{
  const depth=(rank+.25+noise(i+101)*.5)/count,width=(64+48*depth)*sizeScale;
  const duration=20-8*depth+noise(i+20)*2,flip=4.5+noise(i+93)*6,direction=i%2?1:-1;
  return{index:i,rank,depth,z:-300+340*depth,width,height:width*680/488,layer:rank+1,
   left:3+(i+.5)/count*92+(noise(i+15)-.5)*3,duration,delay:-duration*((i*7%count+noise(i+88)*.7)/count),
   wind:(noise(i+42)-.5)*(60+depth*90),start:-30+noise(i+54)*55,end:direction*(35+noise(i+65)*45),
   flip,flipDelay:-flip*noise(i+121),direction,tilt:-22+noise(i+113)*44,art:noise(i+141)};
 });
}
function createCardRain105({kind='results',seed=1,art=[],sizeScale=1}={}){
 const receipt=kind==='results',rain=document.createElement('div');
 rain.className=`card-rain105 ${receipt?'results-rain86':'title-rain105'}`;
 rain.setAttribute('aria-hidden','true');rain.inert=true;
 rain.dataset.sizeScale105=String(sizeScale);
 rain.style.setProperty('--rain-distance86','calc(var(--scene-height99, 100dvh) + 200px)');
 // DOM order is also back-to-front, in addition to explicit Z and z-index.
 for(const p of cardRainProfiles105(seed,12,sizeScale).sort((a,b)=>a.depth-b.depth)){
  const card=document.createElement('div');card.className=`card-rain-card105 ${receipt?'results-rain-card86':'title-rain-card105'}`;
  card.dataset.depth105=String(p.depth);card.dataset.rank105=String(p.rank);
  card.dataset.baseWidth105=String(p.width/sizeScale);
  card.style.cssText=`left:${p.left}%;width:${p.width}px;height:${p.height}px;z-index:${p.layer};--rain-half-width87:${p.width/2}px;--rain-wind86:${p.wind}px;--rain-start86:${p.start}deg;--rain-end86:${p.end}deg;--rain-depth87:${p.z}px;--rain-alpha86:1;--rain-flip-direction87:${p.direction};--rain-tilt87:${p.tilt}deg;--rain-flip-duration87:${p.flip}s;--rain-flip-delay87:${p.flipDelay}s;animation-duration:${p.duration}s;animation-delay:${p.delay}s`;
  const body=document.createElement('div');body.className=`card-rain-body105 ${receipt?'results-rain-body87':'title-rain-body105'}`;
  const faceCard=art.length?art[Math.floor(p.art*art.length)]:null;
  for(const [side,source] of [['back','assets/mtg-card-back.jpg'],['front',faceCard?.image||'assets/mtg-card-back.jpg']]){
   const face=document.createElement('span');face.className=`card-rain-face105 card-rain-${side}105${receipt?' results-rain-face87 rain-'+side+'87':''}`;
   const image=document.createElement('img');image.src=source;image.alt='';image.draggable=false;face.append(image);body.append(face);
  }
  card.append(body);rain.append(card);
 }
 return rain;
}
function resizeCardRain105(layer,sizeScale){
 if(layer.dataset.sizeScale105===String(sizeScale))return;
 layer.dataset.sizeScale105=String(sizeScale);
 for(const card of layer.children){const width=Number(card.dataset.baseWidth105)*sizeScale;card.style.width=width+'px';card.style.height=width*680/488+'px';card.style.setProperty('--rain-half-width87',width/2+'px');}
}
