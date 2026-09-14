'use strict';
// Physical tools keep their contents until a valid transfer succeeds.
let heldScoop=null,gesture=null,scoopEquipped=false,scoopX=0,scoopY=0;
const jarNames={butter:'奶油',caramel:'焦糖酱',cheese:'芝士粉',chili:'辣椒粉'};
function physicalObject(kind,index,art,label,extra=''){
 return `<div class="physical-object ${kind}" data-object="${kind}" data-index="${index}" role="img" aria-label="${label}" ${extra}>${art}<small>${label}</small></div>`;
}
function renderFleet(off){
 const fleet=$('machine-fleet');fleet.className='machine-fleet fleet-count-'+machines.length;
 syncMarkup(fleet,machines.map((m,i)=>`<article data-key="machine-${i}" class="machine-unit ${m.door?'door-open':''} ${m.scooped?'scoop-reserved':''}" data-drop="machine" data-index="${i}"><span class="unit-heading">${i+1} 号机 <small>${machineLabel(m)}</small></span><div class="machine ${m.cooking>0?'cooking':m.ready?'ready':''}"><div class="machine-roof">ODYSSEY ★</div><div class="machine-glass"><div class="pot"></div><div class="popcorn-pile"></div><div class="heat-glow"></div><span class="ingredient-status">${m.loaded?'•• 玉米粒':''}<br>${m.buttered?'▰ 奶油':''}</span><button class="glass-door" data-door="${i}" aria-label="${m.door?'关闭':'打开'} ${i+1} 号机门" ${off||m.cooking>0?'disabled':''}><span>▥</span></button></div><div class="machine-base"><b>${m.door?'机门已打开':'机门已关闭'}</b><button class="power-switch" data-power="${i}" aria-label="启动 ${i+1} 号机" ${off||m.door||!m.loaded||!m.buttered||m.cooking>0||m.ready?'disabled':''}>⏻</button></div></div><p class="hint">${m.cooking>0?'正在烤制，请稍候':m.ready?(m.door?'拿起铲子后点击机器盛取':'打开门，用铲子盛取'):m.door?'将玉米粒碗、奶油罐拖入':'抓住门把手，打开机门'}</p></article>`).join(''));
}
function renderWorktables(off){
 if(heldScoop&&!machines.includes(heldScoop))resetScoop();
 if(!active())scoopEquipped=false;
 updateScoopPointer();
 const prep=$('prep-tables'),pack=$('pack-tables');
 prep.className='worktable-fleet table-count-'+prepTables.length;pack.className='worktable-fleet table-count-'+boxes.length;
 syncMarkup(prep,prepTables.map((t,i)=>`<article data-key="prep-${i}" class="worktable-unit"><span class="unit-heading">脱粒台 ${i+1}<small>${t.progress}/3</small></span><div class="prep-art">${t.progress<3?physicalObject('cob',i,'<div class="corn"><div class="kernels"></div><div class="leaf left"></div><div class="leaf right"></div></div>',t.progress===0&&state.stock.corn<1?'玉米用完 · 请补货':'按住玉米 ↔ 来回摇晃'):physicalObject('grain',i,'<div class="grain-bowl">•••<br>•••••</div>','拖动粒碗 → 已开门的机器')}<div class="board"></div></div><div class="progress"><div style="width:${t.progress/3*100}%"></div></div></article>`).join(''));
 syncMarkup(pack,boxes.map((value,i)=>`<article data-key="box-${i}" class="worktable-unit" data-drop="box" data-index="${i}"><span class="unit-heading">纸盒 ${i+1}</span>${physicalObject('box',i,`<div class="box-scene"><div class="food-box ${value!==null?'filled '+value:''}"><div class="box-popcorn"></div><div class="carton"><span>★</span><b>POP!</b></div></div></div>`,value===null?'空纸盒 · 用铲子装入':value==='plain'?'原味 · 可撒料或拖给客人':flavors[value].name+' · 拖给客人')}</article>`).join(''));
 syncMarkup($('physical-tools'),`<div class="tool-shelf"><span class="tool-caption">铲子点击拿取 / 原料拖到目标松手</span>${physicalObject('scoop',0,`<div class="scoop-art">${heldScoop?'✿✿✿':''}</div>`,scoopEquipped?'铲子已拿起 · 点击放回':heldScoop?'点击拿起满铲 → 点击空盒':'点击拿起铲子 → 点击机器')}${Object.entries(jarNames).map(([key,name])=>physicalObject('jar',key,`<div class="jar-art jar-${key}"><i></i><b>${name}</b><span>${state.stock[key]} 份</span></div>`,key==='butter'?'奶油罐 → 已开门的机器':name+'罐 → 已装满的纸盒')).join('')}<div class="waste-bin" data-drop="trash">▤<small>废弃桶 · 拖入纸盒清空</small></div></div>`);
 if(gesture&&!active())cancelPhysicalGesture();
}
function physicalDrop(kind,index,target,targetIndex){
 if(!active())return false;
 const m=machines[targetIndex];
 if(target==='machine'){
  if(!m||!m.door||m.cooking>0){toast('先打开机门；烤制中无法操作');return false;}
  if(kind==='grain'){
   const table=prepTables[index];if(!table||table.progress!==3||m.loaded||m.ready)return false;
   table.progress=0;m.loaded=true;selectedPrep=Number(index);selectedMachine=targetIndex;return true;
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
function cancelPhysicalGesture(){gesture=null;$('object-ghost').hidden=true;document.querySelectorAll('.drop-highlight').forEach(el=>el.classList.remove('drop-highlight'));}
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
 });
 document.addEventListener('pointermove',e=>{
  scoopX=e.clientX;scoopY=e.clientY;updateScoopPointer();
  const g=gesture;if(!g||g.id!==e.pointerId)return;if(!active()){cancelPhysicalGesture();return;}
  e.preventDefault();g.moved ||= Math.hypot(e.clientX-g.x,e.clientY-g.y)>10;
  const ghost=$('object-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  if(g.kind==='cob'){
   const dx=e.clientX-g.anchor,dir=Math.sign(dx);
   if(Math.abs(dx)>=24){if(dir!==g.dir){g.turns++;g.dir=dir;if(g.turns%2===0&&shellCorn(Number(g.index))){beep(450);render();}}g.anchor=e.clientX;}
   if(prepTables[g.index].progress===3){toast('脱粒完成！把玉米粒碗拖进机器');cancelPhysicalGesture();render();}
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
  if(door){const m=machines[Number(door.dataset.door)];if(m.cooking===0){m.door=!m.door;render();}}
  if(power){const m=machines[Number(power.dataset.power)];if(!m.door&&startMachine(m)){beep(220);render();}}
 });
}

function resetScoop(){
 if(heldScoop)heldScoop.scooped=false;heldScoop=null;scoopEquipped=false;updateScoopPointer();
}
function updateScoopPointer(){
 const cursor=$('scoop-pointer');if(!cursor)return;
 cursor.hidden=!scoopEquipped||!active();
 if(!cursor.hidden){cursor.style.left=scoopX+'px';cursor.style.top=scoopY+'px';cursor.innerHTML='<div class="scoop-art">'+(heldScoop?'✿✿✿':'')+'</div><small>'+(heldScoop?'点击空纸盒装入':'点击已开门的出锅机器')+' · 右键放下</small>';}
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
