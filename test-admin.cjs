const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
const get=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='admin-stage'?'all':'',innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(){}});return nodes.get(id);};
const context=vm.createContext({document:{getElementById:get}});
for(const file of ['catalog-data.js','characters.js','admin.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
assert.equal(get('admin-count').textContent,'显示 5 / 5 项');
get('admin-guests').onclick();assert.equal(get('admin-count').textContent,'显示 25 / 25 项');
assert.equal((get('admin-catalog').innerHTML.match(/class="specimen"/g)||[]).length,25);
get('admin-stage').value='4';get('admin-stage').onchange();assert.equal(get('admin-count').textContent,'显示 5 / 25 项');
get('admin-search').value='星核原浆';get('admin-search').oninput();assert.equal(get('admin-count').textContent,'显示 1 / 25 项');
get('admin-search').value='找不到的档案';get('admin-search').oninput();assert.match(get('admin-catalog').innerHTML,/没有匹配/);
// Search includes usage text: butter also mentions cooking together with corn.
get('admin-search').value='玉米';get('admin-ingredients').onclick();assert.equal(get('admin-count').textContent,'显示 2 / 5 项');
assert.doesNotMatch(fs.readFileSync('index.html','utf8'),/admin\.html/);
assert.doesNotMatch(fs.readFileSync('admin.html','utf8'),/src="game.js"/);
console.log('PASS: independent admin loads without game or storage, exposes all 30 records, filters by stage and text, and has no gameplay entry.');
