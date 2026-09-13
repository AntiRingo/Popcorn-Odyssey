'use strict';
const SAVE_KEY='popcorn-odyssey-v1';
const flavors={original:{name:'原味',price:18},caramel:{name:'焦糖',price:24},cheese:{name:'芝士',price:24},chili:{name:'辣椒',price:26}};
const upgradeCatalog={
 shell:{name:'自动脱粒臂',icon:'⚙',cost:65,description:'每秒脱粒一次，备好一批后停止。消耗库存玉米。'},
 feed:{name:'自动加料管',icon:'⇣',cost:85,description:'把脱好的玉米依次送入空闲机器，并自动加入库存奶油。'},
 cook:{name:'自动点火器',icon:'♨',cost:100,description:'机器原料齐全后自动爆制，6 秒出锅。'},
 procure:{name:'自动采购员',icon:'↻',cost:90,description:'库存不足 3 份时自动下单；优先玉米与奶油，余额不足时等待，配送不重复。'},
 prepTables:{name:'增设脱粒工作台',icon:'⚒',cost:80,description:'增加一个独立备料台，最多 4 台；自动脱粒升级覆盖全部工作台。'},
 packTables:{name:'增设包装台',icon:'▤',cost:80,description:'增加一个独立纸盒位，最多 4 台；可同时保存不同口味的成品。'},
 autoPack:{name:'自动装盒臂',icon:'⇧',cost:110,description:'将任意已出锅机器的爆米花装入空包装台；调味与交付仍由你操作。'},
 machines:{name:'增设爆米花机',icon:'▣',cost:120,description:'增加一台独立生产的机器，可同时爆制。最多 4 台。'}
};
const $=id=>document.getElementById(id);
const freshState=()=>({day:1,money:60,stock:{corn:8,butter:8,caramel:5,cheese:5,chili:5},totalServed:0,upgrades:{shell:false,feed:false,cook:false,machines:1,procure:false,prepTables:1,packTables:1,autoPack:false},lastRevenue:0,totalRevenue:0,market:null,nextMarket:null,phase:'ready',lastReport:null,mutationLevel:0,collection:{guests:{},ingredients:{}}});
const emptyMachine=()=>({loaded:false,buttered:false,cooking:0,ready:false});
let state=freshState(),run=false,paused=false,time=150,customers=[],deliveries=[],prepTables=[{progress:0,clock:0}],selectedPrep=0,boxes=[null],selectedBox=0,machines=[emptyMachine()],selectedMachine=0;
let served=0,revenue=0,expense=0,fines=0,lost=0,discounted=0,nextCustomer=0,seq=0,sound=true,audioContext,toastTimer,saved=null,saveOk=true;
function validReport(r){return r&&['day','served','revenue','expense','lost','discounted'].every(k=>Number.isFinite(r[k])&&r[k]>=0);}
function readSave(){
 try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(!s||![1,2,3,4,5].includes(s.version)||!Number.isInteger(s.day)||s.day<1||!Number.isFinite(s.money)||s.money<0||!s.stock||!Object.keys(goods).every(k=>Number.isInteger(s.stock[k])&&s.stock[k]>=0)||!Number.isInteger(s.totalServed)||s.totalServed<0)return null;
  const u=s.upgrades||{};
  return {...freshState(),day:s.day,money:s.money,stock:s.stock,totalServed:s.totalServed,
   upgrades:{shell:u.shell===true,feed:u.feed===true,cook:u.cook===true,procure:u.procure===true,autoPack:u.autoPack===true,prepTables:tableCount(u.prepTables),packTables:tableCount(u.packTables),machines:Number.isInteger(u.machines)?Math.max(1,Math.min(4,u.machines)):1},
   lastRevenue:Number.isFinite(s.lastRevenue)?Math.max(0,s.lastRevenue):0,totalRevenue:Number.isFinite(s.totalRevenue)&&s.totalRevenue>=0?s.totalRevenue:Math.max(0,Number(s.lastRevenue)||0),market:cleanMarket(s.market),nextMarket:cleanMarket(s.nextMarket),phase:['shop','newspaper'].includes(s.phase)?s.phase:'ready',lastReport:validReport(s.lastReport)?s.lastReport:null,mutationLevel:Number.isInteger(s.mutationLevel)?Math.max(0,Math.min(4,s.mutationLevel)):0,collection:cleanCollection(s.collection)};
 }catch{return null;}
}
function persist(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify({...state,version:5}));saved=JSON.parse(JSON.stringify(state));saveOk=true;}catch{saveOk=false;}
 $('save-state').textContent=saveOk?'● 进度已保存':'存档失败 · 请保留页面';return saveOk;
}
saved=readSave();
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function beep(freq=440){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.frequency.value=freq;o.type='triangle';g.gain.setValueAtTime(.045,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.12);o.start();o.stop(audioContext.currentTime+.13);}catch{}}
function modal(html,wide=false){$('overlay').innerHTML='<div class="modal '+(wide?'shop-modal':'')+'">'+html+'</div>';$('overlay').classList.remove('hidden');}
function hideModal(){$('overlay').classList.add('hidden');}
function manual(){return '<ol><li>点击脱粒三次，得到一批玉米粒。</li><li>倒入选中的机器、加入奶油，启动后等待 6 秒。</li><li>装盒并选择口味，再点击顾客交付。</li><li>库存不足时从进货区补货，4 秒送达。</li></ol><p>错口味也能交付，获得订单价格的 50%（向下取整）。每日结算后可购买自动脱粒、自动加料、自动爆制和额外机器；自动装盒可另行购买，调味与交付仍由你操作。所有机器同时显示，点击机身选择加料目标，也可直接点击各机的装盒按钮。</p><p>店铺累计营业额会逐渐吸引不同的来客。留意每日报纸中的行情与小道消息。猎枪可随时拿起，点击顾客射击；射击任何尚未攻击的顾客都会使其消失并赔偿 30 钱币（余额不足则扣至零）。袭击时会有红色动作预警：先拿起台上的猎枪，再点击袭击者反击；失败会惊吓失能 4 秒。</p>';}
function welcome(){
 modal('<div class="eyebrow">WELCOME TO NIGHT SHIFT</div><h2>夜很长。<br>来点热的吧。</h2><p>欢迎来到第 07 号爆米花营业所。每一天营业 150 秒。</p>'+manual()+'<button class="action" id="start">'+(saved?(saved.phase==='newspaper'?'阅读今日报纸':saved.phase==='shop'?'返回升级商店 · 准备第 '+saved.day+' 天':'继续营业 · 第 '+saved.day+' 天'):'开始第 1 天营业')+'</button>'+(saved?'<button class="text-btn" id="new">重新开始</button>':'')+'<button id="welcome-codex" class="secondary">翻阅营业所图鉴</button><p>结算及购买升级后自动存档。请使用同一浏览器与地址游玩。</p>');
 $('welcome-codex').onclick=()=>openCodex('ingredients',saved||state);
 $('start').onclick=()=>{if(saved)state=JSON.parse(JSON.stringify(saved));if(state.phase==='shop'||state.phase==='newspaper'){prepTables=Array.from({length:state.upgrades.prepTables},()=>({progress:0,clock:0}));boxes=Array(state.upgrades.packTables).fill(null);selectedPrep=0;selectedBox=0;machines=Array.from({length:state.upgrades.machines},emptyMachine);render();if(state.phase==='newspaper')showNewspaper();else showShop();}else startDay();};
 if($('new'))$('new').onclick=()=>{modal('<div class="eyebrow">NEW BUSINESS</div><h2>重新开张？</h2><p>新营业的首次结算将覆盖旧存档。</p><button class="action" id="confirm-new">从第 1 天开始</button><button class="secondary" id="back">返回</button>');$('confirm-new').onclick=()=>{state=freshState();startDay();};$('back').onclick=welcome;};
}
function demand(amount=state.lastRevenue){const level=mutationProfile().level;return {level,label:guestStages[level].name,interval:Math.max(2.5,11/(1+amount/150)),capacity:Math.min(6,3+Math.floor(amount/180))};}
function startDay(){state.mutationLevel=mutationProfile().level;if(state.nextMarket?.day===state.day)state.market={...state.nextMarket};else if(state.market?.day!==state.day)state.market=null;resetCombat();time=150;customers=[];deliveries=[];prepTables=Array.from({length:state.upgrades.prepTables},()=>({progress:0,clock:0}));boxes=Array(state.upgrades.packTables).fill(null);selectedPrep=0;selectedBox=0;machines=Array.from({length:state.upgrades.machines},emptyMachine);selectedMachine=0;served=0;revenue=0;expense=0;fines=0;lost=0;discounted=0;nextCustomer=demand().interval;run=true;paused=false;state.phase='ready';hideModal();addCustomer();render();beep(500);}
function addCustomer(){const d=demand();if(customers.length>=d.capacity)return;state.mutationLevel=mutationProfile().level;const flavor=seq===0?'original':rollFlavor(),patience=Math.max(38,65-state.day*2),mutation=rollMutation(),look=Math.floor(Math.random()*guestStages[mutation].names.length);const c={id:++seq,flavor,left:patience,max:patience,look,mutation,hostile:mutation>=2&&look===4&&Math.random()<.65,attack:'waiting',attackIn:8+Math.random()*10};customers.push(c);discoverGuest(c);}
function salePrice(c){const box=boxes[selectedBox];const mismatch=box!==null&&box!=='plain'&&box!==c.flavor;return Math.floor(orderPrice(c.flavor)*(mismatch?.5:1));}
function renderCustomers(){
 const box=boxes[selectedBox],sellable=box!==null&&box!=='plain';
 syncMarkup($('customers'),customers.map(c=>`<button class="customer ${c.attack==='windup'?'attacking':''} ${sellable?(box===c.flavor?'deliverable':'discount-delivery'):''}" data-customer="${c.id}" aria-label="交付${flavors[c.flavor].name}爆米花${sellable?'，实收'+salePrice(c)+'钱币':''}"><div class="order"><div class="order-top"><span>#${String(c.id).padStart(3,'0')} ${c.attack==='windup'?'⚠ 袭击预警':''}</span><span>${c.attack==='windup'?c.attackLeft.toFixed(1):Math.ceil(c.left)} 秒</span></div><strong>${flavors[c.flavor].name}爆米花</strong><b class="price">${salePrice(c)} ◈</b>${sellable&&box!==c.flavor?'<small class="discount-label">口味不符 · 半价收下</small>':''}<div class="patience"><div style="width:${c.left/c.max*100}%;background:${c.left<15?'#ad5344':'#748b6b'}"></div></div></div>${portrait(c.look,c.mutation)}${c.attack==='windup'?'<span class="attack-caption">正在扑来 · 拿枪反击</span>':''}</button>`).join('')+Array.from({length:Math.max(0,3-customers.length)},()=>'<div class="empty-customer">等待下一位顾客</div>').join('')); 
 document.querySelectorAll('[data-customer]').forEach(el=>el.onclick=()=>customerAction(Number(el.dataset.customer)));
}
function machineLabel(m){return m.ready?'已出锅':m.cooking>0?'爆制 '+Math.ceil(m.cooking)+'s':m.loaded?(m.buttered?'待启动':'缺奶油'):'空闲';}
function render(){
 const prep=prepTables[selectedPrep].progress,box=boxes[selectedBox],m=machines[selectedMachine],off=!active(),d=demand();
 $('day').textContent='DAY '+String(state.day).padStart(2,'0');$('money').textContent=state.money;$('time').textContent=String(Math.floor(Math.ceil(time)/60)).padStart(2,'0')+':'+String(Math.ceil(time)%60).padStart(2,'0');
 $('served').textContent='今日 '+served+' 单 · 昨日 '+state.lastRevenue+'◈ · 等候容量 '+d.capacity+' 位';$('revenue').textContent='+'+revenue+' ◈';$('expense').textContent='−'+expense+' ◈';$('lost').textContent=lost;
 syncMarkup($('supplies'),Object.entries(goods).map(([key,g])=>{const delivery=deliveries.find(x=>x.key===key);return `<div data-key="supply-${key}" class="supply-item"><span class="supply-icon">${g.icon}</span><div class="supply-info">${g.name} <small>库存 ${state.stock[key]} 份</small></div><button class="buy" data-buy="${key}" ${off||delivery||state.money<procurementPrice(key)?'disabled':''}>${delivery?'配送 '+Math.ceil(delivery.left)+'s':'+'+g.qty+' / '+procurementPrice(key)+'◈'}</button></div>`;}).join(''));document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
 $('shell').disabled=off||prep>=3||(prep===0&&state.stock.corn<1);$('shell').textContent=prep===0?'取玉米 · 开始脱粒':prep<3?'继续脱粒 · '+prep+'/3':'脱粒完成 ✓';
 $('load').disabled=off||!prepTables.some(t=>t.progress===3)||m.loaded||m.cooking>0||m.ready;$('load').textContent=m.loaded?'玉米已加入 ✓':'倒入玉米';$('butter').disabled=off||m.buttered||!m.loaded||state.stock.butter<1||m.cooking>0||m.ready;$('butter').textContent=m.buttered?'奶油已加入 ✓':'＋ 奶油';
 $('cook').disabled=off||!m.loaded||!m.buttered||m.cooking>0||m.ready;$('cook').textContent=m.cooking>0?'爆制中 · '+Math.ceil(m.cooking)+'s':m.ready?'爆米花已出锅 ✓':'启动爆米花机';
 $('machine-hint').textContent='加料 '+(state.upgrades.feed?'自动':'手动')+' · 点火 '+(state.upgrades.cook?'自动':'手动')+' · 爆制 6 秒';
 renderFleet(off);renderWorktables(off);renderCombat();
 $('pack').disabled=off||!m.ready||box!==null;$('pack').textContent='从 '+(selectedMachine+1)+' 号机装盒';document.querySelectorAll('[data-flavor]').forEach(b=>{b.disabled=off||box!=='plain';b.classList.toggle('selected',box===b.dataset.flavor);});$('discard').disabled=off||box===null;
 const step=box!==null?4:m.ready?3:m.loaded||m.cooking>0?2:1;for(let i=1;i<=4;i++)$('step'+i).classList.toggle('active',step===i);
 $('instruction').textContent=box!==null?(box==='plain'?'选择口味后点击顾客交付。':'点击顾客交付：符合口味全价，口味不符半价。'):m.ready?'当前机器已出锅，装盒后可开始下一批。':m.cooking>0?'机器正在加热。可以提前脱粒，或切换到其他机器。':m.loaded?(m.buttered?'原料齐全，等待点火。':'机器需要一份奶油。'):'准备玉米粒并加入机器。已购自动化会自动处理对应步骤。';renderCustomers();
}
function active(){return shiftRunning()&&stun===0&&!armed;}
function buy(key,automatic=false){if(!(automatic?shiftRunning():active())||!goods[key])return;const g=goods[key],cost=procurementPrice(key);if(state.money<cost||deliveries.some(d=>d.key===key))return;state.money-=cost;expense+=cost;deliveries.push({key,left:4});beep(300);render();}
function shellCorn(index=selectedPrep){const table=prepTables[index];if(!table||table.progress>=3)return false;if(table.progress===0){if(state.stock.corn<1)return false;state.stock.corn--;recordIngredient('corn');}table.progress++;return true;}
function loadMachine(m){const table=prepTables.find(t=>t.progress===3);if(!table||m.loaded||m.cooking>0||m.ready)return false;table.progress=0;m.loaded=true;return true;}
function addButter(m){if(!m.loaded||m.buttered||m.cooking>0||m.ready||state.stock.butter<1)return false;state.stock.butter--;recordIngredient('butter');m.buttered=true;return true;}
function startMachine(m){if(!m.loaded||!m.buttered||m.cooking>0||m.ready)return false;m.cooking=6;return true;}
function advanceProduction(dt){
 machines.forEach((m,i)=>{if(m.cooking>0){m.cooking=Math.max(0,m.cooking-dt);if(m.cooking===0){m.ready=true;toast((i+1)+' 号机爆米花出锅了');beep(800);}}});
 if(state.upgrades.shell)prepTables.forEach((table,index)=>{if(table.progress<3&&(table.progress>0||state.stock.corn>0)){table.clock+=dt;while(table.clock>=1&&table.progress<3){table.clock-=1;shellCorn(index);}}else table.clock=0;});
 machines.forEach(m=>{if(state.upgrades.feed){loadMachine(m);addButter(m);}if(state.upgrades.cook)startMachine(m);});
 if(state.upgrades.autoPack)machines.forEach((m,i)=>{if(m.ready){const slot=boxes.indexOf(null);if(slot>=0)transferPopcorn(i,slot);}});
}
$('shell').onclick=()=>{if(active()&&shellCorn()){beep(320+prepTables[selectedPrep].progress*100);render();}};
$('load').onclick=()=>{if(active()&&loadMachine(machines[selectedMachine])){beep();render();}};
$('butter').onclick=()=>{if(active()&&addButter(machines[selectedMachine])){beep(400);render();}};
$('cook').onclick=()=>{if(active()&&startMachine(machines[selectedMachine])){beep(220);render();}};
function transferPopcorn(index,slot){const m=machines[index];if(!m||!m.ready||boxes[slot]!==null)return false;boxes[slot]='plain';machines[index]=emptyMachine();return true;}
function packMachine(index){if(!active())return;if(transferPopcorn(index,selectedBox)){selectedMachine=index;beep(650);render();}else toast(boxes[selectedBox]!==null?'当前包装台已占用，请选择空位或先交付':'这台机器还未出锅');}
$('pack').onclick=()=>packMachine(selectedMachine);
function seasonBox(index,f){if(!active()||boxes[index]!=='plain'||!flavors[f])return;if(f!=='original'){if(state.stock[f]<1){toast('佐料不足，请先从进货区补货');return;}state.stock[f]--;recordIngredient(f);}boxes[index]=f;selectedBox=index;beep(750);render();}
document.querySelectorAll('[data-flavor]').forEach(b=>b.onclick=()=>seasonBox(selectedBox,b.dataset.flavor));
$('discard').onclick=()=>{if(!active()||boxes[selectedBox]===null)return;boxes[selectedBox]=null;toast('已清空纸盒，原料不返还');render();};
function serve(id){
 if(!active())return;const box=boxes[selectedBox],c=customers.find(c=>c.id===id);if(!c)return;if(box===null||box==='plain'){toast('先装盒并选择口味');return;}
 const mismatch=box!==c.flavor,price=salePrice(c);if(mismatch)discounted++;
 state.money+=price;revenue+=price;state.totalRevenue+=price;served++;state.totalServed++;boxes[selectedBox]=null;customers=customers.filter(x=>x.id!==id);nextCustomer=Math.min(nextCustomer,demand().interval*.3);
 toast((mismatch?'口味不符，顾客半价收下':'订单完成')+'！ +'+price+' 钱币');beep(mismatch?330:950);render();
}
function endDay(){
 if(!run)return;run=false;paused=false;deliveries.forEach(d=>state.stock[d.key]+=goods[d.key].qty);deliveries=[];
 state.lastReport={day:state.day,served,revenue,expense,lost,discounted,fines};state.lastRevenue=revenue;state.day++;state.nextMarket=makeNewspaper(state.day);state.phase='newspaper';resetCombat();prepTables=Array.from({length:state.upgrades.prepTables},()=>({progress:0,clock:0}));boxes=Array(state.upgrades.packTables).fill(null);selectedPrep=0;selectedBox=0;machines=Array.from({length:state.upgrades.machines},emptyMachine);selectedMachine=0;
 if(state.money<12&&(state.stock.corn===0||state.stock.butter===0)){state.stock.corn+=3;state.stock.butter+=3;state.lastReport.rescue=true;}
 persist();render();showNewspaper();
}
function upgradeCost(key){return key==='machines'?120+(state.upgrades.machines-1)*80:['prepTables','packTables'].includes(key)?80+(state.upgrades[key]-1)*60:upgradeCatalog[key].cost;}
function upgradeMaxed(key){return ['machines','prepTables','packTables'].includes(key)?state.upgrades[key]>=4:state.upgrades[key];}
function purchaseUpgrade(key){
 if(run||state.phase!=='shop'||!upgradeCatalog[key]||upgradeMaxed(key))return;const cost=upgradeCost(key);if(state.money<cost)return;
 state.money-=cost;if(key==='machines'){state.upgrades.machines++;machines.push(emptyMachine());}else if(key==='prepTables'){state.upgrades.prepTables++;prepTables.push({progress:0,clock:0});}else if(key==='packTables'){state.upgrades.packTables++;boxes.push(null);}else state.upgrades[key]=true;
 persist();render();showShop();beep(700);toast(upgradeCatalog[key].name+'已安装'+(saveOk?' · 已存档':' · 存档失败，请保留页面'));
}
function showShop(){
 const r=state.lastReport;
 modal('<div class="eyebrow">AFTER HOURS / EQUIPMENT SHOP</div><h2>打烊了，升级吧。</h2>'+(r?`<div class="daily-summary"><span>第 ${r.day} 天 · ${r.served} 单（折价 ${r.discounted} 单）</span><span>收入 <b>+${r.revenue} ◈</b> / 进货 −${r.expense} ◈ / 误伤赔偿 −${r.fines||0} ◈ / 流失 ${r.lost} 人</span></div>`:'')+`<div class="shop-balance">可用钱币 <b>${state.money} ◈</b></div><div class="upgrade-grid">`+Object.entries(upgradeCatalog).map(([key,u])=>{const maxed=upgradeMaxed(key),cost=upgradeCost(key);return `<div class="upgrade-card"><span class="upgrade-icon">${u.icon}</span><h3>${u.name}${['machines','prepTables','packTables'].includes(key)?' · '+state.upgrades[key]+'/4 台':''}</h3><p>${u.description}</p><button class="secondary" data-upgrade="${key}" ${maxed||state.money<cost?'disabled':''}>${maxed?'已安装 ✓':state.money<cost?'需 '+cost+' ◈ · 余额不足':'购买 · '+cost+' ◈'}</button></div>`;}).join('')+`</div><p class="save-note">${saveOk?'✓ 结算及升级购买均已保存，可关闭页面后返回商店。':'存档失败，请允许浏览器本地存储并保留页面。'} 未完成食品清理，已付补货入库。${r&&r.rescue?'总部补给：玉米和奶油各 3 份。':''}</p><button id="shop-paper" class="secondary">重读今日报纸</button><button id="shop-codex" class="secondary">营业所图鉴 · 查看收藏</button><button id="next" class="action">开始第 ${state.day} 天 →</button>`,true);
 document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>purchaseUpgrade(b.dataset.upgrade));$('next').onclick=startDay;$('shop-paper').onclick=showNewspaper;$('shop-codex').onclick=()=>openCodex();
}
function pauseGame(help=false){if(!run||paused)return;paused=true;render();modal('<div class="eyebrow">TAKE A BREATH</div><h2>'+(help?'营业操作手册':'营业已暂停')+'</h2>'+(help?manual():'<p>顾客、所有机器、自动脱粒、配送和营业计时均已暂停。</p>')+'<button class="action" id="resume">继续营业 →</button>');$('resume').onclick=()=>{paused=false;hideModal();render();};}
$('pause').onclick=()=>pauseGame();$('help').onclick=()=>{if(run)pauseGame(true);};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♪':'×';$('sound').title=sound?'关闭声音':'开启声音';if(sound)beep();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&codexOpen){closeCodex();return;}if(e.key==='Escape'&&run){if(paused&&$('resume'))$('resume').click();else pauseGame();}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&run&&!paused)pauseGame();});
function tableCount(value){return Number.isInteger(value)?Math.max(1,Math.min(4,value)):1;}
function autoProcure(){if(!shiftRunning()||!state.upgrades.procure)return;for(const key of Object.keys(goods))if(state.stock[key]<3)buy(key,true);}
let last=performance.now(),paint=0;
function tick(now){
 const dt=Math.min((now-last)/1000,.5);last=now;
 if(shiftRunning()){
  time=Math.max(0,time-dt);if(time<=0)endDay();else{
   advanceCombat(dt);advanceProduction(dt);autoProcure();
   deliveries.forEach(d=>d.left-=dt);deliveries=deliveries.filter(d=>{if(d.left<=0){state.stock[d.key]+=goods[d.key].qty;toast(goods[d.key].name+'已送达 · +'+goods[d.key].qty);return false;}return true;});
   customers.forEach(c=>{if(c.attack!=='windup')c.left-=dt;});customers=customers.filter(c=>{if(c.left<=0){lost++;toast('一位顾客等太久离开了');return false;}return true;});
   nextCustomer-=dt;if(nextCustomer<=0){addCustomer();nextCustomer=demand().interval*(.85+Math.random()*.3);}paint+=dt;if(paint>=.2){render();paint=0;}
  }
 }
 requestAnimationFrame(tick);
}
$('shotgun').onclick=takeShotgun;$('fire-shotgun').onclick=()=>shoot();
$('codex').onclick=()=>openCodex();
render();welcome();requestAnimationFrame(tick);
