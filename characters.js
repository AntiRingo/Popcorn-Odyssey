function humanPortrait(n){const skins=['#c8b99c','#b7bcaa','#c6a58a','#b4b8b4'],coats=['#687968','#836555','#626c7d','#8c7d59'];return `<svg viewBox="0 0 150 175" aria-hidden="true"><path d="M14 179L25 121 55 106 95 106 125 121 138 179" fill="${coats[n%4]}" stroke="#172325" stroke-width="4"/><path d="M55 107L75 144 95 107 87 162H62Z" fill="#d0c9b2" stroke="#263031" stroke-width="3"/><path d="M66 126H83L79 144 86 177H65L70 144Z" fill="#393d35"/><path d="M47 50Q45 16 75 15Q111 17 108 56L102 89 86 110 64 107 47 88Z" fill="${skins[n%4]}" stroke="#192426" stroke-width="4"/><path d="M43 57L39 32 52 11 89 8 111 24 113 64 99 42 82 34 61 47Z" fill="#303b3b" stroke="#182325" stroke-width="4"/><path d="M51 65L66 62M83 62L99 66" stroke="#303b37" stroke-width="4"/><path d="M59 70V77M91 70V77M74 75L70 86 77 86M67 95L85 94" stroke="#394039" stroke-width="3" fill="none"/>${n%3===0?'<path d="M47 64H70V79H49ZM81 64H104V79H83ZM70 69H81" stroke="#283231" stroke-width="3" fill="#99b1a32a"/>':''}<path d="M36 126L53 146 43 155 62 175M111 126L96 146 107 155 90 175" stroke="#253331" fill="none" stroke-width="3"/><rect x="105" y="146" width="12" height="18" fill="#cfbb80"/><path d="M108 150H114M108 154H114" stroke="#635d47"/></svg>`;}
// Each entry is a separate design, not a stack of shared mutation overlays.
const mutationArt={
 1:[
  '<ellipse cx="91" cy="73" rx="4" ry="5" fill="#e0dbc5"/><circle cx="94" cy="73" r="1.8" fill="#202d2b"/>',
  '<path d="M101 79L108 75M102 83L110 80M101 87L108 85" stroke="#648c80" stroke-width="1.4"/>',
  '<path d="M93 45L100 45 100 51 104 51" fill="none" stroke="#c9d5db" stroke-width="1.5"/><circle cx="93" cy="45" r="1.5" fill="#d0c2ed"/>',
  '<path d="M104 65Q99 73 104 76Q110 74 104 65Z" fill="#91c9a0" fill-opacity=".7" stroke="#6f9d83"/><circle cx="103" cy="72" r="1" fill="#dcf2cb"/>'
 ],
 2:[
  '<path d="M60 91H91V100H60Z" fill="#293335" stroke="#867c64"/><path d="M63 93V97M67 94V98M71 93V97M75 94V98M79 93V97M83 94V98M87 93V97" stroke="#d9caa4" stroke-width="2"/><path d="M88 98L93 105 89 109 85 103Z" fill="#b3b5a0" stroke="#344142"/>',
  '<circle cx="59" cy="72" r="14" fill="#315f61" stroke="#8bbaa2" stroke-width="2"/><path d="M49 75C43 58 72 55 70 73C68 86 48 83 52 69C55 61 65 65 63 73Q59 79 57 71" fill="none" stroke="#b2d9b1" stroke-width="2"/>',
  '<path d="M57 39Q47 19 38 13M92 35Q98 16 111 11" fill="none" stroke="#9d91b3" stroke-width="4"/><circle cx="38" cy="13" r="5" fill="#c7abe1" stroke="#4b4468"/><circle cx="111" cy="11" r="5" fill="#c7abe1" stroke="#4b4468"/>',
  '<path d="M87 81Q115 67 109 96Q102 108 107 122Q100 133 94 119L84 101Z" fill="#80b9a0" fill-opacity=".85" stroke="#436e62" stroke-width="2"/><circle cx="99" cy="92" r="4" fill="none" stroke="#c4e7b5"/><circle cx="99" cy="111" r="2" fill="#c4e7b5"/>'
 ],
 3:[
  '<path d="M46 28Q75 4 103 30L108 96 74 120 43 94Z" fill="#121e23" stroke="#64736a" stroke-width="3"/><path d="M50 35L95 30 99 92 69 107 49 88Z" fill="#d3c5ac" stroke="#423e39" stroke-width="3"/><path d="M42 43L50 49M101 38L110 31M99 83L113 90" stroke="#bbc8b4" stroke-width="1"/><path d="M58 60L70 61M81 56L90 56M70 86L86 82" stroke="#263638" stroke-width="3"/>',
  '<path d="M45 52L12 37 22 59 9 73 28 80 17 99 46 91M105 52L138 37 128 59 141 73 122 80 133 99 104 91" fill="#657f84" stroke="#233f45" stroke-width="3"/><path d="M45 61L22 49M44 73L19 72M43 84L29 93M105 61L128 49M106 73L131 72M107 84L121 93" stroke="#a7b9a0" stroke-width="2"/><path d="M46 31Q75 12 104 31L99 91 76 106 51 90Z" fill="#73958b" stroke="#244448" stroke-width="3"/><path d="M53 58L67 61M84 61L97 58" stroke="#e0cc80" stroke-width="5"/><path d="M62 100Q75 88 88 100L75 119Z" fill="#bdab86" stroke="#425653" stroke-width="2"/><path d="M75 99V114M68 102L74 115M82 102L76 115" stroke="#6a775f"/>',
  '<path d="M75 6L112 37 104 88 75 119 42 88 38 37Z" fill="#827ca8" stroke="#2b304e" stroke-width="3"/><path d="M75 6L59 46 75 119 89 46ZM38 37L59 46 42 88M112 37L89 46 104 88" fill="#b0a5c7" stroke="#4c4c77" stroke-width="2"/><circle cx="75" cy="39" r="7" fill="#e6d48b"/><circle cx="75" cy="63" r="6" fill="#e6d48b"/><circle cx="75" cy="85" r="5" fill="#e6d48b"/>',
  '<path d="M73 12Q40 39 37 72Q30 113 74 121Q117 115 111 72Q106 40 73 12Z" fill="#75b9ac" fill-opacity=".55" stroke="#96d6bf" stroke-width="3"/><path d="M48 70Q42 48 64 31" fill="none" stroke="#d1ecce" stroke-width="4"/><ellipse cx="58" cy="64" rx="10" ry="12" fill="#dbe8ce"/><ellipse cx="90" cy="80" rx="9" ry="11" fill="#dbe8ce"/><circle cx="58" cy="67" r="3" fill="#304f50"/><circle cx="91" cy="78" r="3" fill="#304f50"/><path d="M65 104Q77 112 90 102" fill="none" stroke="#315e57" stroke-width="3"/><circle cx="79" cy="48" r="5" fill="none" stroke="#b6e4c3"/>'
 ],
 4:[
  '<path d="M75 16L39 25 46 66 76 60Z" fill="#d5c9b0" stroke="#334043" stroke-width="3"/><path d="M81 19L112 42 93 75 76 59Z" fill="#b8b6a5" stroke="#334043" stroke-width="3"/><path d="M46 74L78 65 68 116 34 94Z" fill="#c7bea9" stroke="#334043" stroke-width="3"/><path d="M86 76L115 89 100 123 72 111Z" fill="#dfd2b6" stroke="#334043" stroke-width="3"/><path d="M49 43L65 42M90 42L100 52M54 90L63 87M86 105L101 102" stroke="#253538" stroke-width="4"/><path d="M77 59L72 75M67 115L72 131" stroke="#849b91" stroke-width="2"/>',
  '<path d="M39 50Q32 13 75 7Q119 13 111 50L102 91 47 93Z" fill="#537d78" stroke="#203f43" stroke-width="3"/><path d="M45 75Q19 106 37 127T22 155M58 79Q40 114 62 135T50 166M75 82Q64 115 83 142L75 169M93 78Q114 110 95 130T111 160M105 70Q131 100 118 118T135 143" fill="none" stroke="#80a08d" stroke-width="10"/><path d="M43 40Q75 19 106 40Q75 65 43 40Z" fill="#dbbd6b" stroke="#233f40" stroke-width="3"/><ellipse cx="75" cy="40" rx="6" ry="16" fill="#162e33"/><circle cx="79" cy="35" r="2" fill="#f5e2a0"/>',
  '<circle cx="75" cy="65" r="42" fill="#14232e" stroke="#7286aa" stroke-width="3"/><ellipse cx="75" cy="65" rx="68" ry="23" transform="rotate(-32 75 65)" fill="none" stroke="#c2b4de" stroke-width="4"/><circle cx="19" cy="98" r="8" fill="#bb9ed5" stroke="#3e4e6a"/><circle cx="115" cy="27" r="6" fill="#c2ceaf"/><circle cx="124" cy="67" r="5" fill="#cba976"/><path d="M52 41L59 35M91 83L99 76" stroke="#5c7492" stroke-width="2"/>',
  '<path d="M29 82Q19 54 47 44Q43 9 77 16Q114 9 117 44Q137 53 120 84Q139 123 109 128Q116 151 78 138Q43 156 41 129Q10 123 29 82Z" fill="#a776a6" fill-opacity=".75" stroke="#d1a6cb" stroke-width="3"/><path d="M76 50L83 69 104 72 88 86 92 108 74 97 55 109 60 86 44 72 67 69Z" fill="#efe3ad" stroke="#9e818e" stroke-width="2"/><circle cx="43" cy="60" r="3" fill="#c8deb8"/><circle cx="107" cy="105" r="4" fill="#d4c9e5"/><circle cx="99" cy="40" r="2" fill="#e9d9a3"/><path d="M35 96Q25 111 43 116" fill="none" stroke="#ebc7de" stroke-width="3"/>'
 ]
};
function portrait(n,level=0){
 if(n===4)return threatPortrait(level);
 const variant=n%4;
 if(!level)return humanPortrait(n);
 const detail=mutationArt[level][variant];
 if(level<3)return humanPortrait(n).replace('</svg>',`<g class="mutation-art" data-design="${level}-${variant}">${detail}</g></svg>`);
 const coats=['#687968','#4c7068','#626c7d','#7d6579'];
 return `<svg viewBox="0 0 150 175" aria-hidden="true"><path d="M14 179L25 121 55 106 95 106 125 121 138 179" fill="${coats[variant]}" stroke="#172325" stroke-width="4"/><path d="M55 110L75 153 95 110 88 175H62Z" fill="#c6c1aa" stroke="#263c3e" stroke-width="3"/><path d="M68 134L80 134 77 146 86 175H66L70 146Z" fill="#35403d"/><g class="mutation-art" data-design="${level}-${variant}">${detail}</g></svg>`;
}

function threatPortrait(level){
 const additions=[
 '<rect x="106" y="143" width="14" height="20" fill="#ab9c70" stroke="#45534b"/>',
 '<path d="M30 133L20 157M35 136L30 166M42 139L41 169" stroke="#b9b59d" stroke-width="4"/>',
 '<path d="M30 126Q9 128 11 145M38 135Q16 143 23 160M118 125Q142 128 140 146M112 137Q136 145 128 161" fill="none" stroke="#bfbc9b" stroke-width="8"/>',
 '<path d="M50 79Q75 115 100 79L94 143 74 161 56 142Z" fill="#172b30" stroke="#91a291" stroke-width="4"/><path d="M57 99L65 118 59 134M90 99L83 118 90 135" fill="none" stroke="#cad4b6" stroke-width="3"/>',
 '<path d="M40 48Q29 10 58 22Q71 -2 86 21Q119 8 111 51L99 77 54 75Z" fill="#95ac66" stroke="#304d43" stroke-width="4"/><circle cx="55" cy="42" r="10" fill="#d3d999"/><circle cx="87" cy="37" r="13" fill="#c5d687"/><path d="M57 91Q75 79 97 94L89 110 65 112Z" fill="#284039" stroke="#b5cd85" stroke-width="3"/>'
 ];
 return humanPortrait(3).replace('</svg>',`<g class="mutation-art hostile-design" data-design="${level}-4">${additions[level]}</g></svg>`);
}
