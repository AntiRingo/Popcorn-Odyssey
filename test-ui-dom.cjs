// Minimal DOM fixture for reconciliation identity tests; no browser required.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Node {
 constructor(name,type=1,value=null){this.nodeName=name;this.nodeType=type;this.nodeValue=value;this.childNodes=[];this.parentNode=null;this.attrs=new Map();}
 get attributes(){return [...this.attrs].map(([name,value])=>({name,value}));}
 get lastChild(){return this.childNodes.at(-1);}
 getAttribute(name){return this.attrs.get(name)??null;}
 hasAttribute(name){return this.attrs.has(name);}
 setAttribute(name,value){this.attrs.set(name,value);}
 removeAttribute(name){this.attrs.delete(name);}
 insertBefore(node,before){if(node.parentNode)node.parentNode.removeChild(node);const index=before?this.childNodes.indexOf(before):this.childNodes.length;assert.ok(index>=0);this.childNodes.splice(index,0,node);node.parentNode=this;}
 removeChild(node){this.childNodes.splice(this.childNodes.indexOf(node),1);node.parentNode=null;}
 cloneNode(deep){const copy=new Node(this.nodeName,this.nodeType,this.nodeValue);copy.attrs=new Map(this.attrs);if(deep)this.childNodes.forEach(n=>copy.insertBefore(n.cloneNode(true),null));return copy;}
}
function parse(html){
 const root=new Node('#fragment',11),stack=[root];
 for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){
  if(token.startsWith('</')){stack.pop();continue;}
  if(token.startsWith('<')){const [,tag,attributes]=token.match(/^<([\w-]+)(.*?)>$/),node=new Node(tag.toUpperCase());for(const match of attributes.matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(match[1],match[2]??'');stack.at(-1).insertBefore(node,null);stack.push(node);}
  else stack.at(-1).insertBefore(new Node('#text',3,token),null);
 }
 return root;
}
const context=vm.createContext({document:{createElement:()=>({set innerHTML(value){this.content=parse(value);}})}});
vm.runInContext(fs.readFileSync('ui-dom.js','utf8'),context);
const sync=context.syncMarkup,root=new Node('DIV');
const customer=(id,seconds)=>`<button data-customer="${id}" aria-label="订单 ${id}"><span>${seconds} 秒</span><span>原味</span></button>`;
sync(root,customer(1,40)+customer(2,50));
const held=root.childNodes[1],heldText=held.childNodes[0].childNodes[0];let clicks=0;held.onclick=()=>clicks++;
for(let i=0;i<20;i++){sync(root,customer(1,40-i)+customer(2,50-i));assert.equal(root.childNodes[1],held);assert.equal(held.childNodes[0].childNodes[0],heldText);}
held.onclick();assert.equal(clicks,1);
// A different guest leaves while this button is held: the remaining identity survives.
sync(root,customer(2,29)+customer(3,60));assert.equal(root.childNodes[0],held);held.onclick();assert.equal(clicks,2);
assert.equal(root.childNodes.length,2);
const fleet=new Node('DIV');
const unit=(id,seconds,selected)=>`<article data-key="machine-${id}" class="${selected?'selected':''}"><button data-machine="${id}"><span>${seconds} 秒</span></button><button data-pack="${id}" ${seconds?'disabled':''}>装盒</button></article>`;
sync(fleet,unit(0,6,true)+unit(1,6,false));const select=fleet.childNodes[1].childNodes[0],pack=fleet.childNodes[1].childNodes[1];
for(let i=5;i>=0;i--)sync(fleet,unit(0,i,false)+unit(1,i,true));
assert.equal(fleet.childNodes[1].childNodes[0],select);assert.equal(fleet.childNodes[1].childNodes[1],pack);assert.equal(pack.hasAttribute('disabled'),false);
console.log('PASS: timer refresh preserves buttons, text nodes and handlers; keyed customer removal preserves other targets; machine selection and completion preserve controls.');
