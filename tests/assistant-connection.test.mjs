import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup(healthResults){
 const elements=new Map();
 function element(){return {hidden:true,disabled:false,textContent:'',value:'',childNodes:[],classList:{add(){},remove(){}},events:{},addEventListener(name,fn){this.events[name]=fn;},setAttribute(){},focus(){},append(...items){this.childNodes.push(...items);},querySelector:find,querySelectorAll(){return [];}};}
 function find(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);}
 const root=find('#bill-assistant');let calls=0;const requests=[];
 const context={document:{querySelector:find,createElement:element},window:{BILL_ASSISTANT_CONFIG:{endpoint:'https://example.com/chat'},addEventListener(){}},URL,AbortController,setTimeout,clearTimeout,
 fetch:async (url,init)=>{
  if(String(url).includes('/health')){const result=healthResults[calls++];if(result instanceof Error)throw result;return {ok:true,json:async()=>result};}
  if(String(url).endsWith('/chat')){requests.push(JSON.parse(init.body));return {ok:true,json:async()=>({answer:'仅根据公开经历进行对照。',sources:[]})};}
  return {ok:true,json:async()=>({careers:[]})};
 }};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assistant.js','utf8'),context);
 return {find,root,requests,calls:()=>calls,async open(){find('.bill-launcher').events.click();await new Promise(resolve=>setImmediate(resolve));}};
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

test('match entry expands input and sends an explicit mode without contaminating normal chat history',async()=>{
 const app=setup([{ready:true}]);await app.open();
 app.find('.bill-match').events.click();
 assert.equal(app.find('textarea').maxLength,2000);assert.equal(app.find('.bill-match-hint').hidden,false);
 app.find('textarea').value='教育社群运营，需要用户分层、社群 SOP、直播转化和SQL分析。';
 app.find('form').events.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.requests[0].mode,'match');assert.equal(app.requests[0].history.length,0);
 app.find('.bill-match-back').events.click();assert.equal(app.find('textarea').maxLength,400);
 app.find('textarea').value='介绍一下Bill';app.find('form').events.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.requests[1].mode,'chat');assert.equal(app.requests[1].history.length,0);
});
test('offline match request keeps the JD and never fabricates a guide-based assessment',async()=>{
 const app=setup([new Error('offline'),new Error('offline')]);await app.open();
 app.find('.bill-match').events.click();const jd='合作需求：制作研学手册并策划家长社群活动。';app.find('textarea').value=jd;
 app.find('form').events.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.requests.length,0);assert.equal(app.find('textarea').value,jd);
 assert.equal(app.find('form').querySelector('button').disabled,false);
});
