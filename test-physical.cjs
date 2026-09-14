const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),handlers={};
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}}});return elements.get(id);}
const context=vm.createContext({document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>{(handlers[name]??=[]).push(fn);},elementFromPoint:()=>null},window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},console,Math,syncMarkup:(el,html)=>{el.innerHTML=html;}});
for(const file of ['catalog-data.js','characters.js','interface.js','night-events.js','gun-pointer.js','physical.js','game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const run=code=>vm.runInContext(code,context);
run('sound=false;startDay();installPhysicalControls()');
function pointer(name,x){for(const handler of handlers[name]||[])handler({button:0,pointerId:1,clientX:x,clientY:100,preventDefault(){},target:{closest:()=>({dataset:{object:'cob',index:'0'},innerHTML:'玉米'})}});}
// A click and a one-way sweep cannot shell a batch. Six alternating strokes can.
pointer('pointerdown',100);pointer('pointerup',100);assert.equal(run('prepTables[0].progress'),0);
pointer('pointerdown',100);pointer('pointermove',135);assert.equal(run('prepTables[0].progress'),0);
for(const x of [100,135,100,135,100])pointer('pointermove',x);
assert.equal(run('prepTables[0].progress'),3);assert.equal(run('state.stock.corn'),7);assert.equal(run('gesture'),null);
assert.equal(run("physicalDrop('grain','0','machine',0)"),false);assert.equal(run('prepTables[0].progress'),3);
run('machines[0].door=true');assert.equal(run("physicalDrop('grain','0','machine',0)"),true);
assert.equal(run("physicalDrop('grain','0','machine',0)"),false);
assert.equal(run("physicalDrop('jar','butter','machine',0)"),true);assert.equal(run('state.stock.butter'),7);
assert.equal(run("physicalDrop('jar','butter','machine',0)"),false);assert.equal(run('state.stock.butter'),7);
run('machines[0].door=false;startMachine(machines[0]);advanceProduction(6)');
assert.equal(run("physicalDrop('scoop','0','machine',0)"),false);
run('machines[0].door=true');assert.equal(run("physicalDrop('scoop','0','machine',0)"),true);
run('state.upgrades.autoPack=true;advanceProduction(.2)');assert.equal(run('boxes[0]'),null);assert.equal(run('heldScoop===machines[0]'),true);
assert.equal(run("physicalDrop('scoop','0','trash',0)"),false);assert.equal(run('heldScoop!==null'),true);
assert.equal(run("physicalDrop('scoop','0','box',0)"),true);assert.equal(run('heldScoop'),null);assert.equal(run('boxes[0]'),'plain');
run('customerAction(customers[0].id)');assert.equal(run('served'),0);
assert.equal(run("physicalDrop('box','0','customer',999)"),false);assert.equal(run('boxes[0]'),'plain');
assert.equal(run("physicalDrop('box','0','customer',customers[0].id)"),true);assert.equal(run('served'),1);assert.equal(run('boxes[0]'),null);
run("boxes=[null,'plain'];prepTables=[{progress:3,clock:0},{progress:3,clock:0}];machines=[emptyMachine(),emptyMachine()];machines[1].door=true");
assert.equal(run("physicalDrop('grain','1','machine',1)"),true);assert.equal(run('prepTables[0].progress'),3);assert.equal(run('prepTables[1].progress'),0);
assert.equal(run("physicalDrop('jar','caramel','box',1)"),true);assert.equal(run('state.stock.caramel'),4);
assert.equal(run("physicalDrop('jar','chili','box',1)"),false);assert.equal(run('state.stock.chili'),5);
run('paused=true');assert.equal(run("physicalDrop('box','1','trash',0)"),false);run('paused=false');
assert.equal(run("physicalDrop('box','1','trash',0)"),true);
run("boxes[0]='plain';state.stock.cheese=0");assert.equal(run("physicalDrop('jar','cheese','box',0)"),false);assert.equal(run('boxes[0]'),'plain');
run('startDay()');pointer('pointerdown',100);pointer('pointermove',135);run('paused=true;render()');assert.equal(run('gesture'),null);
run('paused=false;machines[0].ready=true;machines[0].door=true');run("physicalDrop('scoop','0','machine',0);startDay()");assert.equal(run('heldScoop'),null);
assert.match(element('physical-tools').innerHTML,/jar-butter/);assert.match(element('machine-fleet').innerHTML,/glass-door/);
console.log('PASS: physical pointer shake, closed-door rejection, exact source table, ingredient accounting, scoop reservation against automation, invalid drops, plain delivery, one-time seasoning, empty jars, pause cancellation, day reset.');
// Click-to-hold scoop uses the same reserved contents but no drag gesture.
run('startDay();machines[0].ready=true;machines[0].door=true');
function scoopClickTarget(type,index=0){
 const attrs=type==='tool'?{object:'scoop'}:{drop:type,index:String(index)};
 const target={closest:selector=>selector==='[data-object="scoop"]'?(type==='tool'?{dataset:attrs}:null):selector==='[data-drop]'&&type!=='tool'?{dataset:attrs}:null};
 context.clickEvent={clientX:210,clientY:320,target,preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
 run('scoopClick(clickEvent)');return context.clickEvent;
}
assert.equal(scoopClickTarget('tool').stopped,true);assert.equal(run('scoopEquipped'),true);assert.equal(run('gesture'),null);assert.equal(element('scoop-pointer').hidden,false);
for(const handler of handlers.pointermove)handler({clientX:350,clientY:240,pointerId:7});
assert.equal(element('scoop-pointer').style.left,'350px');assert.equal(element('scoop-pointer').style.top,'240px');
assert.equal(scoopClickTarget('machine').stopped,true);assert.equal(run('heldScoop===machines[0]'),true);assert.equal(run('machines[0].door'),true);
run("boxes[0]='cheese'");scoopClickTarget('box');assert.equal(run('heldScoop!==null'),true);assert.equal(run('boxes[0]'),'cheese');
run('boxes[0]=null');scoopClickTarget('box');assert.equal(run('boxes[0]'),'plain');assert.equal(run('scoopEquipped'),true);assert.equal(run('heldScoop'),null);
scoopClickTarget('tool');assert.equal(run('scoopEquipped'),false);assert.equal(element('scoop-pointer').hidden,true);
scoopClickTarget('tool');for(const handler of handlers.contextmenu)handler({preventDefault(){}});assert.equal(run('scoopEquipped'),false);
scoopClickTarget('tool');run('paused=true;render()');assert.equal(run('scoopEquipped'),false);assert.equal(element('scoop-pointer').hidden,true);
run('paused=false;render()');scoopClickTarget('tool');run('armed=true;render()');assert.equal(run('scoopEquipped'),false);
console.log('PASS: click pickup, cursor tracking without holding a button, click machine without closing door, occupied-box rejection, repeat scooping, rack/right-click holster, pause and gun exclusivity.');
