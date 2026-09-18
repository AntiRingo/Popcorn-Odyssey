/* Small-body physics adapted from Popcorn-Origin's impulse, spin and bounce model. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FoodPhysics=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function body(id,x,y,r=8,rng=Math.random){return {id,x,y,r,vx:0,vy:0,z:0,vz:0,angle:rng()*Math.PI*2,spin:(rng()-.5)*7,mass:1,type:'kernel',wait:0};}
 function collide(a,b){
  // Airborne table grains only contact others at a similar height.
  if(a.wait>0||b.wait>0||Math.abs(a.z-b.z)>a.r+b.r)return false;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),overlap=a.r+b.r-d;
  if(overlap<=0)return false;
  const nx=d?dx/d:1,ny=d?dy/d:0,ia=1/a.mass,ib=1/b.mass,sum=ia+ib;
  a.x-=nx*overlap*ia/sum;a.y-=ny*overlap*ia/sum;b.x+=nx*overlap*ib/sum;b.y+=ny*overlap*ib/sum;
  const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(closing<0){const impulse=-1.45*closing/sum;
   a.vx-=impulse*ia*nx;a.vy-=impulse*ia*ny;b.vx+=impulse*ib*nx;b.vy+=impulse*ib*ny;
   const tangent=(b.vx-a.vx)*-ny+(b.vy-a.vy)*nx;a.spin-=tangent*.012*ia;b.spin+=tangent*.012*ib;
  }
  return true;
 }
 function bounds(b,w){
  const pot=w.pot&&b.type==='kernel',left=pot?w.pot.left:0,right=pot?w.pot.right:w.width,bottom=pot?w.pot.floor:w.height;
  if(b.x<left+b.r){b.x=left+b.r;if(b.vx<0)b.vx*=-.45;}
  if(b.x>right-b.r){b.x=right-b.r;if(b.vx>0)b.vx*=-.45;}
  if(b.y<b.r){b.y=b.r;if(b.vy<0)b.vy*=-.35;}
  if(b.y>bottom-b.r){b.y=bottom-b.r;if(b.vy>0)b.vy=Math.abs(b.vy)>22?-b.vy*.32:0;b.vx*=.94;b.spin*=.85;}
 }
 function step(w,seconds){
  // Fixed substeps prevent tunneling through adjacent grains after a slow frame.
  let remaining=clamp(seconds,0,.25);
  while(remaining>1e-8){const dt=Math.min(remaining,1/120);remaining-=dt;
   for(const b of w.bodies){if(b.wait>0){b.wait-=dt;continue;}
    b.vy+=(w.gravity||0)*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.spin*dt;
    if(b.z>0||b.vz>0){b.vz-=650*dt;b.z+=b.vz*dt;if(b.z<0){b.z=0;b.vz=Math.abs(b.vz)>45?-b.vz*.45:0;}}
    const friction=Math.exp(-(w.gravity ? .5 : b.z>0 ? .55 : 3.2)*dt);b.vx*=friction;b.vy*=friction;b.spin*=Math.exp(-2*dt);bounds(b,w);
   }
   for(let pass=0;pass<5;pass++){
    for(let i=0;i<w.bodies.length;i++)for(let j=i+1;j<w.bodies.length;j++)collide(w.bodies[i],w.bodies[j]);
    for(const b of w.bodies)if(b.wait<=0)bounds(b,w);
   }
   for(const b of w.bodies){b.vx=clamp(b.vx,-600,600);b.vy=clamp(b.vy,-600,600);b.spin=clamp(b.spin,-15,15);}
  }
 }
 function pop(b,rng=Math.random){if(b.type==='pop')return;b.type='pop';b.r=14+rng()*3;b.mass=.65;b.vx=(rng()-.5)*230;b.vy=-180-rng()*100;b.spin=(rng()-.5)*14;b.wait=0;}
 return {body,collide,step,pop};
});
