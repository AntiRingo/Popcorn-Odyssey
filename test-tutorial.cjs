const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function boot(storage={}){
 const elements=new Map(),handlers={};let failing=false;
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}}});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(key,fn)=>{(handlers[key]??=[]).push(fn);},elementFromPoint:()=>null},window:{addEventListener(){}},localStorage:{getItem:key=>storage[key]??null,setItem:(key,value)=>{if(failing)throw Error('quota');storage[key]=value;}},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},console,Math,syncMarkup:(el,html)=>el.innerHTML=html});
 for(const file of ['catalog-data.js','characters.js','interface.js','night-events.js','gun-pointer.js','food-art.js','food-physics.js','food-scenes.js','physical.js','saves.js','tutorial.js','game.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 const run=code=>vm.runInContext(code,context);run('sound=false;installPhysicalControls()');return {run,element,storage,handlers,fail:value=>failing=value};
}

const game=boot(),r=game.run;
r('startTutorial()');assert.equal(r('tutorialActive()'),true);assert.equal(r('tutorialInstruction()[0]'),0);
assert.equal(r('storeCurrentSave()'),false);assert.equal(Object.keys(game.storage).length,0);
r('openSaveManager();takeShotgun()');assert.equal(r('saveManagerOpen'),false);assert.equal(r('armed'),false);
r('tick(500000)');assert.equal(r('time'),150);assert.equal(r('customers.length'),1);assert.equal(r('customers[0].left'),63);
r('paused=true;buy("corn")');assert.equal(r('deliveries.length'),0);r('paused=false;buy("corn");advanceDeliveries(4);unpackDelivery("corn");for(let i=0;i<goods.corn.qty;i++)unpackDelivery("corn",i);render()');
assert.equal(r('tutorialInstruction()[0]'),1);
r('shellCorn();shellCorn();shellCorn();render()');assert.match(r('tutorialInstruction()[1]'),/收集/);
r('prepTables[0].loose.slice().forEach(id=>collectGrain(0,id));render()');assert.equal(r('tutorialInstruction()[0]'),2);
assert.equal(r('physicalDrop("grain","0","machine",0)'),false);
r('toggleMachineDoor(machines[0]);advanceProduction(.5);physicalDrop("grain","0","machine",0);physicalDrop("jar","butter","machine",0);toggleMachineDoor(machines[0]);advanceProduction(.5);startMachine(machines[0]);advanceProduction(6);render()');
assert.equal(r('tutorialInstruction()[0]'),3);
r('toggleMachineDoor(machines[0]);advanceProduction(.5);physicalDrop("scoop","0","machine",0);physicalDrop("scoop","0","box",0);render()');assert.equal(r('tutorialInstruction()[0]'),4);
r('physicalDrop("jar","cheese","box",0);physicalDrop("box","0","customer",customers[0].id)');assert.equal(r('tutorialInstruction()[0]'),5);
r('finishTutorial()');assert.equal(r('tutorialActive()'),false);assert.equal(r('state.money'),60);assert.equal(r('state.totalServed'),0);assert.equal(r('run'),false);assert.equal(Object.keys(game.storage).length,0);
r('createSaveSlot("正式营业");startDay();time=87;state.money=123;prepTables[0].progress=1;persist()');const original=r('JSON.stringify(shiftSnapshot())'),data=r('JSON.stringify(state)'),storage=JSON.stringify(game.storage);
r('startTutorial();buy("corn");advanceDeliveries(4);finishTutorial()');assert.equal(r('JSON.stringify(shiftSnapshot())'),original);assert.equal(r('JSON.stringify(state)'),data);assert.equal(JSON.stringify(game.storage),storage);
r('paused=true;startTutorial();finishTutorial()');assert.equal(r('paused'),true);assert.equal(r('run'),true);
console.log('PASS: guided procurement through correct serving, frozen timers, closed-door rejection, practice save isolation, exact shift restoration and pause restoration.');

r('paused=false;startTutorial();boxes[0]="caramel";physicalDrop("box","0","customer",customers[0].id);tick(501000)');assert.equal(r('customers.length'),1);assert.equal(r('customers[0].flavor'),'cheese');assert.notEqual(r('tutorialInstruction()[0]'),5);
r('finishTutorial();startTutorial();paused=true');const frozen=r('time');r('tick(501500)');assert.equal(r('time'),frozen);r('finishTutorial()');
console.log('PASS: wrong-flavor delivery provides a replacement practice customer and cannot complete the tutorial.');
