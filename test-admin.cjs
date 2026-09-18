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

// Exercise configuration editing independently from gameplay and save data.
const priceStorage={'popcorn-odyssey-saves-v1':'keep-existing-saves'};
context.localStorage={getItem:key=>priceStorage[key]||null,setItem:(key,value)=>{priceStorage[key]=value;}};
const run=code=>vm.runInContext(code,context);
get('reset-prices').onclick();
assert.equal(run('Object.keys(upgradeCatalog).length'),8);
assert.equal(run('Object.keys(goods).length'),5);
get('price-upgrades-shell').value='0';
get('price-materials-corn').value='21';
get('price-form').onsubmit({preventDefault(){}});
assert.equal(run('upgradeCatalog.shell.cost'),0);
assert.equal(run('goods.corn.cost'),21);
assert.equal(priceStorage['popcorn-odyssey-saves-v1'],'keep-existing-saves');
const persisted=priceStorage[run('PRICE_CONFIG_KEY')];
for(const value of ['', '-1', '1.5', '1000001', 'NaN']){
 get('price-materials-corn').value=value;get('price-materials-corn').focus=()=>{};
 get('price-form').onsubmit({preventDefault(){}});
 assert.equal(priceStorage[run('PRICE_CONFIG_KEY')],persisted);
}
get('price-materials-corn').value='30';
context.localStorage.setItem=()=>{throw Error('Storage blocked');};
get('price-form').onsubmit({preventDefault(){}});
assert.match(get('price-status').textContent,/保存失败/);
assert.equal(run('goods.corn.cost'),21);
assert.equal(get('price-materials-corn').value,'30');
get('reset-prices').onclick();
assert.equal(get('price-materials-corn').value,'12');
assert.equal(run('goods.corn.cost'),21); // Reset stays a draft until saved.
const reload=vm.createContext({localStorage:{getItem:()=>persisted}});
vm.runInContext(fs.readFileSync('catalog-data.js','utf8'),reload);
assert.equal(vm.runInContext('goods.corn.cost',reload),21);
assert.equal(vm.runInContext('upgradeCatalog.shell.cost',reload),0);
for(const raw of ['{bad',JSON.stringify({materials:{corn:-1,butter:0},upgrades:{shell:'5'}})]){
 const fallback=vm.createContext({localStorage:{getItem:()=>raw}});
 vm.runInContext(fs.readFileSync('catalog-data.js','utf8'),fallback);
 assert.equal(vm.runInContext('goods.corn.cost',fallback),12);
 assert.equal(vm.runInContext('upgradeCatalog.shell.cost',fallback),65);
}
console.log('PASS: all price fields, zero price, validation, independent persistence, reload, defaults, corrupt settings and storage failure.');
