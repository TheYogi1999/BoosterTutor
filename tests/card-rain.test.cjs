const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext(fs.readFileSync('card-rain.js','utf8'),c);const profiles=(...args)=>c.cardRainProfiles105(...args);
test('all cards have unique, stratified layers; projected size and Z increase together over 200 seeds',()=>{
 for(let seed=0;seed<200;seed++)for(const scale of [.55,1,1.5]){
  const cards=profiles(seed,12,scale).sort((a,b)=>a.depth-b.depth);
  assert.equal(cards.length,12);assert.equal(new Set(cards.map(p=>p.layer)).size,12);
  for(let i=0;i<cards.length;i++){
   const p=cards[i];assert.ok(p.depth>0&&p.depth<1);assert.ok(p.z>-300&&p.z<40);assert.ok(Math.abs(p.width/p.height-488/680)<1e-10);assert.equal(p.layer,p.rank+1);
   if(i){const far=cards[i-1];assert.ok(p.width>far.width);assert.ok(p.z>far.z);assert.ok(p.layer>far.layer);assert.ok(p.width/(1-p.z/1200)>far.width/(1-far.z/1200));}
  }
 }
});
test('depth is shuffled across horizontal lanes rather than forming a near-to-far diagonal',()=>{
 const cards=profiles(105);assert.ok(cards.some((p,i)=>i&&p.rank<cards[i-1].rank));assert.ok(cards.some((p,i)=>i&&p.rank>cards[i-1].rank));assert.ok(new Set(cards.map(p=>p.left)).size===12);
});
test('falls and flips vary while retaining bounded slow speeds and opaque two-sided dimensions',()=>{
 const cards=profiles(49);for(const p of cards){assert.ok(p.duration>=12&&p.duration<=22);assert.ok(p.flip>=4.5&&p.flip<=10.5);assert.ok(p.delay<=0&&p.delay>=-p.duration);assert.ok(p.flipDelay<=0&&p.flipDelay>=-p.flip);assert.ok(p.direction===1||p.direction===-1);}
 const ordered=[...cards].sort((a,b)=>a.depth-b.depth);assert.ok(ordered[0].duration>ordered.at(-1).duration,'Near cards pass faster than the farthest layer');
});
test('decorative profiles are deterministic and never consume gameplay Math.random',()=>{
 vm.runInContext('Math.random=()=>{throw Error("Gameplay RNG was consumed")}',c);assert.equal(JSON.stringify(profiles(51)),JSON.stringify(profiles(51)));assert.notEqual(JSON.stringify(profiles(51)),JSON.stringify(profiles(52)));
});
