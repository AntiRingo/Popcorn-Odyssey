'use strict';
// Visual worlds follow batch ownership; they never change ingredient accounting.
const prepFoodWorlds=new WeakMap(),machineFoodWorlds=new WeakMap(),foodFieldNodes=new WeakMap();
function prepFoodWorld(table){
 let world=prepFoodWorlds.get(table);
 if(!world){world={width:240,height:90,gravity:0,bodies:[]};prepFoodWorlds.set(table,world);}
 const ids=table.loose||[];world.bodies=world.bodies.filter(b=>ids.includes(b.id));
 for(const id of ids)if(!world.bodies.some(b=>b.id===id)){
  const b=FoodPhysics.body(id,100+Math.random()*40,28+Math.random()*30,8);
  b.vx=(Math.random()-.5)*180;b.vy=(Math.random()-.5)*110;b.z=30+Math.random()*20;b.vz=30+Math.random()*50;world.bodies.push(b);
 }
 return world;
}
function machineFoodWorld(machine){
 let world=machineFoodWorlds.get(machine);
 if(!world){world={width:180,height:140,gravity:480,pot:{left:48,right:132,floor:67},bodies:[]};machineFoodWorlds.set(machine,world);}
 if(!machine.loaded&&!machine.ready){world.bodies=[];return world;}
 if(!world.bodies.length){
  for(let i=0;i<6;i++){
   const b=FoodPhysics.body(i,69+Math.random()*42,9+Math.random()*10,8+Math.random()*2);
   b.vx=(Math.random()-.5)*65;b.vy=35+Math.random()*40;b.wait=i*.085;b.popAt=1.1+i*.62+Math.random()*.35;world.bodies.push(b);
  }
  // Loading a saved, idle batch should show its settled contents immediately.
  if(!machine.grainFx&&machine.cooking===0&&!machine.ready)for(let i=0;i<180;i++)FoodPhysics.step(world,1/120);
 }
 const elapsed=machine.ready?6:machine.cooking>0?6-machine.cooking:0;
 for(const b of world.bodies)if(b.type==='kernel'&&elapsed>=b.popAt)FoodPhysics.pop(b);
 return world;
}
function paintFoodField(field,world,tableIndex){
 let cache=foodFieldNodes.get(field);if(!cache){cache=new Map();foodFieldNodes.set(field,cache);}
 const ids=new Set(world.bodies.map(b=>b.id));
 for(const [id,node] of cache)if(!ids.has(id)){node.remove();cache.delete(id);}
 for(const b of world.bodies){
  let node=cache.get(b.id);
  if(!node){node=document.createElement(tableIndex===undefined?'span':'button');node.className='food-body';
   if(tableIndex!==undefined){node.type='button';node.dataset.grain=b.id;node.dataset.table=tableIndex;node.setAttribute('aria-label','收集玉米粒 '+(b.id+1));}
   else node.setAttribute('aria-hidden','true');
   field.appendChild(node);cache.set(b.id,node);
  }
  if(node.parentNode!==field)field.appendChild(node);
  if(node.dataset.foodType!==b.type){node.dataset.foodType=b.type;node.innerHTML=b.type==='pop'?FoodArt.pop:FoodArt.kernel;}
  const size=b.r*2+3;
  node.style.left=(b.x/world.width*100)+'%';node.style.top=((b.y-b.z*.65)/world.height*100)+'%';
  node.style.width=(size/world.width*100)+'%';node.style.height=(size/world.height*100)+'%';
  node.style.setProperty('--food-angle',b.angle+'rad');node.style.visibility=b.wait>0?'hidden':'visible';
  node.style.filter='drop-shadow(1px '+(2+b.z*.05)+'px 2px #0005)';
  if(tableIndex!==undefined)node.disabled=!active();
 }
}
function updateFoodScenes(dt=0){
 // The DOM-free game tests can still exercise the engine and inventory independently.
 for(const field of document.querySelectorAll('[data-food-field]')){
  const index=Number(field.dataset.index),prep=field.dataset.foodField==='prep',owner=prep?prepTables[index]:machines[index];if(!owner)continue;
  const world=prep?prepFoodWorld(owner):machineFoodWorld(owner);
  if(shiftRunning())FoodPhysics.step(world,dt);
  // Hide the whole layer: each moving particle has its own visibility setting.
  field.hidden=!prep&&owner.scooped;paintFoodField(field,world,prep?index:undefined);
 }
}
