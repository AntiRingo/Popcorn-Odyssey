/* SVG food artwork adapted from the supplied Popcorn-Origin game.js. */
'use strict';
const FoodArt=(()=>{
const kernelArt='<svg viewBox="0 0 20 23" aria-hidden="true"><path d="M3 3Q10-2 17 4L19 15Q16 23 7 21L1 15Z" fill="#eebb3c" stroke="#ba8624" stroke-width="1.2"/><path d="M5 5Q10 2 14 6L13 11L5 12Z" fill="#ffdc76"/><path d="M6 17L12 18" stroke="#cd9a27" stroke-width="2"/></svg>';
const popArt='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 34C-2 28 4 16 13 17C9 3 27 0 31 12C41 4 50 20 40 27C49 38 32 48 26 39C15 48 7 42 11 34Z" fill="#fff0c7" stroke="#c79e55" stroke-width="1.4"/><path d="M15 27Q23 18 31 28L27 35L20 35Z" fill="#dab471"/><path d="M10 23Q9 29 15 30M17 11Q15 17 20 18M35 17Q41 20 35 24M31 37L35 33" fill="none" stroke="#fffbea" stroke-width="4" stroke-linecap="round"/></svg>';
  function corn(progress=0,id=0){
    const u={remaining:3-progress,capacity:3,id};
    const n=Math.ceil(32*u.remaining/Math.max(1,u.capacity));let grains='';
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){const x=13+col*8,y=10+row*9,filled=row*4+col<n;grains+=`<rect x="${x}" y="${y}" width="7.5" height="9" rx="3" fill="${filled?['#f4c74a','#ffdc69','#f1bf37','#dc9e25'][col]:'#b19353'}" stroke="#ac7e2f" stroke-width=".5"/><path d="M${x+2} ${y+2}h3" stroke="${filled?'#ffeb96':'#c4a46b'}" stroke-width="1"/>`;}
    return `<svg viewBox="0 0 58 112" aria-hidden="true"><defs><clipPath id="odyssey-cob-${u.id}"><path d="M29 4C9 4 10 30 11 55L13 78Q29 100 46 77L48 33Q48 4 29 4Z"/></clipPath></defs><path d="M26 10Q20 0 25 0M30 8Q37 0 33 0" fill="none" stroke="#c5a062"/><path d="M29 4C9 4 10 30 11 55L13 78Q29 100 46 77L48 33Q48 4 29 4Z" fill="#d2a444"/><g clip-path="url(#odyssey-cob-${u.id})">${grains}</g><path d="M28 106C9 92 3 67 2 49Q21 62 30 90Q42 66 56 57C55 84 43 100 33 107Z" fill="#6a944c" stroke="#365c38"/><path d="M28 102Q15 83 6 58M33 102Q47 80 51 66" fill="none" stroke="#a0b96a" stroke-width="1.5"/><path d="M28 101v11h7l-2-12" fill="#638443"/><path d="M28 102Q23 78 16 69Q33 82 28 102" fill="#a8b563"/></svg>`;
  }

 function handful(kind,count=8){return `<span class="food-handful" aria-hidden="true">${Array.from({length:count},(_,i)=>`<i style="left:${8+(i*29)%78}%;top:${(i*17)%42}%;width:${kind==='pop'?30:18}%;transform:rotate(${i*67}deg)">${kind==='pop'?popArt:kernelArt}</i>`).join('')}</span>`;}
 return {corn,kernel:kernelArt,pop:popArt,handful};
})();
