const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const scripts=['catalog-data.js','characters.js','interface.js','night-events.js','gun-pointer.js','game.js'].map(file=>fs.readFileSync(file,'utf8'));
function boot(storage={}) {
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}}});return elements.get(id);};
 const buttons=['original','caramel','cheese','chili'].map(flavor=>({...element(flavor),dataset:{flavor}}));
 const context=vm.createContext({document:{getElementById:element,querySelectorAll:s=>s==='[data-flavor]'?buttons:[],addEventListener(){}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>{storage[k]=v;}},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},console,Math:Object.create(Math),syncMarkup:(el,html)=>{el.innerHTML=html;}});
 scripts.forEach(code=>vm.runInContext(code,context));
 const run=code=>vm.runInContext(code,context);run('sound=false');run("function openShopForTest(){if(state.phase==='newspaper')$('paper-continue').onclick();}");
 let now=0;return {run,element,buttons,storage,advance:seconds=>{for(let i=0;i<seconds*2;i++){now+=500;run(`tick(${now})`);}}};
}
const game=boot(),{run,element,buttons,advance,storage}=game;
run('startDay()');
for(let i=0;i<3;i++)element('shell').onclick();
assert.equal(run('state.stock.corn'),7);run('prepTables[0].loose.slice().forEach(id=>collectGrain(0,id))');
element('load').onclick();element('butter').onclick();element('cook').onclick();advance(6);
assert.equal(run('machines[0].ready'),true);
element('pack').onclick();buttons[0].onclick();run('serve(customers[0].id)');
assert.equal(run('state.money'),78);assert.equal(run('served'),1);
run("boxes[selectedBox]='cheese';customers=[{id:99,flavor:'chili',left:30,max:40,look:0,mutation:0}];serve(99)");
assert.equal(run('state.money'),91);assert.equal(run('revenue'),31);assert.equal(run('discounted'),1);assert.equal(run('customers.length'),0);assert.equal(run('boxes[selectedBox]'),null);
run('serve(99)');assert.equal(run('state.money'),91);
run("buy('corn')");advance(4);assert.equal(run('state.stock.corn'),7);run("unpackDelivery('corn');for(let i=0;i<5;i++)unpackDelivery('corn',i)");assert.equal(run('state.stock.corn'),12);
run('pauseGame()');const remaining=run('time');advance(5);assert.equal(run('time'),remaining);
run("paused=false;buy('butter');endDay();openShopForTest()");
assert.equal(run('state.phase'),'shop');assert.equal(run('state.lastRevenue'),31);assert.equal(run('state.stock.butter'),7);assert.equal(run('state.pendingCrates[0].key'),'butter');
run("purchaseUpgrade('shell')");assert.equal(run('state.upgrades.shell'),true);assert.equal(run('state.money'),4);
run("purchaseUpgrade('shell');purchaseUpgrade('feed')");assert.equal(run('state.money'),4);assert.equal(run('state.upgrades.feed'),false);
const loaded=boot(storage);loaded.element('start').onclick();
assert.equal(loaded.run('state.phase'),'shop');assert.equal(loaded.run('run'),false);assert.equal(loaded.run('state.upgrades.shell'),true);assert.equal(loaded.run('state.money'),4);
loaded.element('next').onclick();assert.equal(loaded.run('machines.length'),1);assert.equal(loaded.run('state.day'),2);
loaded.advance(3);assert.equal(loaded.run('prepTables[selectedPrep].progress'),3);assert.equal(loaded.run('machines[0].loaded'),false);

const automatic=boot();automatic.run("state.money=2000;state.phase='shop';purchaseUpgrade('shell');purchaseUpgrade('feed');purchaseUpgrade('cook');purchaseUpgrade('machines');purchaseUpgrade('machines');purchaseUpgrade('machines')");
assert.equal(automatic.run('state.money'),1150);assert.equal(automatic.run('state.upgrades.machines'),4);
automatic.run("purchaseUpgrade('machines')");assert.equal(automatic.run('state.money'),1150);
automatic.run('startDay()');automatic.advance(6);
assert.equal(automatic.run('machines[0].cooking'),3);assert.equal(automatic.run('machines[1].cooking'),6);
automatic.run('pauseGame()');automatic.advance(10);assert.equal(automatic.run('machines[0].cooking'),3);
automatic.run('paused=false');automatic.advance(12);
assert.equal(automatic.run('machines.filter(m=>m.ready).length'),4);
assert.equal(automatic.run('state.stock.butter'),4);assert.equal(automatic.run('state.stock.corn'),3);
automatic.run('selectedMachine=2');automatic.element('pack').onclick();
assert.equal(automatic.run('machines[2].ready'),false);assert.equal(automatic.run('machines[0].ready'),true);
automatic.advance(.5);assert.equal(automatic.run('machines[2].cooking'),6);
automatic.run('state.stock.butter=0;state.stock.corn=0;prepTables[selectedPrep].progress=0');automatic.advance(30);
assert.equal(automatic.run('state.stock.butter'),0);assert.equal(automatic.run('state.stock.corn'),0);
automatic.run("purchaseUpgrade('shell')");assert.equal(automatic.run('state.money'),1150);

for(const key of ['feed','cook']){
 const partial=boot();partial.run(`state.upgrades.${key}=true;startDay()`);
 if(key==='feed'){partial.run('shellCorn();shellCorn();shellCorn();prepTables[0].loose.slice().forEach(id=>collectGrain(0,id))');partial.advance(.5);assert.equal(partial.run('machines[0].buttered'),true);assert.equal(partial.run('machines[0].cooking'),0);}
 else{partial.run('shellCorn();shellCorn();shellCorn();prepTables[0].loose.slice().forEach(id=>collectGrain(0,id));loadMachine(machines[0]);addButter(machines[0])');partial.advance(.5);assert.equal(partial.run('machines[0].cooking'),6);}
}
for(const [amount,capacity] of [[0,3],[80,3],[180,4],[350,4],[600,6]]){
 assert.equal(run('demand('+amount+').capacity'),capacity);
 run('state.lastRevenue='+amount+';customers=[];for(let i=0;i<10;i++)addCustomer()');
 assert.equal(run('customers.length'),capacity);
}
assert.ok(run('demand(600).interval<demand(180).interval&&demand(180).interval<demand(0).interval'));
const legacy=boot({'popcorn-odyssey-v1':JSON.stringify({version:1,day:5,money:100,stock:{corn:5,butter:5,caramel:5,cheese:5,chili:5},totalServed:40})});
assert.equal(legacy.run('saved.day'),5);assert.equal(legacy.run('saved.upgrades.machines'),1);assert.equal(legacy.run('saved.lastRevenue'),0);
const invalid=boot({'popcorn-odyssey-v1':'{broken'});assert.equal(invalid.run('saved'),null);
const end=boot();end.run('startDay();revenue=600;time=.2');end.advance(.5);assert.equal(end.run('run'),false);assert.equal(end.run('state.lastRevenue'),600);assert.equal(end.run('state.day'),2);end.advance(5);assert.equal(end.run('state.day'),2);
console.log('PASS: manual production; full/half-price orders; supplies; pause; upgrade pricing, limits and affordability; shop reload; four parallel machines; independent automation; no negative stock; traffic and portraits; legacy saves; timed settlement.');

const book=boot();book.run('startDay()');
assert.equal(book.run('Object.keys(state.collection.guests).length'),1);
book.run('openCodex()');const bookTime=book.run('time');book.advance(5);assert.equal(book.run('time'),bookTime);assert.equal(book.run('paused'),true);
book.run("drawCodex('guests')");assert.match(book.element('codex-overlay').innerHTML,/未记录的来客/);assert.match(book.element('codex-overlay').innerHTML,/初见于第 1 天/);
book.run('closeCodex()');assert.equal(book.run('paused'),false);
book.run('pauseGame();openCodex();closeCodex()');assert.equal(book.run('paused'),true);
book.run('paused=false;shellCorn();shellCorn();shellCorn();prepTables[0].loose.slice().forEach(id=>collectGrain(0,id));loadMachine(machines[0]);addButter(machines[0])');
assert.equal(book.run('state.collection.ingredients.corn'),1);assert.equal(book.run('state.collection.ingredients.butter'),1);
book.run('endDay();openShopForTest()');const archiveReload=boot(book.storage);archiveReload.element('start').onclick();
assert.equal(archiveReload.run('Object.keys(state.collection.guests).length'),1);assert.equal(archiveReload.run('state.collection.ingredients.corn'),1);
archiveReload.run('openCodex();closeCodex()');assert.equal(archiveReload.run('run'),false);assert.equal(archiveReload.run('state.phase'),'shop');
const allMachines=automatic.element('machine-fleet').innerHTML;assert.equal((allMachines.match(/class="machine-select"/g)||[]).length,4);assert.equal((allMachines.match(/class="machine-glass"/g)||[]).length,4);assert.equal((allMachines.match(/data-pack=/g)||[]).length,4);
for(let level=1;level<=4;level++){const art=run('portrait(1,'+level+')');assert.match(art,/mutation-art/);assert.doesNotMatch(art,/M36 43Q35 2/);}
assert.equal(legacy.run('Object.keys(saved.collection.guests).length'),0);
console.log('PASS: four visible machines; progressive humanlike portraits;  ingredient usage; guest discovery; archive locking, pause restoration and persistence.');
const purchase=boot();purchase.run("state.money=1000;state.phase='shop';purchaseUpgrade('procure');purchaseUpgrade('prepTables');purchaseUpgrade('packTables');purchaseUpgrade('autoPack')");
assert.equal(purchase.run('state.money'),640);assert.equal(purchase.run('state.upgrades.prepTables'),2);assert.equal(purchase.run('state.upgrades.packTables'),2);
const upgradesReload=boot(purchase.storage);upgradesReload.element('start').onclick();assert.equal(upgradesReload.run('prepTables.length'),2);assert.equal(upgradesReload.run('boxes.length'),2);
purchase.run('startDay();state.stock.corn=0;state.stock.butter=0;autoProcure()');assert.equal(purchase.run('deliveries.length'),2);assert.equal(purchase.run('state.money'),618);
purchase.run('autoProcure();autoProcure()');assert.equal(purchase.run('deliveries.length'),2);assert.equal(purchase.run('state.money'),618);
purchase.advance(4);purchase.run("for(const key of ['corn','butter']){unpackDelivery(key);for(let i=0;i<5;i++)unpackDelivery(key,i)}");assert.equal(purchase.run('state.stock.corn'),5);assert.equal(purchase.run('state.stock.butter'),5);
purchase.run('state.money=0;state.stock.corn=0;autoProcure()');assert.equal(purchase.run('state.money'),0);assert.equal(purchase.run('deliveries.length'),0);
purchase.run('state.money=50;state.stock.corn=0;pauseGame();autoProcure()');assert.equal(purchase.run('deliveries.length'),0);
const parallel=boot();parallel.run('state.upgrades.prepTables=4;state.upgrades.packTables=4;state.upgrades.shell=true;state.upgrades.machines=4;state.upgrades.feed=true;state.upgrades.cook=true;state.upgrades.autoPack=true;startDay()');
parallel.advance(3);assert.equal(parallel.run('machines.filter(m=>m.cooking===6).length'),4);assert.equal(parallel.run('state.stock.corn'),4);assert.equal(parallel.run('state.stock.butter'),4);
parallel.advance(6);assert.equal(parallel.run("boxes.filter(b=>b==='plain').length"),4);assert.equal(parallel.run('machines.filter(m=>m.ready).length'),0);
parallel.run('selectedBox=1');parallel.buttons[1].onclick();assert.equal(parallel.run('boxes[1]'),'caramel');assert.equal(parallel.run('boxes[0]'),'plain');
parallel.run("customers=[{id:777,flavor:'caramel',left:40,max:40,look:0,mutation:0}];serve(777)");assert.equal(parallel.run('boxes[1]'),null);assert.equal(parallel.run('boxes[0]'),'plain');
parallel.advance(9);assert.equal(parallel.run('state.stock.corn'),0);assert.equal(parallel.run('state.stock.butter'),0);
assert.equal(parallel.run("boxes.filter(b=>b!==null).length"),4);assert.ok(parallel.run('machines.some(m=>m.ready)'));
parallel.run('endDay();openShopForTest()');assert.equal(parallel.run('prepTables.length'),4);assert.equal(parallel.run('boxes.length'),4);assert.equal(parallel.run('boxes.every(b=>b===null)'),true);
console.log('PASS: new upgrade prices and migration; automatic procurement does not duplicate, overspend or run paused; four prep tables and packing slots; automatic packing retains independent flavors and waits for free slots.');

parallel.run('startDay();render()');
assert.equal((parallel.element('prep-tables').innerHTML.match(/class="prep-art"/g)||[]).length,4);
assert.equal((parallel.element('pack-tables').innerHTML.match(/class="box-scene"/g)||[]).length,4);
assert.equal((parallel.element('prep-tables').innerHTML.match(/data-shell=/g)||[]).length,4);
assert.equal((parallel.element('pack-tables').innerHTML.match(/data-season=/g)||[]).length,16);
const targeted=boot();targeted.run("state.upgrades.prepTables=2;state.upgrades.packTables=2;startDay();shellCorn(1);shellCorn(1);shellCorn(1)");
assert.equal(targeted.run('prepTables[0].progress'),0);assert.equal(targeted.run('prepTables[1].progress'),3);
targeted.run("boxes=['plain','plain'];seasonBox(1,'cheese')");assert.equal(targeted.run('boxes[0]'),'plain');assert.equal(targeted.run('boxes[1]'),'cheese');assert.equal(targeted.run('selectedBox'),1);
const designs=[];for(let stage=1;stage<=4;stage++)for(let variant=0;variant<4;variant++)designs.push(run('mutationArt['+stage+']['+variant+']'));
assert.equal(new Set(designs).size,16);assert.equal(run('guestEntryCount'),25);
run('state.collection.guests={};discoverGuest({mutation:4,look:3})');assert.equal(run("state.collection.guests['4-3'].count"),1);
assert.match(run('portrait(3,4)'),/data-design="4-3"/);
console.log('PASS: four complete prep and packaging illustrations; independent table operations; 16 distinct mutation designs; fourth guest variant discovery.');

const economy=boot();economy.run('startDay()');
for(const [total,level,chance] of [[0,0,0],[799,0,0],[800,1,.12],[2399,1,.12],[2400,2,.25],[5200,3,.42],[9000,4,.62]]){
 assert.equal(economy.run('mutationProfile('+total+').level'),level);assert.equal(economy.run('mutationProfile('+total+').chance'),chance);
}
economy.run('state.totalRevenue=9000;state.lastRevenue=0;Math.random=()=>.99');assert.equal(economy.run('rollMutation()'),0);
economy.run('Math.random=()=>.01');assert.equal(economy.run('rollMutation()'),4);
economy.run('state.totalRevenue=0;state.lastRevenue=10000');assert.equal(economy.run('mutationProfile().level'),0);
economy.run("state.market={day:1,priceKey:'corn',pricePct:50,hotFlavor:'cheese'};buy('corn')");assert.equal(economy.run('state.money'),42);assert.equal(economy.run('expense'),18);
economy.run("boxes[0]='cheese';customers=[{id:400,flavor:'cheese',look:0,mutation:0,left:60,max:60}];serve(400)");assert.equal(economy.run('revenue'),31);assert.equal(economy.run('state.totalRevenue'),31);
economy.run("boxes[0]='original';customers=[{id:401,flavor:'cheese',look:0,mutation:0,left:60,max:60}];serve(401)");assert.equal(economy.run('revenue'),46);assert.equal(economy.run('state.totalRevenue'),46);
economy.run('endDay()');assert.equal(economy.run('state.phase'),'newspaper');assert.match(economy.element('overlay').innerHTML,/巷口晚报/);
const edition=economy.run('JSON.stringify(state.nextMarket)'),paperReload=boot(economy.storage);paperReload.element('start').onclick();
assert.equal(paperReload.run('state.phase'),'newspaper');assert.equal(paperReload.run('JSON.stringify(state.nextMarket)'),edition);
paperReload.element('paper-continue').onclick();assert.equal(paperReload.run('state.phase'),'shop');assert.doesNotMatch(paperReload.element('overlay').innerHTML,/异变|每天最多|营业额门槛/);
paperReload.element('next').onclick();assert.equal(paperReload.run('JSON.stringify(state.market)'),edition);
assert.equal(paperReload.run('state.totalRevenue'),46);

const defense=boot();defense.run('startDay();customers=[{id:500,flavor:"original",look:4,mutation:2,left:60,max:60,hostile:true,attack:"waiting",attackIn:0}];attackCooldown=0');
defense.advance(.5);assert.equal(defense.run('threat().id'),500);assert.match(defense.element('customers').innerHTML,/attacking/);
defense.element('shotgun').onclick();assert.equal(defense.run('armed'),true);defense.run('customerAction(500)');assert.equal(defense.run('customers.length'),0);assert.equal(defense.run('stun'),0);assert.equal(defense.run('state.money'),60);
defense.run('customers=[{id:501,flavor:"original",look:4,mutation:3,left:60,max:60,hostile:true,attack:"waiting",attackIn:0}];attackCooldown=0');defense.advance(.5);
defense.run('pauseGame()');const windup=defense.run('threat().attackLeft');defense.advance(10);assert.equal(defense.run('threat().attackLeft'),windup);
defense.run('paused=false;openCodex()');defense.advance(5);assert.equal(defense.run('threat().attackLeft'),windup);defense.run('closeCodex()');
defense.advance(3.5);assert.equal(defense.run('stun'),4);const cornBefore=defense.run('state.stock.corn');defense.element('shell').onclick();assert.equal(defense.run('state.stock.corn'),cornBefore);const stunnedTime=defense.run('time');
defense.advance(4);assert.equal(defense.run('stun'),0);assert.ok(defense.run('time')<stunnedTime);defense.element('shell').onclick();assert.equal(defense.run('state.stock.corn'),cornBefore-1);
defense.run('customers=[{id:502,flavor:"original",look:4,mutation:4,left:60,max:60,attack:"waiting"},{id:503,flavor:"original",look:0,mutation:0,left:60,max:60}];beginAttack(customers[0]);takeShotgun();shoot(503)');
assert.equal(defense.run('customers.length'),1);assert.equal(defense.run('state.money'),30);assert.equal(defense.run('reload'),1.2);assert.equal(defense.run('threat().id'),502);
defense.advance(3.5);assert.equal(defense.run('stun'),4);
const hostile=boot();hostile.run('Math.random=()=>.01;state.totalRevenue=9000;startDay();customers=[];Math.random=()=>.99;addCustomer()');assert.equal(hostile.run('customers[0].mutation'),0);assert.equal(hostile.run('customers[0].hostile'),false);
assert.equal(legacy.run('saved.totalRevenue'),0);
console.log('PASS: cumulative mutation thresholds and mixed encounter chances; market price and trend effects; exact lifetime revenue; newspaper replay and save; successful defense, missed shots, pause, stun recovery, and peaceful guests.');
const freefire=boot();freefire.run('startDay();render()');assert.equal(freefire.element('shotgun').disabled,false);
freefire.element('shotgun').onclick();assert.equal(freefire.run('armed'),true);freefire.element('shotgun').onclick();assert.equal(freefire.run('armed'),false);
freefire.element('shotgun').onclick();freefire.run('customerAction(customers[0].id)');assert.equal(freefire.run('customers.length'),0);assert.equal(freefire.run('state.money'),30);assert.equal(freefire.run('fines'),30);assert.equal(freefire.run('state.totalRevenue'),0);assert.equal(freefire.run('served'),0);
freefire.advance(1.5);freefire.element('shotgun').onclick();freefire.run('shoot()');assert.equal(freefire.run('state.money'),30);assert.equal(freefire.run('reload'),1.2);
freefire.advance(1.5);freefire.run('state.money=7;customers=[{id:900,mutation:0,look:0,flavor:"original",left:60,max:60}];takeShotgun();shoot(900)');assert.equal(freefire.run('state.money'),0);assert.equal(freefire.run('fines'),37);
freefire.advance(1.5);freefire.run('customers=[{id:901,mutation:2,look:0,flavor:"original",left:60,max:60}];takeShotgun();shoot(901)');assert.equal(freefire.run('customers.length'),0);assert.equal(freefire.run('fines'),37);
freefire.advance(1.5);freefire.run('takeShotgun();customers=[{id:902,mutation:2,look:4,flavor:"original",left:60,max:60}];beginAttack(customers[0])');assert.equal(freefire.run('armed'),true);
freefire.run('shoot(902);endDay()');assert.equal(freefire.run('state.lastReport.fines'),37);
console.log('PASS: unrestricted draw/holster, peaceful guest penalty, empty shot, reload, zero-balance clamp, mutant shot and pre-armed counterattack.');
for(const sample of [
 {mutation:0,hostile:false,attack:'waiting',fine:30},
 {mutation:3,hostile:false,attack:'waiting',fine:30},
 {mutation:3,hostile:true,attack:'waiting',fine:30},
 {mutation:3,hostile:true,attack:'windup',fine:0}
]){
 const target=boot();target.run('startDay()');
 target.run('customers=[{id:999,flavor:"original",look:4,left:60,max:60,attackLeft:3.2,...'+JSON.stringify(sample)+'}];takeShotgun();shoot(999)');
 assert.equal(target.run('state.money'),60-sample.fine);assert.equal(target.run('fines'),sample.fine);assert.equal(target.run('customers.length'),0);assert.equal(target.run('state.totalRevenue'),0);
}
for(const willAttack of [false,true]){
 const spawn=boot();spawn.run('startDay();state.totalRevenue=9000;customers=[]');
 spawn.run('const draws=[.1,.01,.01,.99,'+(willAttack?'.1':'.9')+',.5];Math.random=()=>draws.shift()??.5;addCustomer()');
 assert.equal(spawn.run('customers[0].look'),4);assert.equal(spawn.run('customers[0].hostile'),willAttack);assert.equal(spawn.run('customers[0].attack'),'waiting');
}
console.log('PASS: only active attacks waive the fine; normal, peaceful mutated and not-yet-attacking hostile guests all incur 30 coins; attack-capable guests may remain peaceful.');
const pointer=boot();pointer.run('startDay();takeShotgun();trackGunPointer({clientX:120,clientY:240})');
assert.equal(pointer.element('gun-pointer').hidden,false);assert.equal(pointer.element('gun-pointer').style.left,'120px');assert.equal(pointer.element('gun-pointer').style.top,'240px');
pointer.run('pauseGame()');assert.equal(pointer.element('gun-pointer').hidden,true);pointer.run('paused=false;render()');assert.equal(pointer.element('gun-pointer').hidden,false);
pointer.run('let prevented=0,stopped=0;const ground={button:0,clientX:300,clientY:220,target:{closest:()=>null},preventDefault(){prevented++},stopImmediatePropagation(){stopped++}};gunPointerDown(ground)');
assert.equal(pointer.run('reload'),1.2);assert.equal(pointer.run('state.money'),60);assert.equal(pointer.run('prevented'),1);assert.equal(pointer.run('stopped'),1);assert.equal(pointer.element('gun-pointer').hidden,true);
pointer.run('suppressShotClick(ground)');assert.equal(pointer.run('prevented'),2);assert.equal(pointer.run('stopped'),2);assert.equal(pointer.run('suppressGunClick'),false);
pointer.advance(1.5);pointer.run('takeShotgun();const person={...ground,target:{closest:()=>({dataset:{customer:customers[0].id}})}};gunPointerDown(person)');assert.equal(pointer.run('state.money'),30);assert.equal(pointer.run('customers.length'),0);
pointer.advance(1.5);pointer.run('takeShotgun();holsterGun(ground)');assert.equal(pointer.run('armed'),false);assert.equal(pointer.element('gun-pointer').hidden,true);
console.log('PASS: pointer-following gun, pause/holster visibility, background shots, target shots and prevention of duplicate clicks or workstation actions.');

const configured=boot({'popcorn-odyssey-prices-v1':JSON.stringify({upgrades:{shell:7,machines:30,prepTables:20,packTables:10},materials:{corn:20,butter:0}})});
configured.run("state.phase='shop';state.money=1000;purchaseUpgrade('shell');purchaseUpgrade('machines');purchaseUpgrade('machines');purchaseUpgrade('prepTables');purchaseUpgrade('packTables')");
assert.equal(configured.run('state.money'),823);
assert.equal(configured.run("upgradeCost('machines')"),190);
assert.equal(configured.run("upgradeCost('prepTables')"),80);
assert.equal(configured.run("upgradeCost('packTables')"),70);
configured.run("startDay();state.market={priceKey:'corn',pricePct:25};buy('corn')");
assert.equal(configured.run('state.money'),798);
assert.equal(configured.run('expense'),25);
configured.run("buy('butter')");
assert.equal(configured.run('state.money'),798);
assert.equal(configured.run("deliveries.some(d=>d.key==='butter')"),true);
configured.run("deliveries=[];state.stock.corn=0;state.upgrades.procure=true;autoProcure()");
assert.equal(configured.run('state.money'),773);
console.log('PASS: configured upgrade deductions and incremental costs, material market multiplier, zero-cost purchases and automatic procurement.');
