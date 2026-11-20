/* v0.92 — one random greeting per trading post, stable throughout shopping. */
const VEY_GREETINGS92=Object.freeze([
 'Welcome, traveler. Your next lucky draw awaits.',
 'Fresh packs, familiar faces. Come take a look.',
 'A little luck looks good on you.',
 'Every great run starts with one good card.',
 "Let's find the card your deck is missing.",
 "Back from battle? I've kept the lantern lit.",
 'Sharp blades are useful. A sharp deck is better.',
 'The next great story might be in this pack.',
 'Something caught your eye? Trust that feeling.',
 'Gold comes and goes. Good draws stay with you.',
 'New cards, new chances. Welcome to my table.',
 'A wise traveler always checks the trading post.',
 "I've saved the best part of the road for you.",
 'Even the boldest hero needs a little backup.',
 "Take your time. The packs aren't going anywhere.",
 'The road is cruel. My prices are friendlier.',
 'Fortune favors the well-shuffled.',
 "Your deck has potential. Let's give it a spark.",
 "Looking for an edge? You've found the right stall.",
 "Survived another battle? That's worth a fresh pack.",
 'No crystal ball here. Just excellent possibilities.',
 'A little treasure can change your next encounter.',
 'Step closer. These packs have stories to tell.',
 "Welcome back. Let's make your next draw count."
]);
let lastVeyGreeting92=null;
function pickVeyGreeting92(){
 const choices=VEY_GREETINGS92.filter(text=>text!==lastVeyGreeting92);
 return lastVeyGreeting92=choices[Math.floor(Math.random()*choices.length)];
}
const baseVeyShop92=renderShop;
renderShop=function(){
 const result=baseVeyShop92(),shop=state.shop;
 if(shop){
  if(!VEY_GREETINGS92.includes(shop.greeting92))shop.greeting92=pickVeyGreeting92();
  $('#shopkeeper-greeting87').textContent=`“${shop.greeting92}”`;
 }
 return result;
};
