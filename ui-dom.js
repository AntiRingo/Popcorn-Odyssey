'use strict';
// Reconcile in place: a pointer press must keep the same button until release.
function syncMarkup(container,html){
 const template=document.createElement('template');template.innerHTML=html;
 function key(node){return node.nodeType===1?(node.getAttribute('data-key')||node.getAttribute('data-customer')):null;}
 function compatible(a,b){return a&&a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&key(a)===key(b);}
 function patch(parent,desired){
  let index=0;
  for(const target of Array.from(desired.childNodes)){
   let current=parent.childNodes[index];
   const targetKey=key(target);
   if(targetKey!==null){const existing=Array.from(parent.childNodes).find(n=>key(n)===targetKey);if(existing&&existing!==current){parent.insertBefore(existing,current||null);current=existing;}}
   if(!compatible(current,target)){const fresh=target.cloneNode(true);parent.insertBefore(fresh,current||null);index++;continue;}
   if(current.nodeType===3){if(current.nodeValue!==target.nodeValue)current.nodeValue=target.nodeValue;}
   else if(current.nodeType===1){
    for(const attr of Array.from(current.attributes))if(!target.hasAttribute(attr.name))current.removeAttribute(attr.name);
    for(const attr of Array.from(target.attributes))if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
    // Physics owns these children and updates their positions each animation frame.
    if(!target.hasAttribute('data-live'))patch(current,target);
   }
   index++;
  }
  while(parent.childNodes.length>index)parent.removeChild(parent.lastChild);
 }
 patch(container,template.content);
}
