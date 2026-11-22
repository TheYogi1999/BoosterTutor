/* v0.99 — viewport-sized menus, drafting and travel stops. Combat keeps its own camera. */
(()=>{
 const root=document.documentElement;
 const moveAction=(button,heading)=>{const action=document.createElement('div');action.className='scene-actions99';action.append(button);heading.append(action);};
 const draft=$('#draft-screen');
 draft.querySelector('.draft-footer').prepend(draft.querySelector('.deck-counter'));
 moveAction($('#draft-confirm'),draft.querySelector('.screen-heading'));
 moveAction($('#shop-continue'),$('#shop-screen .shop-heading'));
 moveAction($('#results-continue'),$('#results-screen .results-heading82'));
 const modeHeader=$('#game-modes-dialog .precon-heading71');
 const modeAction=document.createElement('div');modeAction.className='mode-actions99';
 modeAction.append($('#precon-begin'),$('#game-modes-close'));modeHeader.append(modeAction);
 const baseFit=fitGameCanvas;let sceneSize='';
 fitGameCanvas=function(){
  const active=state.screen!=='combat-screen';root.classList.toggle('scene-ui99',active);
  const result=baseFit();
  if(active){
   const v=window.visualViewport,use=v&&Math.abs(v.scale-1)<.01;
   root.style.setProperty('--scene-width99',(use?v.width:innerWidth)+'px');
   root.style.setProperty('--scene-height99',(use?v.height:innerHeight)+'px');
   root.style.setProperty('--scene-left99',(use?v.offsetLeft:0)+'px');
   root.style.setProperty('--scene-top99',(use?v.offsetTop:0)+'px');
   root.style.setProperty('--game-scale','1');
   const size=(use?v.width:innerWidth)+'x'+(use?v.height:innerHeight),resized=sceneSize&&sceneSize!==size;sceneSize=size;
   if(resized&&state.screen==='draft-screen'&&boosterTravel){const revealed=boosterTravel.revealed;cancelBoosterTravel();renderDraft();syncDraftSelection();if(!revealed)animateBoosterOpening();}
  }
  return result;
 };
 const baseDraft=renderDraft;
 const fitPack=()=>{const grid=$('#draft-grid');if(!grid.querySelector('.pack-stage'))return;const fit=Math.max(.2,Math.min(1,(grid.clientHeight-65)/340,(grid.clientWidth-65)/240));draft.style.setProperty('--pack-fit99',String(fit));};
 renderDraft=function(){const result=baseDraft();draft.classList.toggle('scene-sealed99',Boolean(state.boosterSealed));fitPack();return result;};
 new ResizeObserver(fitPack).observe($('#draft-grid'));
 const baseScreen=showScreen;
 showScreen=function(id){
  const changed=id!==state.screen,result=baseScreen(id);
  if(changed){const screen=document.getElementById(id);for(const area of [screen,...screen.querySelectorAll('.scene-scroll99,.draft-grid')])area.scrollTop=0;}
  return result;
 };
 // Preserve the existing handlers, controller button hints and reward timing.
 for(const selector of ['#draft-grid','#shop-screen','#journey-screen','.results-grid82','#end-screen'])document.querySelector(selector)?.classList.add('scene-scroll99');
 window.visualViewport?.addEventListener('resize',()=>fitGameCanvas());
 window.visualViewport?.addEventListener('scroll',()=>fitGameCanvas());
 fitGameCanvas();
})();
