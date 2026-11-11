// Existing response/payment suites fix enemy permission at success and acknowledge
// only that new gate. Player dice and the actual counter-response rules stay real.
module.exports=async page=>page.evaluate(()=>{
 const begin=beginDiceRoll50;
 beginDiceRoll50=function(source,labels,summary,apply,resume,battle=state.battle,options={}){
  if(options.owner!=='enemy')return begin(source,labels,summary,apply,resume,battle,options);
  const roll=rollD6Value50;rollD6Value50=()=>6;
  try{
   const started=begin(source,labels,summary,apply,resume,battle,options);
   if(started){const id=battle.diceRoll.id;finishDiceAnimation50(id);settleDiceRoll50(id);}
   return started;
  }finally{rollD6Value50=roll;}
 };
});
