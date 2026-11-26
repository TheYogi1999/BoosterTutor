/* Standard Gamepad API input. Profiles describe the physical standard-button positions. */
const INPUT_LAYOUTS78={
 xbox:{name:'Xbox',confirm:['A',0],back:['B',1],inspect:['X',2],advance:['Y',3],reroll:['RT',7],left:'LB',right:'RB',deck:'View',help:'Menu'},
 playstation:{name:'PlayStation',confirm:['✕',0],back:['○',1],inspect:['□',2],advance:['△',3],reroll:['R2',7],left:'L1',right:'R1',deck:'Share',help:'Options'},
 nintendo:{name:'Nintendo',confirm:['A',1],back:['B',0],inspect:['Y',2],advance:['X',3],reroll:['ZR',7],left:'L',right:'R',deck:'−',help:'+'},
 keyboard:{name:'Keyboard & mouse'},touch:{name:'Touch'}
};
function detectedPadLayout78(id=''){
 if(/dualsense|dualshock|playstation|sony|054c/i.test(id))return 'playstation';
 if(/nintendo|switch|joy.?con|057e/i.test(id))return 'nintendo';
 return 'xbox';
}
function glyph78(label,profile){
 const face=['A','B','X','Y','✕','○','□','△'].includes(label),color={'A':'green','B':'red','X':'blue','Y':'yellow','✕':'blue','○':'red','□':'pink','△':'green'}[label]||'';
 const spoken={'✕':'Cross','○':'Circle','□':'Square','△':'Triangle','✚':'D-pad','LS':'Left stick','RS':'Right stick','⇧ Tab':'Shift Tab','↑ ↓ ← →':'Arrow keys'}[label]||label;
 return `<span class="input-glyph78 ${face?'input-face78':'input-key78'} input-${profile} input-${color}" role="img" aria-label="${spoken}">${label}</span>`;
}
let savedInput78={};try{savedInput78=JSON.parse(localStorage.getItem('bt-input-settings-v1')||'{}')||{};}catch{}
const controller = {
  profile:Object.hasOwn(INPUT_LAYOUTS78,savedInput78.profile)?savedInput78.profile:'keyboard',autoDetect:savedInput78.autoDetect!==false,hintMarkup:'',
  dialogs:[],
  index:null, id:'', connected:false, active:false, ready:false, previous:[], direction:'', nextRepeat:0,
  focused:null, key:'', context:'', editing:false, memory:new Map(), dirty:true, lastFrame:0,
  buttons:'button,summary,select,input:not([type="hidden"]),a[href],[tabindex]:not([tabindex="-1"])',
  modal(){this.dialogs=this.dialogs.filter(dialog=>dialog.open&&dialog.isConnected);return this.dialogs.at(-1)||document.activeElement?.closest('dialog[open]')||[...document.querySelectorAll('dialog[open]')].at(-1)||null;},
  scope(){return this.modal()||document.querySelector('.screen.active');},
  contextKey(){return this.modal()?.id||`${state.screen||'start-screen'}:${state.screen==='draft-screen'?state.activePack||0:''}`;},
  visible(element){return Boolean(element&&!element.disabled&&!element.closest('[hidden],[inert]')&&element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden');},
  candidates(){
    const scope=this.scope();if(!scope||(state.screen==='draft-screen'&&boosterTravel))return[];
    const roots=this.modal()?[scope]:[scope,document.querySelector('.topbar')];
    return [...new Set(roots.flatMap(root=>root?[...root.querySelectorAll(this.buttons)]:[]))].filter(element=>this.visible(element)&&!element.closest('#card-preview'));
  },
  elementKey(element){
    if(element.id)return`id:${element.id}`;
    const entry=element.closest('.collection-entry')?.querySelector('[data-collection-index]');if(element.tagName==='SUMMARY'&&entry)return`printed:${entry.dataset.collectionIndex}`;
    for(const attribute of ['data-precon-deck','data-precon-card','data-counter-pick','data-upgrade-pick108','data-buy-counter','data-rule-pick','data-tutor-pick','data-library-pick','data-scry-index','data-hand-index','data-creature-id','data-unit-target','data-unit-attack','data-unit-withdraw','data-unit-mana','data-enemy-attacker','data-permanent-id','data-buy-card','data-select-pack','data-camp-token','data-relic','data-camp','data-avatar-choice','data-block-attacker','data-activate-permanent','data-activate-coin','data-chance-choice','data-coin-choice','data-open-pack','data-collection-index'])if(element.hasAttribute(attribute))return`${attribute}:${element.getAttribute(attribute)}`;
    if(element.hasAttribute('data-card-index'))return`draft:${element.dataset.packIndex}:${element.dataset.cardIndex}`;
    return`item:${element.tagName}:${element.getAttribute('href')||element.getAttribute('aria-label')||element.textContent.trim().slice(0,80)}`;
  },
  initial(items){
    const modal=this.modal();
    if(modal)return items.find(element=>element.matches('[data-precon-deck],[data-precon-card],[data-counter-pick],[data-upgrade-pick108],[data-rule-pick],[data-tutor-pick],[data-library-pick],[data-scry-index],.collection-card,.graveyard-card'))||items.find(element=>element.id==='quit-cancel')||items[0];
    const preferred={ 'start-screen':'#start-button','draft-screen':'[data-open-pack],.draft-option','combat-screen':'[data-hand-index]','results-screen':'#results-continue','journey-screen':'[data-camp-token]','shop-screen':'[data-buy-card]','end-screen':'#endless-button,#restart-button' }[state.screen||'start-screen'];
    return items.find(element=>preferred&&element.matches(preferred))||items[0];
  },
  focus(element){
    if(!this.visible(element))return;
    if(this.focused!==element){this.focused?.classList.remove('controller-focus','controller-editing');this.focused=element;}
    this.key=this.elementKey(element);this.memory.set(this.contextKey(),this.key);element.classList.add('controller-focus');
    element.classList.toggle('controller-editing',this.editing&&(element.tagName==='SELECT'||element.matches('input[type="range"]')));
    if(document.activeElement!==element)element.focus({preventScroll:true});
    this.reveal(element);
  },
  reveal(element){
    // Scroll only card lists, never the fixed game canvas or the whole page.
    for(let parent=element.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
      const style=getComputedStyle(parent);const box=parent.getBoundingClientRect();const item=element.getBoundingClientRect();
      const scale=box.width/(parent.offsetWidth||box.width)||1;
      if(/auto|scroll/.test(style.overflowY)&&parent.scrollHeight>parent.clientHeight){if(item.bottom>box.bottom)parent.scrollTop+=(item.bottom-box.bottom+8)/scale;else if(item.top<box.top)parent.scrollTop-=(box.top-item.top+8)/scale;}
      if(/auto|scroll/.test(style.overflowX)&&parent.scrollWidth>parent.clientWidth){if(item.right>box.right)parent.scrollLeft+=(item.right-box.right+8)/scale;else if(item.left<box.left)parent.scrollLeft-=(box.left-item.left+8)/scale;}
    }
  },
  reconcile(){
    if(!this.active)return;
    if(state.screen==='draft-screen'&&boosterTravel){this.dirty=true;return;}
    const context=this.contextKey();if(context!==this.context){this.context=context;this.editing=false;this.key=this.memory.get(context)||'';this.focused?.classList.remove('controller-focus','controller-editing');this.focused=null;this.dirty=true;}
    if(!this.dirty&&this.focused?.isConnected&&this.visible(this.focused))return;
    this.dirty=false;const items=this.candidates();const found=items.find(element=>this.elementKey(element)===this.key);
    this.focus(found||this.initial(items));
  },
  enable(){if(!this.active){this.active=true;document.documentElement.classList.add('controller-mode');this.dirty=true;}this.reconcile();this.hints();},
  release(){this.active=false;this.editing=false;this.ready=false;this.previous=[];this.direction='';this.focused?.classList.remove('controller-focus','controller-editing');document.documentElement.classList.remove('controller-mode');this.hints();},
  zone(element){
    if(element.closest('#hand-row'))return'hand';
    if(element.closest('#creature-row,#permanent-row'))return'battlefield';
    if(element.closest('#enemy-board,#blocking-pairs'))return'enemies';
    if(element.closest('#inspector-content'))return'details';
    if(element.closest('.topbar'))return'system';
    if(element.closest('.collection-tools'))return'filters';
    if(element.matches('[data-precon-deck],[data-precon-card],[data-counter-pick],[data-upgrade-pick108],[data-rule-pick],[data-tutor-pick],[data-library-pick],[data-scry-index],.collection-card,.draft-option,.graveyard-card'))return'cards';
    if(element.closest('.turn-footer,.combat-actions-panel,.graveyard-links,.hand-title-group,.rule-actions,.scry-actions,.draft-footer,.shop-footer')||element.closest('dialog'))return'actions';
    return'menu';
  },
  cycleZone(step){
    this.editing=false;const items=this.candidates();const order=this.modal()?['cards','filters','actions']:state.screen==='combat-screen'?['hand','battlefield','enemies','actions','details','system']:['cards','menu','actions','system'];
    const zones=order.filter(zone=>items.some(element=>this.zone(element)===zone));if(!zones.length)return;
    const current=zones.indexOf(this.zone(this.focused));const index=(current+step+zones.length)%zones.length;
    this.focus(items.find(element=>this.zone(element)===zones[index]));this.hints();
  },
  move(direction){
    this.reconcile();if(!this.focused)return;
    if(this.editing&&(this.focused.tagName==='SELECT'||this.focused.matches('input[type="range"]'))){return this.focused.tagName==='SELECT'?this.changeSelect(direction==='left'||direction==='up'?-1:1):this.changeRange(direction==='left'||direction==='down'?-1:1);}
    const vectors={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};const [vx,vy]=vectors[direction];const box=this.focused.getBoundingClientRect();const x=box.left+box.width/2,y=box.top+box.height/2;
    const ranked=this.candidates().filter(element=>element!==this.focused).map(element=>{const b=element.getBoundingClientRect();const dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;const forward=dx*vx+dy*vy,cross=Math.abs(dx*vy-dy*vx);return{element,forward,score:forward+cross*2.8+(cross>forward*1.5?500:0)};}).filter(item=>item.forward>2).sort((a,b)=>a.score-b.score);
    if(ranked[0])this.focus(ranked[0].element);
  },
  changeSelect(step){
    const select=this.focused;const options=[...select.options];let index=select.selectedIndex;
    for(let n=0;n<options.length;n++){index=(index+step+options.length)%options.length;if(!options[index].disabled&&!options[index].hidden)break;}
    if(index===select.selectedIndex)return;select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));this.dirty=true;this.reconcile();
  },
  changeRange(step){
    const range=this.focused,before=range.value;
    if(step<0)range.stepDown();else range.stepUp();
    if(before!==range.value){range.dispatchEvent(new Event('input',{bubbles:true}));range.dispatchEvent(new Event('change',{bubbles:true}));}
  },
  activate(){
    this.reconcile();const element=this.focused;if(!this.visible(element))return;
    if(element.tagName==='SELECT'||element.matches('input[type="range"]')){this.editing=!this.editing;this.focus(element);this.hints();return;}
    if(element.matches('input[type="checkbox"],input[type="radio"]')){element.click();this.dirty=true;this.reconcile();this.hints();return;}
    if(element.tagName==='INPUT'){element.focus({preventScroll:true});return;}
    element.click();this.dirty=true;this.reconcile();
  },
  back(){
    if(this.editing){this.editing=false;this.focus(this.focused);this.hints();return;}
    const dialog=this.modal();if(dialog){const allowed=dialog.dispatchEvent(new Event('cancel',{cancelable:true}));if(allowed)dialog.close();hideCardPreview();this.dirty=true;this.reconcile();return;}
    if(state.battle?.pendingAttachment){state.battle.pendingAttachment=null;renderBattle();}
    hideCardPreview();this.dirty=true;this.reconcile();
  },
  inspect(){
    this.reconcile();const element=this.focused;if(!element)return;
    if(element.dataset.enemyAttacker){element.dataset.previewOwner='enemy';element.dataset.previewId=element.dataset.enemyAttacker;}
    const card=element.dataset.previewOwner?previewCardFor(element):null;if(card)showCardPreview(card,element);
  },
  advance(){
    if(this.modal()||this.editing)return;
    const selector={'combat-screen':'#end-turn-button','results-screen':'#results-continue','draft-screen':'#draft-confirm','shop-screen':'#shop-continue'}[state.screen];
    const button=selector&&document.querySelector(selector);if(this.visible(button))button.click();this.dirty=true;this.reconcile();
  },
  reroll(){
    if(this.modal()||this.editing||state.screen!=='draft-screen'||boosterTravel)return;
    const button=document.querySelector('#pack-reroll');if(this.visible(button))button.click();this.dirty=true;this.reconcile();
  },
  buttonHints(){
    const layout=INPUT_LAYOUTS78[this.profile];
    for(const [id,action] of [['draft-confirm','advance'],['pack-reroll','reroll'],['end-turn-button','advance'],['shop-continue','advance'],['results-continue','advance']]){
      const button=document.getElementById(id);if(!button)continue;
      const badge=button.querySelector(':scope > .input-action-hint79');
      if(!this.gamepadProfile()){badge?.remove();continue;}
      const signature=this.profile+':'+action;
      if(badge?.dataset.binding===signature)continue;
      badge?.remove();const node=document.createElement('span');node.className='input-action-hint79';node.dataset.binding=signature;
      node.innerHTML=glyph78(layout[action][0],this.profile);button.append(node);
    }
  },
  help(){const dialog=document.querySelector('#controller-dialog');if(dialog.open)dialog.close();else dialog.showModal();this.dirty=true;this.reconcile();},
  gamepadProfile(){return Boolean(INPUT_LAYOUTS78[this.profile].confirm);},
  saveSettings(){try{localStorage.setItem('bt-input-settings-v1',JSON.stringify({profile:this.profile,autoDetect:this.autoDetect}));}catch{}},
  setProfile(profile,automatic=false){
    if(!Object.hasOwn(INPUT_LAYOUTS78,profile)||(!this.autoDetect&&automatic))return;
    if(this.profile!==profile){this.profile=profile;this.editing=false;this.ready=false;this.direction='';if(!this.gamepadProfile())this.release();this.saveSettings();}
    this.hints();
  },
  setAutomatic(enabled){this.autoDetect=Boolean(enabled);this.ready=false;this.direction='';this.saveSettings();this.hints();},
  bindings(){
    const layout=INPUT_LAYOUTS78[this.profile],g=label=>glyph78(label,this.profile);
    if(this.gamepadProfile())return [
      [g('✚')+' / '+g('LS'),'Move selection'],[g(layout.confirm[0]),'Select · play · edit an option'],[g(layout.back[0]),'Back · cancel an unpaid choice'],[g(layout.inspect[0]),'Inspect a card or opponent'],[g(layout.advance[0]),'Continue combat · confirm a pick'],[g(layout.reroll[0]),'Reroll an opened pack · once'],[g(layout.left)+' '+g(layout.right),'Switch hand, battlefield and opponents'],[g(layout.deck),'Open your run deck'],[g(layout.help),'Open these controls'],[g('RS'),'Scroll lists and longer windows']
    ];
    if(this.profile==='touch')return [[g('Tap'),'Select · play · choose a target'],[g('Drag'),'Move a hand card onto the battlefield'],[g('Swipe'),'Scroll card lists'],[g('×'),'Close a window · cancel'],[g('Deck'),'Inspect your run deck'],[g('Options'),'Open settings']];
    return [[g('Click')+' / '+g('Enter'),'Activate the focused button'],[g('Hover'),'Inspect cards and opponents'],[g('Drag'),'Move a hand card onto the battlefield'],[g('Tab')+' '+g('⇧ Tab'),'Move keyboard focus'],[g('Esc'),'Close a window · cancel a drag'],[g('↑ ↓ ← →'),'Change focused lists and sliders'],[g('Wheel'),'Scroll card lists'],[g('Deck'),'Inspect your run deck']];
  },
  hints(){
    const hints=document.querySelector('#controller-hints'),button=document.querySelector('#controller-help-button'),layout=INPUT_LAYOUTS78[this.profile],g=label=>glyph78(label,this.profile);
    let entries=this.gamepadProfile()?[[g('✚'),'Move'],[g(layout.confirm[0]),'Select'],[g(layout.back[0]),'Back'],[g(layout.inspect[0]),'Details'],[g(layout.advance[0]),'Continue'],[g(layout.left)+' '+g(layout.right),'Zones'],[g(layout.help),'Controls']]:this.profile==='touch'?[[g('Tap'),'Select'],[g('Drag'),'Play a card'],[g('Options'),'Controls']]:[[g('Click'),'Select'],[g('Hover'),'Details'],[g('Tab'),'Navigate'],[g('Esc'),'Back']];
    if(this.editing&&this.gamepadProfile())entries=[[g('✚'),'Change value'],[g(layout.confirm[0])+' '+g(layout.back[0]),'Finish editing']];
    const markup=`<span class="input-profile78">${layout.name}</span>`+entries.map(([icon,text])=>`<span class="input-hint78">${icon}<span>${text}</span></span>`).join('');
    if(this.hintMarkup!==markup){hints.innerHTML=markup;this.hintMarkup=markup;}
    this.buttonHints();
    document.documentElement.dataset.inputProfile=this.profile;
    button.classList.toggle('controller-connected',this.connected);button.title=this.connected?`Controller connected: ${this.id}`:'Input settings and controls';
    const select=document.querySelector('#input-layout'),auto=document.querySelector('#input-auto-detect');
    if(select.value!==this.profile)select.value=this.profile;if(select.disabled!==this.autoDetect)select.disabled=this.autoDetect;if(auto.checked!==this.autoDetect)auto.checked=this.autoDetect;
    const status=this.autoDetect?`${layout.name} · automatic · use a device to switch.`:`${layout.name} · manual layout.`;
    const connection=this.connected?` ${INPUT_LAYOUTS78[controllerDevices80.profile(controllerDevices80.raw)].name} controller connected.`:'';
    const statusNode=document.querySelector('#controller-status');if(statusNode.textContent!==status+connection)statusNode.textContent=status+connection;
    const signature=this.profile;if(this.bindingProfile!==signature){this.bindingProfile=signature;document.querySelector('#controller-bindings').innerHTML=this.bindings().map(([icon,text])=>`<div><span class="input-binding-icons78">${icon}</span><span>${text}</span></div>`).join('');
      document.querySelector('#controller-tip').textContent=this.gamepadProfile()?'Attack: select an opponent, then your creature. Select it again to withdraw. Block: select an attacker, then your blockers. Equipment: select it, then its host. Directions change an edited option; confirm or back finishes. Changes apply immediately.':this.profile==='touch'?'Tap an opponent, then your creature to attack. Tap an attacking opponent, then your blockers. Drag cards from your hand to play them. Tap permanents to open their abilities.':'Click an opponent, then your creature to attack. Choose an attacking opponent, then your blockers. Hover cards for details. Click permanents to open their abilities.';
    }
  },
  scroll(x,y,dt){
    if(Math.max(Math.abs(x),Math.abs(y))<.25||!this.focused)return;
    let parent=this.focused.parentElement;while(parent&&parent!==document.body){const style=getComputedStyle(parent);const sx=/auto|scroll/.test(style.overflowX)&&parent.scrollWidth>parent.clientWidth,sy=/auto|scroll/.test(style.overflowY)&&parent.scrollHeight>parent.clientHeight;if(sx||sy){if(sx)parent.scrollLeft+=x*dt*.6;if(sy)parent.scrollTop+=y*dt*.6;return;}parent=parent.parentElement;}
  },
  frame(now){
    controllerDevices80.poll();
    const raw=controllerDevices80.select(this.index);
    controllerDevices80.sample(raw,now);
    if(!raw){if(this.connected){this.connected=false;this.index=null;this.ready=false;this.previous=[];this.release();}this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    if(this.index!==raw.index||!this.connected||this.id!==raw.id){this.index=raw.index;this.id=raw.id;this.connected=true;this.ready=false;this.previous=[];this.direction='';if(controllerDevices80.fresh.includes(raw)&&this.autoDetect)this.setProfile(controllerDevices80.profile(raw),true);this.hints();}
    const pad=controllerDevices80.normalize(raw);
    if(!pad||controllerDevices80.calibration||document.querySelector('#controller-test-dialog').open){this.ready=false;this.previous=[];this.direction='';if(this.active)this.release();this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    if(document.hidden||!document.hasFocus()){this.ready=false;this.previous=[];this.direction='';this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    const pressed=pad.buttons.map(button=>Boolean(button.pressed||button.value>.55));const axes=pad.axes||[];
    const neutral=!pressed.some(Boolean)&&axes.slice(0,4).every(value=>Math.abs(value)<.35);
    if(!this.ready){if(neutral)this.ready=true;this.previous=pressed;this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    const edge=index=>pressed[index]&&!this.previous[index];
    let direction=pressed[12]?'up':pressed[13]?'down':pressed[14]?'left':pressed[15]?'right':'';
    if(!direction){const x=axes[0]||0,y=axes[1]||0;const threshold=this.direction.startsWith('stick:') ? 0.4 : 0.55;if(Math.max(Math.abs(x),Math.abs(y))>threshold)direction='stick:'+(Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up'));}
    const input=direction||[0,1,2,3,4,5,7,8,9].some(edge)||Math.max(Math.abs(axes[2]||0),Math.abs(axes[3]||0))>.55;
    if(input){const previousProfile=this.profile;this.setProfile(controllerDevices80.profile(raw),true);if(this.gamepadProfile())this.enable();if(this.profile!==previousProfile)this.ready=true;}
    if(!this.gamepadProfile()){this.previous=pressed;this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    if(direction){if(direction!==this.direction||now>=this.nextRepeat){this.move(direction.replace('stick:',''));this.nextRepeat=now+(direction===this.direction?155:330);}}else this.nextRepeat=0;
    this.direction=direction;
    const layout=INPUT_LAYOUTS78[this.profile];
    if(edge(9))this.help();else if(edge(layout.back[1]))this.back();else if(edge(layout.confirm[1]))this.activate();else if(edge(layout.inspect[1]))this.inspect();else if(edge(layout.advance[1]))this.advance();else if(edge(layout.reroll[1]))this.reroll();else if(edge(4))this.cycleZone(-1);else if(edge(5))this.cycleZone(1);else if(edge(8)&&!this.modal()&&state.deck.length){openCollection('deck');this.dirty=true;}
    if(this.active){this.reconcile();this.scroll(axes[2]||0,axes[3]||0,Math.min(34,now-(this.lastFrame||now)));}
    this.previous=pressed;this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));
  }
};
// Native dropdowns can temporarily move focus outside the top dialog. Keep the
// actual opening order, so input never leaks into a window underneath it.
const baseShowModal78=HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal=function(...args){const wasOpen=this.open,result=baseShowModal78.apply(this,args);if(!wasOpen){controller.dialogs=controller.dialogs.filter(dialog=>dialog!==this&&dialog.open&&dialog.isConnected);controller.dialogs.push(this);controller.dirty=true;}return result;};
new MutationObserver(()=>{controller.dirty=true;controller.buttonHints();}).observe(document.querySelector('#game-shell'),{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden','open']});
new MutationObserver(()=>{controller.dirty=true;}).observe(document.body,{childList:true,subtree:false,attributes:false});
for(const dialog of document.querySelectorAll('dialog'))new MutationObserver(()=>{controller.dirty=true;}).observe(dialog,{attributes:true,attributeFilter:['open'],childList:true,subtree:true});
document.querySelector('#controller-help-button').addEventListener('click',()=>controller.help());
document.querySelector('#controller-close').addEventListener('click',()=>{document.querySelector('#controller-dialog').close();controller.dirty=true;});
document.querySelector('#input-layout').addEventListener('change',event=>controller.setProfile(event.target.value));
document.querySelector('#input-auto-detect').addEventListener('change',event=>controller.setAutomatic(event.target.checked));
function pointerInput78(event){if(!event.isTrusted)return;if(controller.active)controller.release();controller.setProfile(['touch','pen'].includes(event.pointerType)?'touch':'keyboard',true);}
document.addEventListener('pointerdown',pointerInput78,true);
let previousPointer78=null;
document.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!event.isTrusted)return;const p=previousPointer78;previousPointer78=[event.clientX,event.clientY];if(p&&Math.hypot(event.clientX-p[0],event.clientY-p[1])>3)pointerInput78(event);},true);
document.addEventListener('keydown',event=>{if(!event.isTrusted)return;if(controller.active)controller.release();controller.setProfile('keyboard',true);},true);
window.addEventListener('blur',()=>{controller.ready=false;controller.previous=[];controller.direction='';controller.release();});
controllerDevices80.initialize();controller.hints();requestAnimationFrame(now=>controller.frame(now));
