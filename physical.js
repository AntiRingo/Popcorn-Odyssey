'use strict';
// Physical tools keep their contents until a valid transfer succeeds.
let heldScoop=null,gesture=null,scoopEquipped=false,scoopX=0,scoopY=0;
const jarNames={butter:'奶油',caramel:'焦糖酱',cheese:'芝士粉',chili:'辣椒粉'};
function heldCorn(kind,index){return kind==='cob'&&gesture?.kind==='cob'&&Number(gesture.index)===Number(index);}
function syncHeldCorn(){
 for(const obj of document.querySelectorAll('[data-object="cob"]')){
  const held=heldCorn('cob',obj.dataset.index);obj.classList.toggle('held-source',held);
  if(held)obj.setAttribute('aria-hidden','true');else obj.removeAttribute('aria-hidden');
 }
}
function physicalObject(kind,index,art,label,extra=''){
 return `<div class="physical-object ${kind}${heldCorn(kind,index)?' held-source':''}" ${heldCorn(kind,index)?'aria-hidden="true"':''} data-object="${kind}" data-index="${index}" role="img" aria-label="${label}" ${extra}>${art}<small>${label}</small></div>`;
}
function renderFleet(off){
 const fleet=$('machine-fleet');fleet.className='machine-fleet fleet-count-'+machines.length;
 syncMarkup(fleet,machines.map((m,i)=>`<article data-key="machine-${i}" class="machine-unit ${m.door?'door-open':''} ${m.doorMove>0?(m.door?'door-opening':'door-closing'):''} ${m.scooped?'scoop-reserved':''}" data-drop="machine" data-index="${i}">
 <span class="unit-heading">${i+1} 号机 <small>${machineLabel(m)}</small></span>
 <div class="machine ${m.cooking>0?'cooking':m.ready?'ready':''}"><div class="machine-roof">ODYSSEY ★</div>
 <div class="machine-glass"><div class="pot"></div>${machineIngredients(m,i)}<div class="heat-glow"></div>
 <button class="glass-door" data-door="${i}" aria-expanded="${m.door}" aria-label="${m.door?'关闭':'打开'} ${i+1} 号机门" ${off||m.cooking>0||m.doorMove>0?'disabled':''}>
 <span class="door-leaf" style="--door-angle:${m.door?'85deg':'0deg'};animation-play-state:${shiftRunning()?'running':'paused'}"><i class="door-handle">▥</i></span></button></div>
 <div class="machine-base"><b>${m.doorMove>0?(m.door?'正在开门':'正在关门'):m.door?'机门已打开':'机门已关闭'}</b><button class="power-switch" data-power="${i}" aria-label="启动 ${i+1} 号机" ${off||m.door||m.doorMove>0||!m.loaded||!m.buttered||m.cooking>0||m.ready?'disabled':''}>⏻</button></div></div>
 <p class="hint">${m.cooking>0?'正在烤制，请稍候':m.ready?(m.door?'拿起铲子后点击机器盛取':'点击机门开门，用铲子盛取'):m.door?'拖入原料 · 点击机门区域关门':'点击机门打开'}</p></article>`).join(''));
}
function toggleMachineDoor(m){
 if(!active()||!m||m.cooking>0||m.doorMove>0)return false;
 m.door=!m.door;m.doorMove=.5;return true;
}
function renderWorktables(off){
 if(heldScoop&&!machines.includes(heldScoop))resetScoop();
 if(!active())scoopEquipped=false;
 updateScoopPointer();
 const prep=$('prep-tables'),pack=$('pack-tables');
 prep.className='worktable-fleet table-count-'+prepTables.length;pack.className='worktable-fleet table-count-'+boxes.length;
 syncMarkup(prep,prepTables.map((t,i)=>`<article data-key="prep-${i}" class="worktable-unit"><span class="unit-heading">脱粒台 ${i+1}<small>${t.progress}/3 · 收集 ${t.collected??(t.progress===3?6:0)}/6</small></span><div class="prep-art collecting-prep">${t.progress<3?physicalObject('cob',i,`<div class="corn">${FoodArt.corn(t.progress,i)}</div>`,t.progress===0&&state.stock.corn<1?'玉米用完 · 请补货':'按住玉米 ↔ 来回摇晃'):''}<div class="board"></div><div data-key="grain-tray" class="grain-tray ${grainReady(t)?'physical-object grain':''}" ${grainReady(t)?`data-object="grain" data-index="${i}"`:''}><div class="grain-bowl">${FoodArt.handful('kernel',t.collected??(t.progress===3?6:0))}</div><small>${grainReady(t)?'原料盒 → 拖进机器':'点击散粒收进盒子'}</small></div><div data-key="prep-particles" data-live="particles" data-food-field="prep" data-index="${i}" class="prep-food-field"></div></div><div class="progress"><div style="width:${t.progress/3*100}%"></div></div></article>`).join(''));
 syncMarkup(pack,boxes.map((value,i)=>`<article data-key="box-${i}" class="worktable-unit" data-drop="box" data-index="${i}"><span class="unit-heading">纸盒 ${i+1}</span>${physicalObject('box',i,`<div class="box-scene"><div class="food-box ${value!==null?'filled '+value:''}"><div class="box-popcorn">${FoodArt.handful('pop',9)}</div><div class="carton"><span>★</span><b>POP!</b></div></div></div>`,value===null?'空纸盒 · 用铲子装入':value==='plain'?'原味 · 可撒料或拖给客人':flavors[value].name+' · 拖给客人')}</article>`).join(''));
 syncMarkup($('physical-tools'),`<div class="tool-shelf"><span class="tool-caption">铲子点击拿取 / 原料拖到目标松手</span>${physicalObject('scoop',0,`<div class="scoop-art">${heldScoop?FoodArt.handful('pop',6):''}</div>`,scoopEquipped?'铲子已拿起 · 点击放回':heldScoop?'点击拿起满铲 → 点击空盒':'点击拿起铲子 → 点击机器')}${Object.entries(jarNames).map(([key,name])=>physicalObject('jar',key,`<div class="jar-art jar-${key}"><i></i><b>${name}</b><span>${state.stock[key]} 份</span></div>`,key==='butter'?'奶油罐 → 已开门的机器':name+'罐 → 已装满的纸盒')).join('')}<div class="waste-bin" data-drop="trash">▤<small>废弃桶 · 拖入纸盒清空</small></div></div>`);
 if(gesture&&!active())cancelPhysicalGesture();
}
function physicalDrop(kind,index,target,targetIndex){
 if(!active())return false;
 const m=machines[targetIndex];
 if(target==='machine'){
  if(!m||!m.door||m.doorMove>0||m.cooking>0){toast('先打开机门；烤制中无法操作');return false;}
  if(kind==='grain'){
   const table=prepTables[index];if(!table||!grainReady(table)||m.loaded||m.ready)return false;
   table.progress=0;table.loose=[];table.collected=0;m.loaded=true;m.grainFx=1.8;selectedPrep=Number(index);selectedMachine=targetIndex;return true;
  }
  if(kind==='jar'&&index==='butter')return addButter(m);
  if(kind==='scoop'&&!heldScoop&&m.ready&&!m.scooped){heldScoop=m;m.scooped=true;return true;}
 }
 if(target==='box'&&Number.isInteger(targetIndex)&&targetIndex>=0&&targetIndex<boxes.length){
  selectedBox=targetIndex;
  if(kind==='scoop'&&heldScoop&&boxes[targetIndex]===null){
   const source=machines.indexOf(heldScoop);if(source<0){heldScoop=null;return false;}
   heldScoop.scooped=false;const success=transferPopcorn(source,targetIndex);if(success)heldScoop=null;return success;
  }
  if(kind==='jar'&&index!=='butter'&&jarNames[index]&&boxes[targetIndex]==='plain'&&state.stock[index]>0){seasonBox(targetIndex,index);return true;}
 }
 if(kind==='box'&&target==='customer'&&boxes[index]!=null&&customers.some(c=>c.id===targetIndex)){
  selectedBox=Number(index);if(boxes[index]==='plain')boxes[index]='original';serve(targetIndex);return true;
 }
 if(kind==='box'&&target==='trash'&&boxes[index]!=null){boxes[index]=null;toast('纸盒已清空，原料不返还');return true;}
 return false;
}
function cancelPhysicalGesture(){gesture=null;$('object-ghost').hidden=true;syncHeldCorn();document.querySelectorAll('.drop-highlight').forEach(el=>el.classList.remove('drop-highlight'));}
function installPhysicalControls(){
 document.addEventListener('pointerdown',e=>{
  if(e.button!==0||!active()||gesture||scoopEquipped)return;
  const obj=e.target.closest('[data-object]');if(!obj)return;
  const kind=obj.dataset.object,index=obj.dataset.index;
  if(kind==='scoop')return;
  if(kind==='cob'&&(prepTables[index].progress>=3||(prepTables[index].progress===0&&state.stock.corn<1)))return;
  if(kind==='box'&&boxes[index]===null)return;
  if(kind==='jar'&&state.stock[index]<1){toast('罐子空了，请从进货区补货');return;}
  e.preventDefault();gesture={kind,index,id:e.pointerId,x:e.clientX,y:e.clientY,anchor:e.clientX,dir:0,turns:0,moved:false};
  const ghost=$('object-ghost');ghost.innerHTML=obj.innerHTML;ghost.className='object-ghost '+kind;ghost.hidden=false;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  if(kind==='cob'){const corn=ghost.querySelector?.('.corn');if(corn)corn.innerHTML=FoodArt.corn(prepTables[index].progress,index+'-held');syncHeldCorn();}
 });
 document.addEventListener('pointermove',e=>{
  scoopX=e.clientX;scoopY=e.clientY;updateScoopPointer();
  const g=gesture;if(!g||g.id!==e.pointerId)return;if(!active()){cancelPhysicalGesture();return;}
  e.preventDefault();g.moved ||= Math.hypot(e.clientX-g.x,e.clientY-g.y)>10;
  const ghost=$('object-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  if(g.kind==='cob'){
   const dx=e.clientX-g.anchor,dir=Math.sign(dx);
   if(Math.abs(dx)>=24){if(dir!==g.dir){g.turns++;g.dir=dir;if(g.turns%2===0&&shellCorn(Number(g.index))){beep(450);const cob=ghost.querySelector?.('.corn');if(cob)cob.innerHTML=FoodArt.corn(prepTables[g.index].progress,g.index+'-held');render();}}g.anchor=e.clientX;}
   if(prepTables[g.index].progress===3){toast('脱粒完成！点击台面玉米粒，收齐后拖动原料盒');cancelPhysicalGesture();render();}
  }else{
   if(e.clientY<60)window.scrollBy(0,-18);else if(e.clientY>window.innerHeight-60)window.scrollBy(0,18);
   document.querySelectorAll('.drop-highlight').forEach(el=>el.classList.remove('drop-highlight'));
   document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop],[data-customer]')?.classList.add('drop-highlight');
  }
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop],[data-customer]');cancelPhysicalGesture();
  if(g.kind!=='cob'&&g.moved){const success=target&&physicalDrop(g.kind,g.index,target.dataset.drop||'customer',Number(target.dataset.index??target.dataset.customer));if(success)beep(600);else toast('未完成操作，物品已放回。请检查目标与原料状态。');render();}
 });
 document.addEventListener('pointercancel',cancelPhysicalGesture);window.addEventListener('blur',()=>{cancelPhysicalGesture();scoopEquipped=false;updateScoopPointer();});
 document.addEventListener('contextmenu',e=>{if(scoopEquipped){e.preventDefault();scoopEquipped=false;render();}});
 document.addEventListener('click',scoopClick,true);
 document.addEventListener('click',e=>{
  const door=e.target.closest('[data-door]'),power=e.target.closest('[data-power]');
  if(!active())return;
  const grain=e.target.closest('[data-grain]'),crate=e.target.closest('[data-crate]');
  if(grain&&collectGrain(Number(grain.dataset.table),Number(grain.dataset.grain))){animateCollection(grain,grain.closest('.prep-art')?.querySelector('.grain-bowl'),FoodArt.kernel);beep(680);render();}
  if(crate&&unpackDelivery(crate.dataset.crate,crate.dataset.item===undefined?undefined:Number(crate.dataset.item))){if(crate.dataset.item!==undefined)animateCollection(crate,document.querySelector(crate.dataset.crate==='corn'?'.grain-bowl':`[data-object="jar"][data-index="${crate.dataset.crate}"]`),goods[crate.dataset.crate].icon);beep(520);render();}
  if(door&&toggleMachineDoor(machines[Number(door.dataset.door)]))render();
  if(power){const m=machines[Number(power.dataset.power)];if(!m.door&&startMachine(m)){beep(220);render();}}
 });
}

function resetScoop(){
 if(heldScoop)heldScoop.scooped=false;heldScoop=null;scoopEquipped=false;updateScoopPointer();
}
function updateScoopPointer(){
 const cursor=$('scoop-pointer');if(!cursor)return;
 cursor.hidden=!scoopEquipped||!active();
 if(!cursor.hidden){cursor.style.left=scoopX+'px';cursor.style.top=scoopY+'px';cursor.innerHTML='<div class="scoop-art">'+(heldScoop?FoodArt.handful('pop',6):'')+'</div><small>'+(heldScoop?'点击空纸盒装入':'点击已开门的出锅机器')+' · 右键放下</small>';}
}
function scoopClick(e){
 if(!active())return;
 scoopX=e.clientX;scoopY=e.clientY;
 const tool=e.target.closest('[data-object="scoop"]');
 if(tool){e.preventDefault();e.stopImmediatePropagation();cancelPhysicalGesture();scoopX=e.clientX;scoopY=e.clientY;scoopEquipped=!scoopEquipped;render();return;}
 if(!scoopEquipped)return;
 const target=e.target.closest('[data-drop]');if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();
 const kind=target.dataset.drop;
 if(kind!=='machine'&&kind!=='box')return;
 const success=physicalDrop('scoop','0',kind,Number(target.dataset.index));
 if(success){beep(650);render();}else toast(kind==='box'?'请用满铲点击空纸盒':heldScoop?'铲子已盛满，请先装入纸盒':'请先打开已出锅机器的门');
 updateScoopPointer();
}

function machineIngredients(m,index){
 const mode=m.cooking>0?'popping':m.ready?'finished':'raw';
 return `<div data-key="ingredients" class="machine-ingredients ${mode} ${m.butterFx>0?'pour-butter':''}" aria-hidden="true"><div data-live="particles" data-food-field="machine" data-index="${index}" class="machine-food-field" ${m.scooped?'hidden':''}></div><b class="butter-piece" style="opacity:${m.buttered&&!m.ready?1:0}"></b><div class="steam">∿ ∿ ∿</div></div>`;
}
function renderCrates(off){
 syncMarkup($('delivery-crates'),deliveries.filter(d=>d.left===0).map(d=>`<div data-key="crate-${d.key}" class="delivery-crate ${d.opened?'opened':''}"><button class="crate-lid" data-crate="${d.key}" aria-label="拆开${goods[d.key].name}货箱" ${off||d.opened?'disabled':''}><span>${goods[d.key].name}</span><small>点击拆箱</small></button><div class="crate-contents">${d.opened?`<button data-crate="${d.key}" data-item="${d.collected||0}" class="crate-goods" ${off?'disabled':''} aria-label="收取一份${goods[d.key].name}">${goods[d.key].icon}<small>点击归类 · 剩 ${goods[d.key].qty-(d.collected||0)} 份</small></button>`:''}</div><div class="crate-front">${goods[d.key].name} <span>↑↑</span></div></div>`).join(''));
}

function animateCollection(source,target,art){
 if(!source?.getBoundingClientRect||!target?.getBoundingClientRect)return;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),particle=document.createElement('span');
 particle.className='collection-flight';if(art.startsWith('<svg'))particle.innerHTML=art;else particle.textContent=art;particle.setAttribute('aria-hidden','true');
 particle.style.left=(a.left+a.width/2)+'px';particle.style.top=(a.top+a.height/2)+'px';document.body.appendChild(particle);
 const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
 const animation=particle.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${dx*.5}px),calc(-50% + ${dy*.5-40}px)) scale(1.2)`,offset:.45},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.3)`,opacity:0}],{duration:380,easing:'ease-in-out'});
 animation.onfinish=()=>particle.remove();
}
