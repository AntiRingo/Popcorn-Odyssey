'use strict';
let gunPointerX=0,gunPointerY=0,gunPointerKnown=false,suppressGunClick=false;
function updateGunPointer(){
 const visible=armed&&shiftRunning()&&stun===0&&!codexOpen;
 const cursor=$('gun-pointer');cursor.hidden=!visible;
 if(visible){
  if(!gunPointerKnown){gunPointerX=typeof window==='undefined'?0:window.innerWidth/2;gunPointerY=typeof window==='undefined'?0:window.innerHeight/2;}
  cursor.style.left=gunPointerX+'px';cursor.style.top=gunPointerY+'px';
 }
}
function trackGunPointer(event){gunPointerX=event.clientX;gunPointerY=event.clientY;gunPointerKnown=true;updateGunPointer();}
function gunPointerDown(event){
 suppressGunClick=false;
 if(event.button!==0||!armed||!shiftRunning()||stun>0||codexOpen)return;
 trackGunPointer(event);
 // Capture pointerdown so even disabled controls/backgrounds can be shot.
 // Swallow the later click too: firing must never also operate the workstation.
 event.preventDefault();event.stopImmediatePropagation();suppressGunClick=true;
 const target=event.target.closest?.('[data-customer]');
 shoot(target?Number(target.dataset.customer):undefined);
}
function suppressShotClick(event){if(!suppressGunClick)return;suppressGunClick=false;event.preventDefault();event.stopImmediatePropagation();}
function holsterGun(event){if(!armed||!shiftRunning())return;event.preventDefault();armed=false;render();}
document.addEventListener('pointermove',trackGunPointer);
document.addEventListener('pointerdown',gunPointerDown,true);
document.addEventListener('click',suppressShotClick,true);
document.addEventListener('contextmenu',holsterGun,true);
document.addEventListener('pointerout',event=>{if(!event.relatedTarget)$('gun-pointer').hidden=true;});
