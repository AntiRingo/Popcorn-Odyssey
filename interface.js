'use strict';
let codexOpen=false,codexWasPaused=false,codexSource=null,codexReturnFocus=null;
function cleanCollection(value){
 const result={guests:{},ingredients:{}};
 if(!value||typeof value!=='object')return result;
 for(const [key,item] of Object.entries(value.guests||{})){
  if(/^[0-4]-[0-4]$/.test(key)&&item&&Number.isInteger(item.count)&&item.count>0&&Number.isInteger(item.firstDay)&&item.firstDay>0)result.guests[key]={count:item.count,firstDay:item.firstDay};
 }
 for(const key of Object.keys(ingredientEntries))if(Number.isInteger(value.ingredients?.[key])&&value.ingredients[key]>=0)result.ingredients[key]=value.ingredients[key];
 return result;
}
function discoverGuest(c){
 const key=c.mutation+'-'+c.look%guestVariantCount,entry=state.collection.guests[key];
 if(entry)entry.count++;else{state.collection.guests[key]={count:1,firstDay:state.day};toast('客人图鉴已收录 · '+guestStages[c.mutation].names[c.look%guestVariantCount]);}
}
function recordIngredient(key){state.collection.ingredients[key]=(state.collection.ingredients[key]||0)+1;}
function renderFleet(off){
 const box=boxes[selectedBox];
 const fleet=$('machine-fleet');fleet.className='machine-fleet fleet-count-'+machines.length;
 syncMarkup(fleet,machines.map((m,i)=>`<article data-key="machine-${i}" class="machine-unit ${selectedMachine===i?'selected':''}"><button class="machine-select" data-machine="${i}" aria-label="选择 ${i+1} 号爆米花机，${machineLabel(m)}" aria-pressed="${selectedMachine===i}" ${off?'disabled':''}><span class="unit-heading">${i+1} 号机 <small>${selectedMachine===i?'操作中':'点击选择'}</small></span><div class="machine ${m.cooking>0?'cooking':m.ready?'ready':''}"><div class="machine-roof">ODYSSEY <span>★</span></div><div class="machine-glass"><div class="pot"></div><div class="popcorn-pile"></div><div class="heat-glow"></div></div><div class="machine-base"><span></span><b>${machineLabel(m)}</b><i>◉</i></div></div></button><button class="unit-pack" data-pack="${i}" ${off||!m.ready||box!==null?'disabled':''}>${m.ready?'装盒 ↑':m.cooking>0?'爆制 '+Math.ceil(m.cooking)+'s':'等待出锅'}</button></article>`).join('')); 
 document.querySelectorAll('[data-machine]').forEach(b=>b.onclick=()=>{if(active()){selectedMachine=Number(b.dataset.machine);render();}});
 document.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>packMachine(Number(b.dataset.pack)));
}
function renderWorktables(off){
 const prepArea=$('prep-tables'),packArea=$('pack-tables');
 prepArea.className='worktable-fleet table-count-'+prepTables.length;
 packArea.className='worktable-fleet table-count-'+boxes.length;
 syncMarkup(prepArea,prepTables.map((t,i)=>`<article data-key="prep-${i}" class="worktable-unit ${i===selectedPrep?'selected':''}"><button class="table-select" data-prep="${i}" aria-label="选择脱粒台 ${i+1}" aria-pressed="${i===selectedPrep}" ${off?'disabled':''}><span class="unit-heading">脱粒台 ${i+1}<small>${t.progress}/3</small></span><div class="prep-art"><div class="corn" style="opacity:${t.progress===3?.15:1}"><div class="kernels"></div><div class="leaf left"></div><div class="leaf right"></div></div><div class="board"></div><div class="shelled-grains" style="opacity:${t.progress/3}">•••<br>••••</div></div></button><div class="progress"><div style="width:${t.progress/3*100}%"></div></div><button data-shell="${i}" class="unit-pack" ${off||t.progress>=3||(t.progress===0&&state.stock.corn<1)?'disabled':''}>${t.progress===3?'备料完成':state.upgrades.shell?'自动脱粒 · 可助力':'脱粒 · '+t.progress+'/3'}</button></article>`).join(''));
 syncMarkup(packArea,boxes.map((value,i)=>`<article data-key="box-${i}" class="worktable-unit ${i===selectedBox?'selected':''}"><button class="table-select" data-box="${i}" aria-label="选择包装台 ${i+1}，${value===null?'空纸盒':value==='plain'?'待调味':flavors[value].name}" aria-pressed="${i===selectedBox}" ${off?'disabled':''}><span class="unit-heading">包装台 ${i+1}<small>${i===selectedBox?'交付目标':''}</small></span><div class="box-scene"><div class="food-box ${value!==null?'filled '+value:''}"><div class="box-popcorn"></div><div class="carton"><span>★</span><b>POP!</b></div></div><div class="shelf-shadow"></div></div><span class="box-state">${value===null?'空纸盒':value==='plain'?'待调味':flavors[value].name+'成品'}</span></button><button data-fill-box="${i}" class="unit-pack" ${off||value!==null||!machines.some(m=>m.ready)?'disabled':''}>装入爆米花</button><div class="table-flavors">${Object.entries(flavors).map(([f,info])=>`<button data-season="${f}" data-slot="${i}" class="${value===f?'selected':''}" ${off||value!=='plain'?'disabled':''}>${info.name}</button>`).join('')}</div></article>`).join(''));
 document.querySelectorAll('[data-prep]').forEach(b=>b.onclick=()=>{if(active()){selectedPrep=Number(b.dataset.prep);render();}});
 document.querySelectorAll('[data-shell]').forEach(b=>b.onclick=()=>{const index=Number(b.dataset.shell);if(active()&&shellCorn(index)){selectedPrep=index;beep(400);render();}});
 document.querySelectorAll('[data-box]').forEach(b=>b.onclick=()=>{if(active()){selectedBox=Number(b.dataset.box);render();}});
 document.querySelectorAll('[data-fill-box]').forEach(b=>b.onclick=()=>{if(!active())return;const index=Number(b.dataset.fillBox),machine=machines[selectedMachine]?.ready?selectedMachine:machines.findIndex(m=>m.ready);if(machine>=0&&transferPopcorn(machine,index)){selectedBox=index;selectedMachine=machine;beep(650);render();}});
 document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>seasonBox(Number(b.dataset.slot),b.dataset.season));
}
function openCodex(tab='ingredients',source=state){
 if(!codexOpen){codexWasPaused=paused;codexReturnFocus=document.activeElement;codexSource=source;if(run){paused=true;render();}codexOpen=true;}
 drawCodex(tab);
}
function closeCodex(){
 if(!codexOpen)return;codexOpen=false;$('codex-overlay').classList.add('hidden');
 if(run){paused=codexWasPaused;render();}codexReturnFocus?.focus?.();
}
function drawCodex(tab){
 const source=codexSource,guestCount=Object.keys(source.collection.guests).length;
 let content='';
 if(tab==='ingredients'){
  content=Object.entries(ingredientEntries).map(([key,entry])=>`<article class="encyclopedia-entry ingredient-entry"><div class="specimen ingredient-${key}">${goods[key].icon}</div><small>${entry.tag}</small><h3>${goods[key].name}</h3><p>${entry.description}</p><p class="entry-rule">${entry.usage}</p><div class="entry-metrics">进货 ${goods[key].cost} ◈ / ${goods[key].qty} 份<br>库存 ${source.stock[key]} · 累计使用 ${source.collection.ingredients[key]||0} 份</div></article>`).join('');
 }else{
  content=guestStages.map((stage,level)=>stage.names.map((name,variant)=>{
   const record=source.collection.guests[level+'-'+variant],id=String(level*guestVariantCount+variant+1).padStart(2,'0');
   return `<article class="encyclopedia-entry guest-entry ${record?'':'entry-locked'}"><div class="specimen">${record?portrait(variant,level):'<span class="unknown-portrait">?</span>'}</div><small>客人档案 C-${id} · ${record?'已遇见':'未遇见'}</small><h3>${record?name:'未记录的来客'}</h3><p>${record?stage.note:'继续营业，遇见新的顾客后自动收录。'}</p>${record?`<p class="entry-rule">观察：${stage.tells[variant]}</p><div class="entry-metrics">${stage.name} · 阶段 ${level}/4<br>初见于第 ${record.firstDay} 天 · 遇见 ${record.count} 次</div>`:''}</article>`;
  }).join('')).join('');
 }
 $('codex-overlay').innerHTML=`<section class="modal codex-modal"><div class="codex-heading"><div><small class="eyebrow">ODYSSEY / FIELD ARCHIVE</small><h2>营业所图鉴</h2></div><button id="close-codex" class="secondary">返回 ×</button></div><div class="codex-tabs"><button id="codex-ingredients" class="${tab==='ingredients'?'selected':''}" aria-pressed="${tab==='ingredients'}">原料图鉴 · 5/5</button><button id="codex-guests" class="${tab==='guests'?'selected':''}" aria-pressed="${tab==='guests'}">客人图鉴 · ${guestCount}/${guestEntryCount}</button></div><p class="codex-note">${run?'查阅期间营业已暂停。':'营业所的采购记录与来客观察。'} 原料资料全部开放；客人按遇见收录，随每日结算保存。</p><div class="encyclopedia-grid">${content}</div></section>`;
 $('codex-overlay').classList.remove('hidden');$('close-codex').onclick=closeCodex;$('codex-ingredients').onclick=()=>drawCodex('ingredients');$('codex-guests').onclick=()=>drawCodex('guests');$('close-codex').focus?.();
}
