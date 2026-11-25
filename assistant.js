(()=>{
 const root=document.querySelector('#bill-assistant');
 const launcher=root.querySelector('.bill-launcher'),panel=root.querySelector('.bill-panel');
 const close=root.querySelector('.bill-close'),form=root.querySelector('form'),input=root.querySelector('textarea');
 const log=root.querySelector('.bill-messages'),status=root.querySelector('.bill-status');
 const mode=root.querySelector('.bill-mode'),notice=root.querySelector('.bill-notice');
 const sendButton=form.querySelector('button');
 let knowledge=null,pending=false,aiReady=false,checked=false,controller=null;
 const messages=[];
 const endpoint=window.BILL_ASSISTANT_CONFIG?.endpoint||'';
 const validEndpoint=(()=>{try{return new URL(endpoint).protocol==='https:';}catch{return false;}})();
 function modeLabel(){mode.textContent=aiReady?'AI 对话 · 网站公开资料':'内容导览 · AI 尚未接通';notice.textContent=aiReady?'消息将发送至 DeepSeek，用于介绍网站公开内容。请勿输入私密信息。':'目前按网站资料提供导览，未调用 AI。';}
 function append(role,text,sources=[]){
  const row=document.createElement('div');row.className='bill-message bill-'+role;
  const label=document.createElement('span');label.className='bill-sender';label.textContent=role==='user'?'你':'Bill 的分身';
  const bubble=document.createElement('p');bubble.textContent=text;
  row.append(label,bubble);
  const links=document.createElement('div');links.className='bill-sources';
  for(const item of sources){
   if(item.action){const button=document.createElement('button');button.type='button';button.textContent=item.label;button.dataset.billAction=item.action;links.append(button);}
   else if(['#journey','#home','#life','#lab','#contact','https://lalala0705.github.io/lvce-travel/'].includes(item.url)){
    const a=document.createElement('a');a.textContent=item.label;a.href=item.url;
    if(item.url.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}else a.addEventListener('click',hide);
    links.append(a);
   }
  }
  if(links.childNodes.length)row.append(links);log.append(row);log.scrollTop=log.scrollHeight;
 }
 async function load(){
  if(!knowledge){const response=await fetch('data/assistant-knowledge.json',{cache:'no-cache'});if(!response.ok)throw new Error('资料暂时无法加载，请稍后重试。');knowledge=await response.json();if(!Array.isArray(knowledge.careers))throw new Error('网站资料暂不可用。');}
  if(!checked&&validEndpoint){checked=true;try{
   const health=new URL('/health',endpoint);const r=await fetch(health,{signal:AbortSignal.timeout(5000),credentials:'omit'});const d=await r.json();aiReady=r.ok&&d.ready===true;
  }catch{aiReady=false;}modeLabel();}
 }
 function show(){
  panel.hidden=false;launcher.setAttribute('aria-expanded','true');launcher.classList.add('is-open');
  input.focus({preventScroll:true});modeLabel();
  load().catch(error=>{status.textContent=error.message;});
 }
 function hide(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.classList.remove('is-open');launcher.focus({preventScroll:true});}
 launcher.addEventListener('click',()=>panel.hidden?show():hide());close.addEventListener('click',hide);
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();hide();}});
 root.querySelectorAll('[data-bill-question]').forEach(button=>button.addEventListener('click',()=>submit(button.dataset.billQuestion)));
 log.addEventListener('click',event=>{
  const button=event.target.closest('[data-bill-action]');if(!button)return;
  const [type,value]=button.dataset.billAction.split(':');hide();
  if(type==='anchor'&&['home','journey','lab','notes','life','contact'].includes(value)){document.querySelector(`.header nav a[href="#${value}"]`)?.click();}
  if(type==='career'&&/^\d$/.test(value))document.querySelector(`[data-case="${value}"]`)?.click();
  if(type==='life'&&['travel','reading','podcast'].includes(value))document.querySelector(`[data-life-open="${value}"]`)?.click();
  if(type==='library'&&['work','skill','growth'].includes(value))document.querySelector(`[data-library-open="${value}"]`)?.click();
  if(type==='demo')window.open('https://lalala0705.github.io/lvce-travel/','_blank','noopener,noreferrer');
 });
 async function submit(value){
  const question=value.trim();if(!question||pending)return;
  if(question.length>400){status.textContent='请把问题控制在 400 字以内。';return;}
  pending=true;sendButton.disabled=true;root.querySelectorAll('[data-bill-question]').forEach(b=>b.disabled=true);
  input.value='';append('user',question);status.textContent='正在查阅网站资料…';
  try{
   await load();let answer;
   if(aiReady){
    controller=new AbortController();const timer=setTimeout(()=>controller.abort(),22000);
    try{
     const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:controller.signal,body:JSON.stringify({question,history:messages.slice(-6).map(item=>({...item,content:item.content.slice(0,2000)}))})});
     const data=await response.json();if(!response.ok)throw new Error(data.error||'对话暂时不可用。');
     if(typeof data.answer!=='string'||data.answer.length>5000)throw new Error('回复暂不可用。');
     answer={text:data.answer,sources:Array.isArray(data.sources)?data.sources:[]};
    }catch{
     answer=BillGuide.reply(question,knowledge);answer.text='AI 暂时未能回复，以下切换为网站内容导览：\n\n'+answer.text;
    }finally{clearTimeout(timer);controller=null;}
   }else answer=BillGuide.reply(question,knowledge);
   append('assistant',answer.text,answer.sources);messages.push({role:'user',content:question},{role:'assistant',content:answer.text});if(messages.length>8)messages.splice(0,messages.length-8);status.textContent='';
  }catch(error){append('assistant',error.message||'暂时无法加载资料，请稍后重试。');status.textContent='';}
  finally{pending=false;sendButton.disabled=false;root.querySelectorAll('[data-bill-question]').forEach(b=>b.disabled=false);}
 }
 form.addEventListener('submit',event=>{event.preventDefault();submit(input.value);});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit(input.value);}});
 root.querySelector('.bill-clear').addEventListener('click',()=>{if(pending)return;messages.length=0;log.replaceChildren();welcome();input.focus();});
 function welcome(){append('assistant','你好，我是 Bill 的网站分身。想先了解他的工作经历、作品，还是工作之外？\n\n我会以网站公开资料为依据，没有提到的信息会直接说明。');}
 window.addEventListener('pagehide',()=>controller?.abort());welcome();modeLabel();
})();
