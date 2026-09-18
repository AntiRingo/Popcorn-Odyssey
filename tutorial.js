'use strict';
let tutorial=null;
function tutorialActive(){return tutorial!==null;}
function startTutorial(){
 if(tutorialActive()||codexOpen||saveManagerOpen)return;
 // Keep the real shift in memory; practice never enters the save library.
 cancelPhysicalGesture();resetScoop();
 tutorial={backup:{state,run,paused,time,customers,deliveries,prepTables,selectedPrep,boxes,selectedBox,machines,selectedMachine,served,revenue,expense,fines,lost,discounted,nextCustomer,seq,stun,reload,attackCooldown,armed,shotFlash},stocked:false};
 state=freshState();state.stock.corn=0;seq=0;startDay();
 customers[0].flavor='cheese';render();
}
function finishTutorial(){
 if(!tutorial)return;
 const backup=tutorial.backup;
 cancelPhysicalGesture();resetScoop();tutorial=null;
 ({state,run,paused,time,customers,deliveries,prepTables,selectedPrep,boxes,selectedBox,machines,selectedMachine,served,revenue,expense,fines,lost,discounted,nextCustomer,seq,stun,reload,attackCooldown,armed,shotFlash}=backup);
 hideModal();render();
 if(!run){if(state.phase==='shop')showShop();else if(state.phase==='newspaper')showNewspaper();else welcome();}
 else if(paused){paused=false;pauseGame();}
}
function tutorialInstruction(){
 const m=machines[0],t=prepTables[0],crate=deliveries.find(d=>d.key==='corn');
 if(served>discounted)return [5,'全流程完成！','你已完成进货 → 脱粒 → 制作 → 装盒 → 供餐。正式营业时要留意库存、订单口味和顾客耐心；本次练习不会改变你的钱币和存档。',''];
 if(!tutorial.stocked){
  if(crate)return [0,crate.left>0?'等待配送 · 4 秒':crate.opened?'把货物全部收入库存':'点击到货箱拆箱',crate.left>0?'玉米正在配送，货箱会出现在进货区下方。':crate.opened?'反复点击箱内玉米，直到这箱全部归入库存。奶油和调料也按同样方式进货。':'点击左侧玉米货箱的箱盖，再逐份点击箱内商品。','#delivery-crates'];
  if(state.stock.corn>0)tutorial.stocked=true;
  else return [0,'先采购一箱玉米','点击进货区的玉米购买按钮。进货会扣钱，4 秒后送达；练习用的钱币不影响正式营业。','[data-buy="corn"]'];
 }
 if(boxes[0]!==null){
  if(boxes[0]==='plain')return [4,'按订单调味','这位练习顾客要芝士味。先右键放下铲子，再把工具架上的芝士粉罐拖到已装满的纸盒上。原味订单无需撒料。','[data-object="jar"][data-index="cheese"], [data-drop="box"]'];
  if(boxes[0]!=='cheese')return [4,'口味不符，试着重做','这个纸盒已经调味，不能再次撒料。把纸盒拖进废弃桶，再做一盒芝士味；错口味供餐只能收取半价。','[data-drop="trash"]'];
  return [4,'把纸盒交给顾客','右键放下铲子，将芝士爆米花纸盒拖到上方顾客身上，松手完成供餐并收款。','[data-object="box"], [data-customer]'];
 }
 if(heldScoop)return [3,'将满铲装入纸盒','拿着满铲，点击 C 区的空纸盒。注意：铲子用点击操作，纸盒交付才需要拖动。','[data-drop="box"]'];
 if(m.ready){
  if(!m.door)return [3,'出锅后先开门','点击机门把手打开机器，随后用工具架上的铲子盛取爆米花。','[data-door="0"]'];
  return [3,scoopEquipped?'点击机器盛取':'点击拿起铲子',scoopEquipped?'点击已开门的出锅机器，把爆米花盛到铲子里。':'点击下方工具架的铲子，拿起后点击机器盛取；不需要按住鼠标拖铲子。',scoopEquipped?'[data-drop="machine"]':'[data-object="scoop"]'];
 }
 if(m.cooking>0)return [2,'正在爆制 · '+Math.ceil(m.cooking)+' 秒','等待玉米爆开。烤制时机门锁定，出锅后再开门盛取。','[data-drop="machine"]'];
 if(m.loaded&&m.buttered)return [2,m.door?'关上机门':'按电源开关开始制作',m.door?'点击机门把手关闭机器，关门动画结束后再按机身右下角的电源开关。':'点击机身右下角 ⏻，玉米和奶油将经过 6 秒烤制变成爆米花。',m.door?'[data-door="0"]':'[data-power="0"]'];
 if(m.loaded&&!m.door)return [2,'重新打开机门','加入奶油前需要开门，点击机门把手，等待动画结束后再拖入奶油罐。','[data-door="0"]'];
 if(m.loaded)return [2,'加入奶油','把工具架上的奶油罐拖进已开门的机器。每批需要 1 份玉米和 1 份奶油。','[data-object="jar"][data-index="butter"], [data-drop="machine"]'];
 if(grainReady(t))return [2,m.door?'倒入玉米粒':'打开机器准备投料',m.door?'将 A 区装满玉米粒的原料盒拖入机器，松手完成投料。':'点击 B 区机器的机门把手，等开门动画结束后再投料。',m.door?'[data-object="grain"], [data-drop="machine"]':'[data-door="0"]'];
 if(t.progress===3)return [1,'收集散落的玉米粒 · '+(t.collected||0)+'/6','逐粒点击 A 区台面上的 6 颗玉米粒，全部收进原料盒，才能拖入机器。','#prep-tables'];
 return [1,'按住玉米，左右摇晃 · '+t.progress+'/3','在 A 区按住玉米，来回左右移动，完成三段脱粒。只点击或向一个方向拖动不会完成脱粒。','#prep-tables'];
}
function renderTutorial(){
 const panel=$('tutorial-panel');if(!panel)return;
 panel.hidden=!tutorial;
 document.querySelectorAll('.tutorial-focus').forEach(el=>el.classList.remove('tutorial-focus'));
 for(const id of ['tutorial-launch','save-manager','codex','shotgun'])if($(id))$(id).disabled=!!tutorial;
 if(!tutorial)return;
 const [stage,title,description,target]=tutorialInstruction();
 $('time').textContent='练习不限时';
 syncMarkup(panel,`<div class="tutorial-top"><strong>新手教程 · ${stage===5?'已完成':(stage+1)+'/5'}</strong><div><button id="tutorial-restart" class="secondary">重新练习</button> <button id="tutorial-exit" class="secondary">${stage===5?'完成练习 · 返回游戏':'退出练习'}</button></div></div><ol class="tutorial-steps">${['进货','脱粒','制作','装盒','供餐'].map((label,i)=>`<li class="${i<stage?'done':i===stage?'current':''}">${i<stage?'✓':i+1} ${label}</li>`).join('')}</ol><div role="status" aria-live="polite"><h3>${title}</h3><p>${description}</p></div><small>不限时 · 顾客不会离开 · 练习资源独立</small>`);
 $('tutorial-exit').onclick=finishTutorial;
 $('tutorial-restart').onclick=()=>{finishTutorial();startTutorial();};
 if(target)document.querySelectorAll(target).forEach(el=>el.classList.add('tutorial-focus'));
}
