const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function boot(storage={}){
 const elements=new Map(),handlers={};let failing=false;
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}}});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(key,fn)=>{(handlers[key]??=[]).push(fn);},elementFromPoint:()=>null},window:{addEventListener(){}},localStorage:{getItem:key=>storage[key]??null,setItem:(key,value)=>{if(failing)throw Error('quota');storage[key]=value;}},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},console,Math,syncMarkup:(el,html)=>el.innerHTML=html});
 for(const file of ['catalog-data.js','characters.js','interface.js','night-events.js','gun-pointer.js','food-art.js','food-physics.js','food-scenes.js','physical.js','saves.js','game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 const run=code=>vm.runInContext(code,context);run('sound=false;installPhysicalControls()');return {run,element,storage,handlers,fail:value=>failing=value};
}
let game=boot(),r=game.run;
assert.equal(r("createSaveSlot('第一家店')"),true);const first=r('saveLibrary.activeId');
r('startDay();time=91;state.money=137;prepTables[0].progress=2;boxes[0]="cheese";machines[0].ready=true;machines[0].door=true;customers[0].attack="windup";customers[0].attackIn=-.1;customers[0].attackLeft=2');
r("physicalDrop('scoop','0','machine',0);openSaveManager()");assert.equal(r('paused'),true);
assert.equal(r("createSaveSlot('第二家店')"),true);const second=r('saveLibrary.activeId');
assert.equal(r('state.money'),60);assert.equal(r('saveLibrary.slots[0].runtime.time'),91);assert.equal(r('saveLibrary.slots[0].runtime.machines[0].scooped'),false);
assert.equal(r('renameSaveSlot(saveLibrary.activeId,"新名字 <安全>")'),true);
assert.equal(r(`switchSaveSlot('${first}')`),true);assert.equal(r('state.money'),137);
game.element('start').onclick();assert.equal(r('time'),91);assert.equal(r('boxes[0]'),'cheese');assert.equal(r('prepTables[0].progress'),2);assert.equal(r('customers[0].attackLeft'),2);assert.equal(r('heldScoop'),null);assert.equal(r('machines[0].ready'),true);
r('storeCurrentSave()');game=boot(game.storage);r=game.run;assert.equal(r('state.money'),137);
// Saving from the welcome screen must retain an existing mid-shift snapshot.
r('storeCurrentSave()');game.element('start').onclick();assert.equal(r('time'),91);
r('openSaveManager()');r('closeSaveManager()');assert.equal(r('paused'),false);
const before=r('saveLibrary.activeId');game.fail(true);assert.equal(r(`switchSaveSlot('${second}')`),false);assert.equal(r('saveLibrary.activeId'),before);assert.equal(r("renameSaveSlot(saveLibrary.activeId,'失败')"),false);assert.equal(r('deleteSaveSlot(saveLibrary.activeId)'),false);game.fail(false);
r('storeCurrentSave()');assert.equal(r(`deleteSaveSlot('${second}')`),true);assert.equal(r('state.money'),137);assert.equal(r('deleteSaveSlot(saveLibrary.activeId)'),true);assert.equal(r('saveLibrary.slots.length'),0);assert.equal(r('saved'),null);
const clean=boot(game.storage);assert.equal(clean.run('saveLibrary.slots.length'),0);
const legacy=JSON.stringify({...JSON.parse(clean.run('JSON.stringify(freshState())')),version:5,money:234,day:6});const oldStorage={'popcorn-odyssey-v1':legacy};const migrated=boot(oldStorage);
assert.equal(migrated.run('saved.money'),234);assert.equal(migrated.run('saveLibrary.slots[0].name'),'原有存档');assert.equal(oldStorage['popcorn-odyssey-v1'],legacy);
migrated.run('deleteSaveSlot(saveLibrary.activeId)');assert.equal(boot(oldStorage).run('saveLibrary.slots.length'),0);
console.log('PASS: migration, independent named saves, mid-shift restoration including attacks and full scoop, welcome persistence, manager pause, storage failure atomicity, deletion and no legacy resurrection.');

const tactile=boot();
tactile.run("startDay();shellCorn();shellCorn();collectGrain(0,0);buy('butter');advanceDeliveries(4);unpackDelivery('butter');unpackDelivery('butter',0);storeCurrentSave()");
const restored=boot(tactile.storage);restored.element('start').onclick();
assert.equal(restored.run('prepTables[0].collected'),1);
assert.equal(restored.run('prepTables[0].loose.join()'),'1,2,3');
assert.equal(restored.run('deliveries[0].collected'),1);
assert.equal(restored.run('deliveries[0].opened'),true);
assert.equal(restored.run('state.stock.butter'),9);
assert.equal(restored.run("unpackDelivery('butter',0)"),false);
assert.equal(restored.run('collectGrain(0,0)'),false);
assert.equal(restored.run('machines[0].door'),false);
console.log('PASS: partially collected kernels and opened crates restore without duplicating collected stock.');
