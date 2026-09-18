'use strict';
let adminTab='ingredients';
const adminGet=id=>document.getElementById(id);
function renderAdmin(){
 const term=adminGet('admin-search').value.trim().toLowerCase(),stageFilter=adminGet('admin-stage').value;
 adminGet('stage-filter').hidden=adminTab!=='guests';
 for(const tab of ['ingredients','guests']){adminGet('admin-'+tab).classList.toggle('selected',tab===adminTab);adminGet('admin-'+tab).setAttribute('aria-pressed',String(tab===adminTab));}
 let records=[];
 if(adminTab==='ingredients'){
  records=Object.entries(ingredientEntries).map(([key,e])=>({search:goods[key].name+e.description+e.usage,html:`<article class="encyclopedia-entry ingredient-entry"><div class="specimen ingredient-${key}">${goods[key].icon}</div><small>${e.tag}</small><h3>${goods[key].name}</h3><p>${e.description}</p><p class="entry-rule">${e.usage}</p><div class="entry-metrics">采购 ${goods[key].cost} ◈ / ${goods[key].qty} 份</div></article>`}));
 }else{
  guestStages.forEach((stage,level)=>stage.names.forEach((name,variant)=>{if(stageFilter!=='all'&&Number(stageFilter)!==level)return;records.push({search:name+stage.name+stage.note+stage.tells[variant],html:`<article class="encyclopedia-entry guest-entry"><div class="specimen">${portrait(variant,level)}</div><small>客人档案 C-${String(level*guestVariantCount+variant+1).padStart(2,'0')} · 完整资料</small><h3>${name}</h3><p>${stage.note}</p><p class="entry-rule">观察：${stage.tells[variant]}</p><div class="entry-metrics">阶段 ${level}/4 · ${stage.name}</div></article>`});}));
 }
 records=records.filter(r=>r.search.toLowerCase().includes(term));
 adminGet('admin-count').textContent='显示 '+records.length+' / '+(adminTab==='ingredients'?5:guestEntryCount)+' 项';
 adminGet('admin-catalog').innerHTML=records.map(r=>r.html).join('')||'<div class="admin-empty">没有匹配的档案，请调整搜索词或阶段。</div>';
}
for(const tab of ['ingredients','guests'])adminGet('admin-'+tab).onclick=()=>{adminTab=tab;renderAdmin();};
adminGet('admin-search').oninput=renderAdmin;adminGet('admin-stage').onchange=renderAdmin;renderAdmin();

function renderPriceInputs(){
 for(const [group,target] of [['upgrades','upgrade-prices'],['materials','material-prices']]){
  adminGet(target).innerHTML=Object.entries(priceCatalogs[group]).map(([key,item])=>
   '<label class="price-field" for="price-'+group+'-'+key+'"><span>'+item.name+'</span><small>'+ (group==='materials'?'每批 '+item.qty+' 份':key==='machines'?'首台增设价 · 后续每次 +80':['prepTables','packTables'].includes(key)?'首台增设价 · 后续每次 +60':'一次性升级')+'</small><input id="price-'+group+'-'+key+'" type="number" min="0" max="'+PRICE_MAX+'" step="1" required value="'+item.cost+'"></label>'
  ).join('');
 }
}
renderPriceInputs();
if(priceConfigLoadFailed)adminGet('price-status').textContent='未能读取价格配置，当前使用默认价格。';
adminGet('price-form').oninput=()=>{adminGet('price-status').textContent='有未保存的价格修改。';};
adminGet('price-form').onsubmit=event=>{
 event.preventDefault();
 const prices={};
 for(const [group,items] of Object.entries(priceCatalogs)){
  prices[group]={};
  for(const [key,item] of Object.entries(items)){
   const input=adminGet('price-'+group+'-'+key),value=Number(input.value);
   if(!input.value.trim()||!validBasePrice(value)){
    adminGet('price-status').textContent=item.name+'：请输入 0–1,000,000 的整数。';input.focus();return;
   }
   prices[group][key]=value;
  }
 }
 try{savePrices(prices);renderAdmin();adminGet('price-status').textContent='价格配置已保存，刷新游戏页面后生效。';}
 catch{adminGet('price-status').textContent='保存失败，请允许浏览器本地存储后重试。输入内容已保留。';}
};
adminGet('reset-prices').onclick=()=>{
 for(const [group,items] of Object.entries(defaultPrices))for(const [key,value] of Object.entries(items))adminGet('price-'+group+'-'+key).value=String(value);
 adminGet('price-status').textContent='已填入默认价格，点击“保存价格配置”后生效。';
};
