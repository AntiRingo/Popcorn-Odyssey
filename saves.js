'use strict';
const SAVE_LIBRARY_KEY='popcorn-odyssey-slots-v1';
let saveLibrary={version:1,activeId:null,slots:[]},saveManagerOpen=false,saveManagerReturn=null;
const cloneSave=value=>JSON.parse(JSON.stringify(value));
const saveText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function writeSaveLibrary(next){
 try{localStorage.setItem(SAVE_LIBRARY_KEY,JSON.stringify(next));saveLibrary=next;saveOk=true;return true;}
 catch{saveOk=false;toast('存档写入失败，请保留页面并检查浏览器存储空间');return false;}
}
function initializeSaveLibrary(){
 try{
  const raw=localStorage.getItem(SAVE_LIBRARY_KEY);
  if(raw){
   const value=JSON.parse(raw);
   if(value.version!==1||!Array.isArray(value.slots))throw Error('invalid saves');
   const ids=new Set();
   saveLibrary={version:1,activeId:value.activeId,slots:value.slots.filter(slot=>{
    if(!slot||typeof slot.id!=='string'||ids.has(slot.id)||!readSave(slot.data))return false;ids.add(slot.id);return true;
   }).map(slot=>({...slot,name:String(slot.name||'未命名存档').slice(0,30)}))};
   if(!saveLibrary.slots.some(s=>s.id===saveLibrary.activeId))saveLibrary.activeId=saveLibrary.slots[0]?.id??null;
  }else{
   const legacy=readSave();
   if(legacy){saveLibrary.slots=[{id:'legacy',name:'原有存档',updatedAt:Date.now(),data:{...legacy,version:5},runtime:null}];saveLibrary.activeId='legacy';writeSaveLibrary(saveLibrary);}
  }
 }catch{saveOk=false;}
 return readSave(saveLibrary.slots.find(s=>s.id===saveLibrary.activeId)?.data??null);
}
function shiftSnapshot(){
 if(!run)return null;
 return cloneSave({time,customers,deliveries,prepTables,boxes,machines:machines.map(m=>({...m,scooped:false})),selectedPrep,selectedBox,selectedMachine,served,revenue,expense,fines,lost,discounted,nextCustomer,seq,stun,reload,attackCooldown});
}
function newSaveId(){return 'slot-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function storeCurrentSave(){
 const next=cloneSave(saveLibrary);let slot=next.slots.find(s=>s.id===next.activeId);
 if(!slot){slot={id:newSaveId(),name:'营业所 '+(next.slots.length+1)};next.slots.push(slot);next.activeId=slot.id;}
 slot.data={...cloneSave(state),version:5};slot.runtime=run?shiftSnapshot():(state.phase==='ready'?slot.runtime??null:null);slot.updatedAt=Date.now();
 const success=writeSaveLibrary(next);if(success)saved=cloneSave(state);
 $('save-state').textContent=success?'● '+slot.name+' 已保存':'存档失败 · 请保留页面';return success;
}
function validShiftSnapshot(s){
 const nonnegative=n=>Number.isFinite(n)&&n>=0;
 if(!s||!['time','served','revenue','expense','fines','lost','discounted','nextCustomer','seq','stun','reload','attackCooldown'].every(k=>nonnegative(s[k]))||s.time>150)return false;
 if(!Array.isArray(s.machines)||s.machines.length!==state.upgrades.machines||!s.machines.every(m=>m&&typeof m.loaded==='boolean'&&typeof m.buttered==='boolean'&&typeof m.ready==='boolean'&&nonnegative(m.cooking)&&m.cooking<=6))return false;
 if(!Array.isArray(s.prepTables)||s.prepTables.length!==state.upgrades.prepTables||!s.prepTables.every(t=>t&&Number.isInteger(t.progress)&&t.progress>=0&&t.progress<=3&&nonnegative(t.clock)))return false;
 if(!Array.isArray(s.boxes)||s.boxes.length!==state.upgrades.packTables||!s.boxes.every(b=>b===null||b==='plain'||Object.hasOwn(flavors,b)))return false;
 if(!Array.isArray(s.deliveries)||!s.deliveries.every(d=>d&&Object.hasOwn(goods,d.key)&&nonnegative(d.left)))return false;
 if(!Array.isArray(s.customers)||!s.customers.every(c=>c&&Number.isInteger(c.id)&&c.id>0&&Object.hasOwn(flavors,c.flavor)&&nonnegative(c.left)&&nonnegative(c.max)&&c.max>0&&Number.isInteger(c.look)&&c.look>=0&&Number.isInteger(c.mutation)&&c.mutation>=0&&c.mutation<=4&&['waiting','windup','spent'].includes(c.attack)&&Number.isFinite(c.attackIn)&&(c.attack!=='windup'||nonnegative(c.attackLeft))))return false;
 return [['selectedPrep',s.prepTables],['selectedBox',s.boxes],['selectedMachine',s.machines]].every(([key,items])=>Number.isInteger(s[key])&&s[key]>=0&&s[key]<items.length);
}
function resumeSavedShift(){
 const snapshot=saveLibrary.slots.find(s=>s.id===saveLibrary.activeId)?.runtime;
 if(!validShiftSnapshot(snapshot))return false;
 const s=cloneSave(snapshot);({time,customers,deliveries,prepTables,boxes,machines,selectedPrep,selectedBox,selectedMachine,served,revenue,expense,fines,lost,discounted,nextCustomer,seq,stun,reload,attackCooldown}=s);
 armed=false;shotFlash=0;run=true;paused=false;hideModal();render();return true;
}
function resetForSave(data){
 run=false;paused=false;resetCombat();if(typeof resetScoop==='function')resetScoop();if(typeof cancelPhysicalGesture==='function')cancelPhysicalGesture();
 state=readSave(data);saved=cloneSave(state);customers=[];deliveries=[];prepTables=Array.from({length:state.upgrades.prepTables},()=>({progress:0,clock:0}));boxes=Array(state.upgrades.packTables).fill(null);machines=Array.from({length:state.upgrades.machines},emptyMachine);selectedPrep=selectedBox=selectedMachine=0;render();
}
function openSaveManager(){
 if(saveManagerOpen||codexOpen)return;
 saveManagerReturn={run,paused};saveManagerOpen=true;paused=true;render();drawSaveManager();
}
function drawSaveManager(){
 modal(`<div class="eyebrow">SAVE FILES / 营业档案</div><h2>管理存档</h2><p>每份档案独立记录钱币、库存、升级和图鉴。保存与切换会记录当前倒计时、顾客和制作进度；满铲的食物恢复在原机器中。</p><div class="save-create"><input id="save-name" maxlength="30" placeholder="新存档名称" aria-label="新存档名称"><button id="create-save" class="secondary">创建新存档</button></div><div class="save-list">${saveLibrary.slots.map(slot=>`<article class="save-card"><div><b>${saveText(slot.name)}</b>${slot.id===saveLibrary.activeId?'<span class="save-current">当前</span>':''}<p>第 ${slot.data.day} 天 · ${slot.data.money} ◈ · 累计 ${slot.data.totalServed} 单<br>${slot.runtime?'营业中 · 剩余 '+Math.ceil(slot.runtime.time)+' 秒':slot.data.phase==='newspaper'?'待阅报纸':slot.data.phase==='shop'?'升级商店':'等待营业'} · ${slot.updatedAt?saveText(new Date(slot.updatedAt).toLocaleString()):'尚未保存'}</p></div><div class="save-actions"><button data-save-load="${saveText(slot.id)}" ${slot.id===saveLibrary.activeId?'disabled':''}>读取</button><button data-save-rename="${saveText(slot.id)}">重命名</button><button data-save-delete="${saveText(slot.id)}">删除</button></div></article>`).join('')||'<p>暂无存档，创建一个新的营业档案吧。</p>'}</div><button id="save-now" class="action">保存当前进度</button><button id="close-saves" class="secondary">返回游戏</button>`,true);
 $('create-save').onclick=()=>createSaveSlot($('save-name').value);
 $('save-now').onclick=()=>{if(storeCurrentSave()){toast('当前进度已保存');drawSaveManager();}};
 $('close-saves').onclick=closeSaveManager;
 document.querySelectorAll('[data-save-load]').forEach(b=>b.onclick=()=>switchSaveSlot(b.dataset.saveLoad));
 document.querySelectorAll('[data-save-rename]').forEach(b=>b.onclick=()=>editSaveName(b.dataset.saveRename));
 document.querySelectorAll('[data-save-delete]').forEach(b=>b.onclick=()=>confirmDeleteSave(b.dataset.saveDelete));
}
function closeSaveManager(){
 saveManagerOpen=false;const previous=saveManagerReturn;saveManagerReturn=null;
 if(run){paused=previous?.paused??false;render();if(paused){paused=false;pauseGame();}else hideModal();}
 else if(state.phase==='newspaper')showNewspaper();else if(state.phase==='shop')showShop();else welcome();
}
function preserveBeforeSwitch(){return (!run&&!saveLibrary.activeId)||storeCurrentSave();}
function createSaveSlot(name){
 if(!preserveBeforeSwitch())return false;
 const next=cloneSave(saveLibrary),id=newSaveId();next.slots.push({id,name:String(name||'新营业所').trim().slice(0,30)||'新营业所',updatedAt:Date.now(),data:{...freshState(),version:5},runtime:null});next.activeId=id;
 if(!writeSaveLibrary(next))return false;resetForSave(next.slots.at(-1).data);saveManagerOpen=false;saveManagerReturn=null;welcome();return true;
}
function switchSaveSlot(id){
 if(id===saveLibrary.activeId||!saveLibrary.slots.some(s=>s.id===id)||!preserveBeforeSwitch())return false;
 const next=cloneSave(saveLibrary);next.activeId=id;if(!writeSaveLibrary(next))return false;
 resetForSave(next.slots.find(s=>s.id===id).data);saveManagerOpen=false;saveManagerReturn=null;welcome();return true;
}
function renameSaveSlot(id,name){
 const value=String(name||'').trim().slice(0,30);if(!value)return false;
 const next=cloneSave(saveLibrary),slot=next.slots.find(s=>s.id===id);if(!slot)return false;slot.name=value;return writeSaveLibrary(next);
}
function editSaveName(id){
 const slot=saveLibrary.slots.find(s=>s.id===id);if(!slot)return;
 modal(`<h2>重命名存档</h2><input id="rename-value" maxlength="30" aria-label="存档名称" value="${saveText(slot.name)}"><button id="rename-ok" class="action">保存名称</button><button id="rename-back" class="secondary">取消</button>`);
 $('rename-ok').onclick=()=>{if(renameSaveSlot(id,$('rename-value').value))drawSaveManager();else toast('请输入名称，并确认浏览器允许写入存档');};$('rename-back').onclick=drawSaveManager;
}
function confirmDeleteSave(id){
 const slot=saveLibrary.slots.find(s=>s.id===id);if(!slot)return;
 modal(`<h2>删除这份存档？</h2><p>「${saveText(slot.name)}」的进度将永久删除。${id===saveLibrary.activeId?'当前营业也会结束。':''}</p><button id="delete-save-ok" class="action">确认删除</button><button id="delete-save-back" class="secondary">保留存档</button>`);
 $('delete-save-ok').onclick=()=>{if(deleteSaveSlot(id))drawSaveManager();};$('delete-save-back').onclick=drawSaveManager;
}
function deleteSaveSlot(id){
 const next=cloneSave(saveLibrary);if(!next.slots.some(s=>s.id===id))return false;
 next.slots=next.slots.filter(s=>s.id!==id);const current=next.activeId===id;if(current)next.activeId=next.slots[0]?.id??null;
 if(!writeSaveLibrary(next))return false;
 if(current){resetForSave(next.slots[0]?.data??{...freshState(),version:5});if(!next.activeId)saved=null;saveManagerReturn={run:false,paused:false};paused=true;}
 return true;
}
