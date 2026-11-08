/* Shop specialisations and consumable supplies; all costs use generic mana. */
const SHOP_PACK_TYPES = [
 {id:'mythic',name:'Mythic pack',price:45,symbol:'✦',description:'1 mythic + 6 rare or uncommon cards'},
 {id:'equipment',name:'Equipment pack',price:27,symbol:'⚔',description:'7 Equipment cards'},
 {id:'instant',name:'Instant pack',price:24,symbol:'ϟ',description:'7 Instant cards'},
 {id:'creature',name:'Creature pack',price:24,symbol:'♜',description:'7 Creature cards'}
];
const CAMP_REWARDS = {
 treasure:{name:'Treasure',symbol:'◇',cost:0,description:'Sacrifice: add 1 floating generic mana.'},
 food:{name:'Food',symbol:'◒',cost:2,description:'Pay 2, tap and sacrifice: gain 3 life.'},
 clue:{name:'Clue',symbol:'?',cost:2,description:'Pay 2 and sacrifice: draw 1 card.'}
};
function permanentActionLabel(card){return card.campToken?({treasure:'add 1 floating mana',food:'gain 3 life',clue:'draw 1'}[card.tokenKind]):card.name==='Fountain of Renewal'?'draw 1':'scry 2';}
function campRewardMarkup(){
 const inventory=state.campTokens||[];
 return Object.entries(CAMP_REWARDS).map(([kind,reward])=>`<button data-camp-token="${kind}"><span>${reward.symbol}</span><h3>${reward.name} token</h3><p>${reward.description}</p><small>${inventory.filter(token=>token.kind===kind).length} carried · choose one</small></button>`).join('');
}
function grantCampToken(kind){
 if(!CAMP_REWARDS[kind]||state.screen!=='journey-screen')return false;
 (state.campTokens||=[]).push({id:`supply-${state.nextPermanentId++}`,kind});return true;
}
function deployCampTokens(battle){
 battle.campTokenIds=new Set();
 for(const token of state.campTokens||[]){
  battle.campTokenIds.add(token.id);
  battle.permanents.push({id:`camp-${token.id}`,card:{...CAMP_TOKEN_CARDS[token.kind],campToken:true,tokenKind:token.kind},campTokenId:token.id,isToken:true,attachedTo:null});
 }
}
function syncCampTokens(battle){
 if(!battle?.campTokenIds)return;
 const remaining=new Set(battle.permanents.filter(p=>p.campTokenId).map(p=>p.campTokenId));
 state.campTokens=(state.campTokens||[]).filter(token=>!battle.campTokenIds.has(token.id)||remaining.has(token.id));
 battle.graveyard=battle.graveyard.filter(card=>!card.campToken);
 battle.exile=(battle.exile||[]).filter(card=>!card.campToken);
}
const sourceActivationCost34=permanentActivationCost;
permanentActivationCost=function(card){return card.campToken?CAMP_REWARDS[card.tokenKind]?.cost??null:sourceActivationCost34(card);};
const sourceCanActivate34=canActivatePermanent;
canActivatePermanent=function(permanent,battle=state.battle){
 if(!permanent?.card.campToken)return sourceCanActivate34(permanent,battle);
 if(!battle||battle.interruption||battle.resolutionTask||battle.choice||battle.scry||battle.libraryOrder||!battle.permanents.includes(permanent)||!['main','attack','enemy','blocks','damage'].includes(battle.phase))return false;
 if(permanent.tapped&&['treasure','food'].includes(permanent.card.tokenKind))return false;
 syncMana(battle);return battle.mana>=permanentActivationCost(permanent.card);
};
const sourceActivate34=activatePermanent;
activatePermanent=function(id){
 const b=state.battle,p=b?.permanents.find(p=>p.id===id);
 if(!p?.card.campToken)return sourceActivate34(id);
 if(!canActivatePermanent(p,b)||!payMana(permanentActivationCost(p.card),b))return false;
 b.permanents=b.permanents.filter(unit=>unit!==p);state.campTokens=(state.campTokens||[]).filter(token=>token.id!==p.campTokenId);b.mulliganAvailable=false;
 if(p.card.tokenKind==='treasure')b.floatingMana++;
 if(p.card.tokenKind==='food')state.playerHealth+=3;
 if(p.card.tokenKind==='clue')drawOneCard();
 syncMana(b);addLog(`${p.card.name}: ${CAMP_REWARDS[p.card.tokenKind].description}`);
 if(b.phase!=='complete')renderBattle();playSfx('select');return true;
};
const sourceDescriptions34=effectDescriptions;
effectDescriptions=function(card){
 if(card.campToken)return [CAMP_REWARDS[card.tokenKind].description,'A consumable artifact token. Unspent camp tokens carry between battles. Spent or destroyed tokens are gone for this run.'];
 if(['Disenchant','Naturalize'].includes(card.name))return ['Choose an artifact or enchantment.','Destroy it. Attached bonuses end immediately; creature-only targets are not legal.'];
 return sourceDescriptions34(card);
};
const sourceTargets34=ruleTargetOptions;
ruleTargetOptions=function(kind,battle=state.battle){return kind==='artifact-or-enchantment'?sourceTargets34('permanent',battle).filter(option=>/Artifact|Enchantment/.test(option.card?.type_line||'')):sourceTargets34(kind,battle);};
const sourceResolve34=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const b=state.battle;
 if(effect.kind==='mana'){b.floatingMana=(b.floatingMana||0)+effect.amount;syncMana(b);addLog(`Add ${effect.amount} floating generic mana until turn end.`);return;}
 if(effect.kind==='destroy'&&target?.side==='permanent'){
  const p=b.permanents.find(p=>p.id===target.id);if(!p)return;
  b.permanents=b.permanents.filter(unit=>unit!==p);if(!p.card.campToken)b.graveyard.push(p.card);syncCampTokens(b);refreshPermanentEffects();addLog(`${p.card.name} is destroyed.`);return;
 }
 const result=sourceResolve34(effect,target,context);syncCampTokens(b);return result;
};
const sourceBattleRender34=renderBattle;
renderBattle=function(){syncCampTokens(state.battle);sourceBattleRender34();};
function packCandidates(type,source=state.pool.length?state.pool:BUNDLED_CARDS){
 const unique=[...new Map(playableCards(source).filter(card=>!isLand(card)).map(card=>[card.name,card])).values()];
 if(type==='mythic')return unique.filter(card=>['mythic','rare','uncommon'].includes(card.rarity));
 return unique.filter(card=>type==='equipment'?/\bEquipment\b/.test(card.type_line):type==='instant'?isInstant(card):isCreature(card));
}
function buildShopPack(type){
 const pool=packCandidates(type);if(pool.length<PACK_SIZE)return null;
 if(type==='mythic'){
  const mythic=shuffle(pool.filter(card=>card.rarity==='mythic'))[0];if(!mythic)return null;
  return shuffle([mythic,...shuffle(pool.filter(card=>card.name!==mythic.name)).slice(0,PACK_SIZE-1)]);
 }
 return shuffle(pool).slice(0,PACK_SIZE);
}
const sourceShopRender34=renderShop;
renderShop=function(){
 sourceShopRender34();const shop=state.shop;if(!shop)return;
 if(!shop.packs){const eligible=SHOP_PACK_TYPES.filter(type=>{const pool=packCandidates(type.id);return pool.length>=PACK_SIZE&&(type.id!=='mythic'||pool.some(card=>card.rarity==='mythic'));});shop.packs=shuffle(eligible).slice(0,2).map(type=>({type:type.id,sold:false}));}
 if(shop.packs[shop.selectedPack]?.sold)shop.selectedPack=null;
 const selected=shop.packs[shop.selectedPack],selectedType=SHOP_PACK_TYPES.find(type=>type.id===selected?.type);
 $('#shop-pack').innerHTML=shop.packs.map((offer,index)=>{const type=SHOP_PACK_TYPES.find(t=>t.id===offer.type);return `<button type="button" class="shop-booster-offer${shop.selectedPack===index?' selected':''}" data-pack-type="${type.id}" data-select-pack="${index}" aria-pressed="${shop.selectedPack===index}" ${offer.sold?'disabled':''}><span class="shop-pack-emblem" aria-hidden="true">${type.symbol}</span><span class="shop-pack-copy"><b>${type.name}</b><span>${type.description}</span><small>${offer.sold?'SOLD':`${type.price} coins · 7 cards`}</small></span></button>`;}).join('')+`<button id="shop-pack-confirm" class="primary-button" ${!selectedType||selected.sold||(state.coins||0)<selectedType.price?'disabled':''}>${selectedType?`Buy ${selectedType.name} · ${selectedType.price} coins`:'Choose a pack'}</button>`;

};
function buyShopPack34(index){
 const shop=state.shop,offer=shop?.packs?.[index],type=SHOP_PACK_TYPES.find(t=>t.id===offer?.type);
 if(state.screen!=='shop-screen'||!type||offer.sold||state.boosterInterruption||(state.coins||0)<type.price)return false;
 const cards=buildShopPack(type.id);if(!cards)return false;
 offer.sold=true;state.coins-=type.price;syncCoins();
 if(!beginBoosterInterruption27('shop',null,cards,type.name,type.id)){offer.sold=false;state.coins+=type.price;syncCoins();return false;}
 return true;
}
$('#shop-pack').addEventListener('click',event=>{
 const button=event.target.closest('[data-select-pack]');
 if(button){const index=Number(button.dataset.selectPack);if(state.shop?.packs[index]&&!state.shop.packs[index].sold){state.shop.selectedPack=index;renderShop();}return;}
 if(event.target.closest('#shop-pack-confirm')&&Number.isInteger(state.shop?.selectedPack))buyShopPack34(state.shop.selectedPack);
});
