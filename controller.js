/* Standard Gamepad API input. All actions use the same controls as mouse/keyboard. */
const controller = {
  index:null, id:'', connected:false, active:false, ready:false, previous:[], direction:'', nextRepeat:0,
  focused:null, key:'', context:'', editing:false, memory:new Map(), dirty:true, lastFrame:0,
  buttons:'button,summary,select,input:not([type="hidden"]),a[href],[tabindex]:not([tabindex="-1"])',
  modal(){return document.activeElement?.closest('dialog[open]')||[...document.querySelectorAll('dialog[open]')].at(-1)||null;},
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
    for(const attribute of ['data-counter-pick','data-buy-counter','data-rule-pick','data-tutor-pick','data-library-pick','data-scry-index','data-hand-index','data-creature-id','data-unit-target','data-unit-attack','data-unit-withdraw','data-unit-mana','data-enemy-attacker','data-permanent-id','data-buy-card','data-select-pack','data-camp-token','data-relic','data-camp','data-avatar-choice','data-block-attacker','data-activate-permanent','data-activate-coin','data-chance-choice','data-coin-choice','data-open-pack','data-collection-index'])if(element.hasAttribute(attribute))return`${attribute}:${element.getAttribute(attribute)}`;
    if(element.hasAttribute('data-card-index'))return`draft:${element.dataset.packIndex}:${element.dataset.cardIndex}`;
    return`item:${element.tagName}:${element.getAttribute('href')||element.getAttribute('aria-label')||element.textContent.trim().slice(0,80)}`;
  },
  initial(items){
    const modal=this.modal();
    if(modal)return items.find(element=>element.matches('[data-counter-pick],[data-rule-pick],[data-tutor-pick],[data-library-pick],[data-scry-index],.collection-card,.graveyard-card'))||items.find(element=>element.id==='quit-cancel')||items[0];
    const preferred={ 'start-screen':'#start-button','draft-screen':'[data-open-pack],.draft-option','combat-screen':'[data-hand-index]','journey-screen':'[data-camp-token]','shop-screen':'[data-buy-card]','end-screen':'#endless-button,#restart-button' }[state.screen||'start-screen'];
    return items.find(element=>preferred&&element.matches(preferred))||items[0];
  },
  focus(element){
    if(!this.visible(element))return;
    if(this.focused!==element){this.focused?.classList.remove('controller-focus','controller-editing');this.focused=element;}
    this.key=this.elementKey(element);this.memory.set(this.contextKey(),this.key);element.classList.add('controller-focus');
    element.classList.toggle('controller-editing',this.editing&&element.tagName==='SELECT');
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
  release(){this.active=false;this.editing=false;this.focused?.classList.remove('controller-focus','controller-editing');document.documentElement.classList.remove('controller-mode');this.hints();},
  zone(element){
    if(element.closest('#hand-row'))return'hand';
    if(element.closest('#creature-row,#permanent-row'))return'battlefield';
    if(element.closest('#enemy-board,#blocking-pairs'))return'enemies';
    if(element.closest('#inspector-content'))return'details';
    if(element.closest('.topbar'))return'system';
    if(element.closest('.collection-tools'))return'filters';
    if(element.matches('[data-counter-pick],[data-rule-pick],[data-tutor-pick],[data-library-pick],[data-scry-index],.collection-card,.draft-option,.graveyard-card'))return'cards';
    if(element.closest('.turn-footer,.rule-actions,.scry-actions,.draft-footer,.shop-footer')||element.closest('dialog'))return'actions';
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
    if(this.editing&&this.focused.tagName==='SELECT')return this.changeSelect(direction==='left'||direction==='up'?-1:1);
    const vectors={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};const [vx,vy]=vectors[direction];const box=this.focused.getBoundingClientRect();const x=box.left+box.width/2,y=box.top+box.height/2;
    const ranked=this.candidates().filter(element=>element!==this.focused).map(element=>{const b=element.getBoundingClientRect();const dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;const forward=dx*vx+dy*vy,cross=Math.abs(dx*vy-dy*vx);return{element,forward,score:forward+cross*2.8+(cross>forward*1.5?500:0)};}).filter(item=>item.forward>2).sort((a,b)=>a.score-b.score);
    if(ranked[0])this.focus(ranked[0].element);
  },
  changeSelect(step){
    const select=this.focused;const options=[...select.options];let index=select.selectedIndex;
    for(let n=0;n<options.length;n++){index=(index+step+options.length)%options.length;if(!options[index].disabled&&!options[index].hidden)break;}
    if(index===select.selectedIndex)return;select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));this.dirty=true;this.reconcile();
  },
  activate(){
    this.reconcile();const element=this.focused;if(!this.visible(element))return;
    if(element.tagName==='SELECT'){this.editing=!this.editing;this.focus(element);this.hints();return;}
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
    const selector={'combat-screen':'#end-turn-button','draft-screen':'#draft-confirm','shop-screen':'#shop-continue'}[state.screen];
    const button=selector&&document.querySelector(selector);if(this.visible(button))button.click();this.dirty=true;this.reconcile();
  },
  help(){const dialog=document.querySelector('#controller-dialog');if(dialog.open)dialog.close();else dialog.showModal();this.dirty=true;this.reconcile();},
  hints(){
    const hints=document.querySelector('#controller-hints');const button=document.querySelector('#controller-help-button');
    const ps=/dualsense|dualshock|playstation|sony|054c/i.test(this.id);const text=!this.connected?'Booster Tutor · Fan prototype':!this.active?'Controller connected · press a button':this.editing?'✚ Change option · A / B Finish · changes apply immediately':ps?'✚ Move · ✕ Select · ○ Back · □ Details · △ Continue · L1/R1 Zones · Options Help':'✚ Move · A Select · B Back · X Details · Y Continue · LB/RB Zones · Menu Help';
    if(hints.textContent!==text)hints.textContent=text;
    button.classList.toggle('controller-connected',this.connected);button.title=this.connected?`Controller connected: ${this.id}`:'Controller controls and help';
  },
  scroll(x,y,dt){
    if(Math.max(Math.abs(x),Math.abs(y))<.25||!this.focused)return;
    let parent=this.focused.parentElement;while(parent&&parent!==document.body){const style=getComputedStyle(parent);const sx=/auto|scroll/.test(style.overflowX)&&parent.scrollWidth>parent.clientWidth,sy=/auto|scroll/.test(style.overflowY)&&parent.scrollHeight>parent.clientHeight;if(sx||sy){if(sx)parent.scrollLeft+=x*dt*.6;if(sy)parent.scrollTop+=y*dt*.6;return;}parent=parent.parentElement;}
  },
  frame(now){
    let pads=[];try{pads=[...(navigator.getGamepads?.()||[])].filter(pad=>pad?.connected&&pad.mapping==='standard');}catch{/* Controller API may be disabled by the browser. */}
    const pad=pads.find(pad=>pad.index===this.index)||pads[0];
    if(!pad){if(this.connected){this.connected=false;this.index=null;this.ready=false;this.previous=[];this.release();}this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    if(document.hidden||!document.hasFocus()){this.ready=false;this.previous=[];this.direction='';this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    const pressed=pad.buttons.map(button=>Boolean(button.pressed||button.value>.55));const axes=pad.axes||[];
    if(this.index!==pad.index||!this.connected||this.id!==pad.id){this.index=pad.index;this.id=pad.id;this.connected=true;this.ready=false;this.previous=pressed;this.direction='';this.hints();}
    const neutral=!pressed.some(Boolean)&&axes.slice(0,2).every(value=>Math.abs(value)<.35);
    if(!this.ready){if(neutral)this.ready=true;this.previous=pressed;this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));return;}
    const edge=index=>pressed[index]&&!this.previous[index];
    let direction=pressed[12]?'up':pressed[13]?'down':pressed[14]?'left':pressed[15]?'right':'';
    if(!direction){const x=axes[0]||0,y=axes[1]||0;const threshold=this.direction.startsWith('stick:') ? 0.4 : 0.55;if(Math.max(Math.abs(x),Math.abs(y))>threshold)direction='stick:'+(Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up'));}
    const input=direction||[0,1,2,3,4,5,8,9].some(edge)||Math.max(Math.abs(axes[2]||0),Math.abs(axes[3]||0))>.4;
    if(input)this.enable();
    if(direction){if(direction!==this.direction||now>=this.nextRepeat){this.move(direction.replace('stick:',''));this.nextRepeat=now+(direction===this.direction?155:330);}}else this.nextRepeat=0;
    this.direction=direction;
    if(edge(9))this.help();else if(edge(1))this.back();else if(edge(0))this.activate();else if(edge(2))this.inspect();else if(edge(3))this.advance();else if(edge(4))this.cycleZone(-1);else if(edge(5))this.cycleZone(1);else if(edge(8)&&!this.modal()&&state.deck.length){openCollection('deck');this.dirty=true;}
    if(this.active){this.reconcile();this.scroll(axes[2]||0,axes[3]||0,Math.min(34,now-(this.lastFrame||now)));}
    this.previous=pressed;this.lastFrame=now;requestAnimationFrame(t=>this.frame(t));
  }
};
new MutationObserver(()=>{controller.dirty=true;}).observe(document.querySelector('#game-shell'),{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden','open']});
new MutationObserver(()=>{controller.dirty=true;}).observe(document.body,{childList:true,subtree:false,attributes:false});
for(const dialog of document.querySelectorAll('dialog'))new MutationObserver(()=>{controller.dirty=true;}).observe(dialog,{attributes:true,attributeFilter:['open'],childList:true,subtree:true});
document.querySelector('#controller-help-button').addEventListener('click',()=>controller.help());
document.querySelector('#controller-close').addEventListener('click',()=>{document.querySelector('#controller-dialog').close();controller.dirty=true;});
document.addEventListener('pointerdown',()=>{if(controller.active)controller.release();},true);
document.addEventListener('keydown',()=>{if(controller.active)controller.release();},true);
window.addEventListener('blur',()=>{controller.ready=false;controller.previous=[];controller.direction='';controller.release();});
controller.hints();requestAnimationFrame(now=>controller.frame(now));
