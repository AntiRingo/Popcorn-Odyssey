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
