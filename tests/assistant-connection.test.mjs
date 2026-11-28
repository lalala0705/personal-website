import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup(healthResults){
 const elements=new Map();
 function element(){return {hidden:true,disabled:false,textContent:'',value:'',childNodes:[],classList:{add(){},remove(){}},events:{},addEventListener(name,fn){this.events[name]=fn;},setAttribute(){},focus(){},append(...items){this.childNodes.push(...items);},querySelector:find,querySelectorAll(){return [];}};}
 function find(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);}
 const root=find('#bill-assistant');let calls=0;
 const context={document:{querySelector:find,createElement:element},window:{BILL_ASSISTANT_CONFIG:{endpoint:'https://example.com/chat'},addEventListener(){}},URL,AbortController,setTimeout,clearTimeout,
 fetch:async url=>{
  if(String(url).includes('/health')){const result=healthResults[calls++];if(result instanceof Error)throw result;return {ok:true,json:async()=>result};}
  return {ok:true,json:async()=>({careers:[]})};
 }};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assistant.js','utf8'),context);
 return {find,root,calls:()=>calls,async open(){find('.bill-launcher').events.click();await new Promise(resolve=>setImmediate(resolve));}};
}

test('transient health failure can be retried instead of permanently disabling AI',async()=>{
 const app=setup([new Error('network unavailable'),{ready:true}]);
 await app.open();assert.match(app.find('.bill-mode').textContent,/连接暂不可用/);assert.equal(app.find('.bill-retry').hidden,false);
 await app.find('.bill-retry').events.click();
 assert.equal(app.calls(),2);assert.match(app.find('.bill-mode').textContent,/AI 对话/);assert.equal(app.find('.bill-retry').hidden,true);
});

test('connection probe works without AbortSignal.timeout and deduplicates concurrent checks',async()=>{
 const app=setup([{ready:true}]);
 await Promise.all([app.open(),app.find('.bill-retry').events.click()]);
 assert.equal(app.calls(),1);assert.match(app.find('.bill-mode').textContent,/AI 对话/);
});

test('backend not ready remains a guide and can recover on reopening',async()=>{
 const app=setup([{ready:false},{ready:true}]);
 await app.open();assert.doesNotMatch(app.find('.bill-mode').textContent,/AI 对话/);
 app.find('.bill-panel').hidden=true;await app.open();assert.match(app.find('.bill-mode').textContent,/AI 对话/);
});
