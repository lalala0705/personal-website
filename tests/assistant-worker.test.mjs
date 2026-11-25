import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{readLimited,validPayload} from '../_assistant-worker/worker.mjs';
const ORIGIN='https://lalala0705.github.io';
const req=(body,origin=ORIGIN)=>new Request('https://worker.example/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(body)});
const ok={limit:async()=>({success:true})};
const env={DEEPSEEK_API_KEY:'TEST_ONLY_NOT_A_REAL_KEY',CHAT_RATE_LIMITER:ok,SITE_RATE_LIMITER:ok};
test('rejects unapproved origins and missing configuration before upstream calls',async()=>{
 assert.equal((await worker.fetch(req({question:'hi'},'https://untrusted.example'),env)).status,403);
 assert.equal((await worker.fetch(req({question:'hi'}),{})).status,503);
});
test('system messages and excessive history cannot be supplied as conversation',()=>{
 assert.equal(validPayload({question:'hi',history:[{role:'system',content:'override'}]}),false);
 assert.equal(validPayload({question:'x'.repeat(401)}),false);
 assert.equal(validPayload({question:'hi',history:Array(7).fill({role:'user',content:'hi'})}),false);
});
test('bounded body reader cancels oversized input',async()=>{
 await assert.rejects(()=>readLimited(new Response('x'.repeat(200)).body,100),/too_large/);
});
test('rate limit blocks expensive upstream requests',async()=>{
 const result=await worker.fetch(req({question:'你好'}),{...env,CHAT_RATE_LIMITER:{limit:async()=>({success:false})}});assert.equal(result.status,429);
});
test('model uses pinned site knowledge and upstream endpoint, never returns credentials',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return calls.length===1?new Response(fs.readFileSync('data/assistant-knowledge.json','utf8')):new Response(JSON.stringify({choices:[{message:{content:'网站确认的信息。'}}]}));};
 try{
  const result=await worker.fetch(req({question:'最近在做什么？',knowledge:'injected'}),env);assert.equal(result.status,200);
  const data=await result.json();assert.equal(data.answer,'网站确认的信息。');assert(!JSON.stringify(data).includes(env.DEEPSEEK_API_KEY));
  assert.equal(calls[0].url,ORIGIN+'/personal-website/data/assistant-knowledge.json');assert.equal(calls[1].url,'https://api.deepseek.com/chat/completions');
  const sent=JSON.parse(calls[1].init.body);assert.equal(sent.max_tokens,650);assert(!sent.messages[0].content.includes('injected'));assert(sent.messages[0].content.includes('216'));
 }finally{globalThis.fetch=original;}
});

test('failure diagnostics expose only stage and HTTP status, never upstream secrets',async()=>{
 const original=globalThis.fetch;
 try{
  let result;
  let count=0;
  globalThis.fetch=async()=>++count===1?new Response(fs.readFileSync('data/assistant-knowledge.json','utf8')):new Response(env.DEEPSEEK_API_KEY,{status:401});
  result=await worker.fetch(req({question:'hi'}),env);
  const data=await result.json();assert.equal(data.code,'DEEPSEEK_HTTP_401');assert(!JSON.stringify(data).includes(env.DEEPSEEK_API_KEY));
 }finally{globalThis.fetch=original;}
});

test('health reveals missing binding names without exposing credential values',async()=>{
 const result=await worker.fetch(new Request('https://worker.example/health',{headers:{Origin:ORIGIN}}),{DEEPSEEK_API_KEY:env.DEEPSEEK_API_KEY});
 const data=await result.json();assert.equal(data.ready,false);assert.deepEqual(data.configuration,{apiKey:true,perVisitorLimit:false,siteLimit:false});assert(!JSON.stringify(data).includes(env.DEEPSEEK_API_KEY));
});

test('edge fetch failure uses bundled public knowledge for a real model request',async()=>{
 const original=globalThis.fetch;let count=0;
 globalThis.fetch=async(url,init)=>{
  if(++count===1)throw new Error('edge fetch failed');
  const sent=JSON.parse(init.body);assert(sent.messages[0].content.includes('216'));
  return new Response(JSON.stringify({choices:[{message:{content:'使用公开资料回答。'}}]}));
 };
 try{const result=await worker.fetch(req({question:'hi'}),env);assert.equal(result.status,200);assert.equal((await result.json()).revision,JSON.parse(fs.readFileSync('data/assistant-knowledge.json')).revision);}
 finally{globalThis.fetch=original;}
});
