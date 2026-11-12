/* Monsters are individual duel opponents: ten poison counters defeat one foe. */
for(const name of ['Glistener Elf','Plague Stinger','Plague Myr','Bilious Skulldweller'])SPECIAL_CREATURES.add(name);
SUPPORTED_KEYWORDS.push('infect','toxic');
SPELL_RULES['Prologue to Phyresis']={effects:[{kind:'poison-all',amount:1},{kind:'draw',amount:1}]};
SPELL_RULES['Infectious Inquiry']={effects:[{kind:'draw',amount:2},{kind:'lose-life',amount:2},{kind:'poison-all',amount:1}]};
const basePoisonKeywords60=creatureKeywords;
creatureKeywords=function(card){
 const result=basePoisonKeywords60(card),text=card.oracle_text||'';
 result.infect=hasKeywordLine(text.replace(/\([^)]*\)/g,''),'infect');
 result.toxic=(Number(text.match(/\bToxic\s+(\d+)/i)?.[1])||0)+(typeof activeRunCounters60==='function'?activeRunCounters60(card):[]).filter(kind=>kind==='toxic').length;
 return result;
};
const basePoisonLabels60=creatureKeywordLabels;
creatureKeywordLabels=function(unit){return [basePoisonLabels60(unit),unit?.infect?'Infect':'',unit?.toxic?`Toxic ${unit.toxic}`:''].filter(Boolean).join(' · ');};
const basePoisonEffects60=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return ['Glistener Elf','Plague Stinger','Plague Myr','Bilious Skulldweller'].includes(card.name)?[]:basePoisonEffects60(card,creature);};
function addPoison60(enemy,amount,battle=state.battle,animate=true){
 if(!battle||state.battle!==battle||!enemy||enemy.owner!=='enemy'||!battle.enemyCreatures.includes(enemy)||enemy.health<=0||amount<=0)return 0;
 enemy.poison60=(enemy.poison60||0)+amount;
 if(animate&&typeof showEnemyHit==='function'&&typeof enemyHitBox==='function')showEnemyHit(enemy,amount,enemyHitBox(enemy),true);
 addLog(`${enemy.card.name}: +${amount} poison · ${enemy.poison60}/10.`);
 if(enemy.poison60>=10){enemy.health=0;addLog(`${enemy.card.name} is defeated by ten poison counters.`);}
 return amount;
}
function combatPoison60(source,target,amount,battle){
 if(amount>0)addPoison60(target,(source.infect?amount:0)+(source.toxic||0),battle,Boolean(source.infect));
 return Boolean(source.infect);
}
function lethalToEnemy60(source,target){return source.infect?Math.max(0,10-(target.poison60||0)):Math.max(0,target.health);}
function poisonOverflow60(source,target,amount,battle){
 dealCreatureDamage(source,target,'player',battle,amount,[]);
 battle.enemyCreatures=removeDeadCreatures(battle.enemyCreatures,'enemy');
 return amount;
}
const basePoisonResolve60=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const b=state.battle;
 if(effect.kind==='poison-all'){for(const enemy of b.enemyCreatures)addPoison60(enemy,effect.amount,b);return;}
 if(effect.kind==='lose-life'){state.playerHealth-=effect.amount;playSfx('player-hit');if(state.playerHealth<=0)endRun(false);return;}
 return basePoisonResolve60(effect,target,context);
};
const basePoisonBadges60=enemyKeywordBadges47;
enemyKeywordBadges47=function(enemy){return basePoisonBadges60(enemy)+(enemy.poison60?`<span class="enemy-poison-counter" title="Poison stays on this monster. At ten counters it is defeated; life recovery cannot remove poison." aria-label="${enemy.poison60} of 10 poison counters">☣ ${enemy.poison60}/10 poison</span>`:'');};
const POISON_DESCRIPTIONS60={
 'Glistener Elf':['A 1/1 creature with Infect for 1 generic mana.'],
 'Plague Stinger':['A 1/1 creature with Flying and Infect for 2 generic mana.'],
 'Plague Myr':['A 1/1 artifact creature with Infect for 2 generic mana.','Tap: add 1 floating generic mana. Summoning sickness prevents this mana ability unless it has Haste.'],
 'Bilious Skulldweller':['A 1/1 creature with Deathtouch and Toxic 1 for 1 generic mana.'],
 'Prologue to Phyresis':['Instant: every monster in the current wave gets 1 poison counter, then you draw a card.','This does not target, so Ward and Hexproof do not prevent it. Enemies may counter the spell.'],
 'Infectious Inquiry':['Draw 2 cards, lose 2 life, then give every monster in the current wave 1 poison counter.','This does not target. If drawing from an empty library or the life loss ends your run, later effects do not happen.']
};
const basePoisonDescriptions60=effectDescriptions;
effectDescriptions=function(card){
 let lines=POISON_DESCRIPTIONS60[card.name]?[...POISON_DESCRIPTIONS60[card.name],...basePoisonDescriptions60(card).filter(line=>line.startsWith('Run counters'))]:basePoisonDescriptions60(card);
 const keywords=creatureKeywords(card);
 if(keywords.infect)lines.push('Infect adaptation: combat damage to a monster adds that many poison counters instead of reducing its life. It still counts as damage for Lifelink and Deathtouch. Trample assigns enough damage to reach ten poison before spilling to the next legal foe.');
 if(keywords.toxic)lines.push(`Toxic ${keywords.toxic}: each combat damage hit also gives the damaged monster ${keywords.toxic} poison counter${keywords.toxic===1?'':'s'}. First strike, double strike and retaliation can each trigger it; zero damage cannot.`);
 if(POISON_DESCRIPTIONS60[card.name]||keywords.toxic||keywords.infect)lines.push('Ten poison counters defeat one monster, awarding its coins and a level once. Poison survives recovery and turns, and new monsters start at zero.');
 return lines;
};
const basePoisonSummary60=draftAbilitySummary;
draftAbilitySummary=function(card){return {'Glistener Elf':'Infect: combat damage becomes poison. Ten poison defeats a foe.','Plague Stinger':'Flying. Infect: combat damage becomes poison.','Plague Myr':'Infect. Tap: add 1 generic mana.','Bilious Skulldweller':'Deathtouch. Toxic 1: combat hits also give 1 poison.','Prologue to Phyresis':'All current foes get 1 poison. Draw a card.','Infectious Inquiry':'Draw 2, lose 2 life; all current foes get 1 poison.'}[card.name]||basePoisonSummary60(card);};
