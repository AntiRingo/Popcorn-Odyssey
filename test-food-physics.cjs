const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('./food-physics.js');
let seed=103;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const a=P.body(0,40,40,9,rng),b=P.body(1,54,40,9,rng);a.vx=80;b.vx=-80;
assert.equal(P.collide(a,b),true);assert.ok(a.vx<0&&b.vx>0);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=18-1e-8);
const world={width:180,height:140,gravity:480,pot:{left:43,right:137,floor:67},bodies:Array.from({length:6},(_,i)=>P.body(i,65+rng()*45,10+rng()*25,7,rng))};
const simulate=n=>{for(let i=0;i<n*120;i++)P.step(world,1/120);};
function contained(){for(const u of world.bodies){assert.ok([u.x,u.y,u.vx,u.vy,u.angle].every(Number.isFinite));assert.ok(u.x>=u.r-.01&&u.x<=world.width-u.r+.01);assert.ok(u.y>=u.r-.01&&u.y<=world.height-u.r+.01);}}
function separated(){for(let i=0;i<world.bodies.length;i++)for(let j=i+1;j<world.bodies.length;j++){const a=world.bodies[i],b=world.bodies[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r-.65,'resting food bodies must not overlap');}}
simulate(3);contained();separated();assert.ok(world.bodies.every(b=>b.y<=67-b.r+.01));
world.bodies.forEach(b=>P.pop(b,rng));assert.equal(world.bodies.filter(b=>b.type==='pop').length,6);assert.ok(world.bodies.every(b=>b.vy<0&&b.r>=14));
simulate(5);contained();separated();assert.ok(world.bodies.some(b=>b.y>90));assert.equal(world.bodies.length,6);
const still=JSON.stringify(world);P.step(world,0);assert.equal(JSON.stringify(world),still);
// Long input frames are safely substepped, and settling dissipates motion.
for(const b of world.bodies){b.vx=500;b.vy=500;}P.step(world,.5);contained();simulate(8);separated();assert.ok(world.bodies.every(b=>Math.abs(b.vx)<15));
const table={width:240,height:90,gravity:0,bodies:[P.body(0,119,40,8,rng),P.body(1,120,40,8,rng)]};
table.bodies.forEach((b,i)=>{b.z=40;b.vz=80;b.vx=i?90:-90;});
for(let i=0;i<600;i++)P.step(table,1/120);assert.ok(table.bodies.every(b=>b.z===0&&b.vz===0));assert.ok(Math.abs(table.bodies[0].x-table.bodies[1].x)>20);
// Scene ownership preserves the surviving grain's position after collecting a neighbor.
const ctx=vm.createContext({FoodPhysics:P,Math});vm.runInContext(fs.readFileSync('food-scenes.js','utf8'),ctx);
const prep={loose:[0,1]};const first=ctx.prepFoodWorld(prep),survivor=first.bodies[1];prep.loose=[1];assert.equal(ctx.prepFoodWorld(prep).bodies[0],survivor);
const machine={loaded:true,grainFx:1,cooking:0};const batch=ctx.machineFoodWorld(machine);assert.equal(batch.bodies.length,6);machine.cooking=2;ctx.machineFoodWorld(machine);assert.ok(batch.bodies.some(b=>b.type==='pop'));machine.ready=true;machine.cooking=0;ctx.machineFoodWorld(machine);assert.ok(batch.bodies.every(b=>b.type==='pop'));assert.equal(ctx.machineFoodWorld({loaded:false,ready:false}).bodies.length,0);
console.log('PASS: impulses, separation, pot/wall containment, gravity, friction, spinning pops, table bounce, zero-step pause, long frames, one-time popping and batch ownership.');
