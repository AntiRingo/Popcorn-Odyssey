'use strict';
const mutationThresholds=[0,800,2400,5200,9000];
function mutationProfile(total=state.totalRevenue){
 let level=0;for(let i=1;i<mutationThresholds.length;i++)if(total>=mutationThresholds[i])level=i;
 return {level,chance:[0,.12,.25,.42,.62][level]};
}
function rollMutation(){const p=mutationProfile();if(Math.random()>=p.chance)return 0;return Math.random()<.65?p.level:1+Math.floor(Math.random()*p.level);}
function cleanMarket(m){return m&&Number.isInteger(m.day)&&m.day>0&&Object.hasOwn(goods,m.priceKey)&&[25,50,-20].includes(m.pricePct)&&['original','caramel','cheese','chili'].includes(m.hotFlavor)?{day:m.day,priceKey:m.priceKey,pricePct:m.pricePct,hotFlavor:m.hotFlavor}:null;}
function procurementPrice(key){const m=state.market;return m?.priceKey===key?Math.ceil(goods[key].cost*(1+m.pricePct/100)):goods[key].cost;}
function orderPrice(flavor){return Math.round(flavors[flavor].price*(state.market?.hotFlavor===flavor?1.3:1));}
function rollFlavor(){const keys=Object.keys(flavors),hot=state.market?.hotFlavor;if(!hot)return keys[Math.floor(Math.random()*keys.length)];if(Math.random()<.5)return hot;const others=keys.filter(k=>k!==hot);return others[Math.floor(Math.random()*others.length)];}
function makeNewspaper(day){const keys=Object.keys(goods),fs=Object.keys(flavors);return {day,priceKey:keys[Math.floor(Math.random()*keys.length)],pricePct:[25,50,-20][Math.floor(Math.random()*3)],hotFlavor:fs[Math.floor(Math.random()*fs.length)]};}
function showNewspaper(){
 const n=state.nextMarket;if(!n){showShop();return;}
 const rumours=['夜班工人说，街角新开的小店终于让回家的路有了香味。','最近新兴的爆米花店的名气传到了小巷深处。有人在熄灯后仍排着队。','有住户在排队的人群里认出了自己，但那晚他并没有出门。','下水道检修工声称，井盖下面有人照着报纸练习点餐。','送报人不再走巷尾。昨夜，他看见几个没有影子的顾客认真数着零钱。'];
 const price=Math.ceil(goods[n.priceKey].cost*(1+n.pricePct/100)),hotPrice=Math.round(flavors[n.hotFlavor].price*1.3);
 modal(`<section class="newspaper"><div class="paper-meta">夜间发行 · 第 ${n.day} 天晨刊 · ODYSSEY</div><h2>巷口晚报</h2><div class="paper-rule">市井 / 供销 / 不可靠的见闻</div><article><small>供销消息 · 次日生效</small><h3>${goods[n.priceKey].name}${n.pricePct>0?'供应趋紧，批发报价上调':'集中到货，批发让利'}</h3><p>据夜间供货站消息，${goods[n.priceKey].name}明日批次价格${n.pricePct>0?'上涨':'下降'} ${Math.abs(n.pricePct)}%。门店原有库存不受影响。</p><b>第 ${n.day} 天进货：${price} ◈ / ${goods[n.priceKey].qty} 份</b></article><article><small>饮食风向 · 次日生效</small><h3>“${flavors[n.hotFlavor].name}派”掀起街头热潮</h3><p>一张流传的宵夜清单把${flavors[n.hotFlavor].name}爆米花推上榜首。预计约半数来客会点这一口味，愿意支付的价格也有所提高。</p><b>热门订单售价：${hotPrice} ◈ / 盒（约 +30%）</b></article><article class="paper-rumour"><small>巷尾耳语 · 未经证实</small><p>${rumours[mutationProfile().level]}</p></article><p class="paper-footnote">以上供销与口味行情仅适用于第 ${n.day} 天，次日晨刊重新公布。报纸已随结算保存。</p><button id="paper-continue" class="action">收起报纸 · 查看结算与升级 →</button></section>`,true);
 $('paper-continue').onclick=()=>{state.phase='shop';persist();showShop();};
}
let armed=false,stun=0,reload=0,attackCooldown=5,shotFlash=0;
const unprovokedShotPenalty=30;
function shiftRunning(){return run&&!paused;}
function resetCombat(){armed=false;stun=0;reload=0;attackCooldown=5;shotFlash=0;}
function threat(){return customers.find(c=>c.attack==='windup');}
function beginAttack(c){if(!shiftRunning()||stun>0||threat()||c.attack==='spent')return false;c.attack='windup';c.attackLeft=3.2;toast(armed?'危险！点击红色预警顾客反击':'危险！拿起猎枪，再点击红色预警顾客反击');beep(140);renderCustomers();document.querySelector?.('[data-customer="'+c.id+'"]')?.scrollIntoView?.({block:'nearest',inline:'center'});return true;}
function advanceCombat(dt){
 const wasStunned=stun>0;stun=Math.max(0,stun-dt);reload=Math.max(0,reload-dt);shotFlash=Math.max(0,shotFlash-dt);attackCooldown=Math.max(0,attackCooldown-dt);
 const c=threat();
 if(c){c.attackLeft=Math.max(0,c.attackLeft-dt);if(c.attackLeft===0){c.attack='spent';customers=customers.filter(x=>x.id!==c.id);stun=4;armed=false;attackCooldown=8;toast('反击失败！受到惊吓，4 秒内无法手动操作');beep(100);}}
 else if(!wasStunned&&stun===0&&attackCooldown===0){for(const guest of customers){if(guest.hostile&&guest.attack!=='spent'){guest.attackIn-=dt;if(guest.attackIn<=0){beginAttack(guest);break;}}}}
}
function takeShotgun(){if(typeof tutorialActive==='function'&&tutorialActive())return;if(!shiftRunning()||stun>0||reload>0)return;armed=!armed;render();}
function shoot(id){
 if(!shiftRunning()||stun>0||!armed||reload>0)return;
 const c=customers.find(x=>x.id===id);armed=false;reload=1.2;shotFlash=.25;
 if(c){
  const counter=c.attack==='windup';c.attack='spent';customers=customers.filter(x=>x.id!==id);
  if(counter)attackCooldown=8;
  if(!counter){const penalty=Math.min(state.money,unprovokedShotPenalty);state.money-=penalty;fines+=penalty;toast('顾客尚未攻击！顾客消失，赔偿 −'+penalty+' 钱币');}
  else toast('反击成功，对方退入黑暗。');
 }else toast('空放一枪，猎枪重新装填中');
 beep(90);
 render();
}
function customerAction(id){if(armed)shoot(id);else{const c=customers.find(x=>x.id===id);if(c?.attack==='windup'){toast('对方正在攻击！先拿起操作台上方的猎枪');return;}toast('将装好的纸盒拖给这位客人');}}
function renderCombat(){
 const c=threat();$('customers').classList.toggle('combat-paused',paused);$('shotgun').disabled=!shiftRunning()||stun>0||reload>0;$('shotgun').classList.toggle('armed',armed);$('shotgun').classList.toggle('reloading',reload>0);$('shotgun').setAttribute?.('aria-pressed',String(armed));
 $('combat-alert').className='combat-alert '+(stun>0?'stunned':shotFlash>0?'shot':'');
 $('combat-alert').textContent=stun>0?'暂时无法操作 · '+Math.ceil(stun)+'s':'';
 $('security-rack').classList.toggle('danger',!!c);updateGunPointer();
}
