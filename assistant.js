(()=>{
 const root=document.querySelector('#bill-assistant');
 const launcher=root.querySelector('.bill-launcher'),panel=root.querySelector('.bill-panel');
 const close=root.querySelector('.bill-close'),form=root.querySelector('form'),input=root.querySelector('textarea');
 const log=root.querySelector('.bill-messages'),status=root.querySelector('.bill-status');
 const mode=root.querySelector('.bill-mode'),notice=root.querySelector('.bill-notice');
 const sendButton=form.querySelector('button'),retry=root.querySelector('.bill-retry'),matchButton=root.querySelector('.bill-match'),matchHint=root.querySelector('.bill-match-hint');
 let matchMode=false,knowledge=null,pending=false,aiReady=false,connectionCheck=null,checking=false,connectionAttempted=false,controller=null;
 const messages=[];
 const endpoint=window.BILL_ASSISTANT_CONFIG?.endpoint||'';
 const validEndpoint=(()=>{try{return new URL(endpoint).protocol==='https:';}catch{return false;}})();
 function modeLabel(){
  mode.textContent=aiReady?'AI 对话 · 网站公开资料':checking?'正在连接 AI…':validEndpoint?(connectionAttempted?'AI 连接暂不可用 · 内容导览':'等待检查 AI 连接'):'内容导览 · AI 尚未配置';
  notice.textContent=aiReady?'消息将发送至 DeepSeek，用于介绍网站公开内容。请勿输入私密信息。':checking?'正在检查连接，请稍候。':'目前按网站资料提供导览，未调用 AI。';
  retry.hidden=aiReady||!validEndpoint||!connectionAttempted;retry.disabled=checking;
 }
 async function checkConnection(){
  if(!validEndpoint||aiReady)return;
  if(connectionCheck)return connectionCheck;
  connectionAttempted=true;checking=true;modeLabel();
  connectionCheck=(async()=>{
   const probe=new AbortController(),timer=setTimeout(()=>probe.abort(),8000);
   try{
    const r=await fetch(new URL('/health',endpoint),{signal:probe.signal,credentials:'omit',cache:'no-store'});
    const d=await r.json();aiReady=r.ok&&d.ready===true;
   }catch{aiReady=false;}
   finally{clearTimeout(timer);checking=false;modeLabel();}
  })();
  try{await connectionCheck;}finally{connectionCheck=null;}
 }
 function append(role,text,sources=[]){
  const row=document.createElement('div');row.className='bill-message '+(role==='user'?'bill-user':'bill-reply');
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
  await checkConnection();
 }
 function show(){
  panel.hidden=false;launcher.setAttribute('aria-expanded','true');launcher.classList.add('is-open');
  input.focus({preventScroll:true});modeLabel();
  load().catch(error=>{status.textContent=error.message;});
 }
 retry.addEventListener('click',()=>load().catch(error=>{status.textContent=error.message;}));
 function hide(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.classList.remove('is-open');launcher.focus({preventScroll:true});}
 launcher.addEventListener('click',()=>panel.hidden?show():hide());close.addEventListener('click',hide);
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();hide();}});
 root.querySelectorAll('[data-bill-question]').forEach(button=>button.addEventListener('click',()=>{setMatchMode(false);submit(button.dataset.billQuestion);}));
 log.addEventListener('click',event=>{
  const button=event.target.closest('[data-bill-action]');if(!button)return;
  const [type,value]=button.dataset.billAction.split(':');hide();
  if(type==='anchor'&&['home','journey','lab','notes','life','contact'].includes(value)){document.querySelector(`.header nav a[href="#${value}"]`)?.click();}
  if(type==='career'&&/^\d$/.test(value))document.querySelector(`[data-case="${value}"]`)?.click();
  if(type==='life'&&['travel','reading','podcast'].includes(value))document.querySelector(`[data-life-open="${value}"]`)?.click();
  if(type==='library'&&['work','skill','growth'].includes(value))document.querySelector(`[data-library-open="${value}"]`)?.click();
  if(type==='demo')window.open('https://lalala0705.github.io/lvce-travel/','_blank','noopener,noreferrer');
 });
 function setMatchMode(enabled){
  if(pending)return;
  matchMode=enabled;root.classList[enabled?'add':'remove']('is-matching');
  matchButton.setAttribute('aria-pressed',String(enabled));matchHint.hidden=!enabled;
  input.maxLength=enabled?2000:400;input.rows=enabled?4:2;
  input.placeholder=enabled?'例如：教育业务私域运营；目标是提升体验课转化；需要社群、SOP 和数据复盘经验。':'想了解 Bill 的哪一面？';
  root.querySelector('label[for="bill-question"]').textContent=enabled?'输入岗位职责或合作需求':'想了解 Bill 的哪一面？';
  sendButton.textContent=enabled?'开始分析':'发送';status.textContent='';input.focus({preventScroll:true});
 }
 matchButton.addEventListener('click',()=>setMatchMode(!matchMode));
 root.querySelector('.bill-match-back').addEventListener('click',()=>setMatchMode(false));
 async function submit(value){
  const question=value.trim();if(!question||pending)return;
  const requestMode=matchMode?'match':'chat',limit=matchMode?2000:400;
  if(question.length>limit){status.textContent=`请将${matchMode?'岗位或合作需求':'问题'}控制在 ${limit} 字以内。`;return;}
  pending=true;sendButton.disabled=true;matchButton.disabled=true;root.querySelector('.bill-match-back').disabled=true;root.querySelectorAll('[data-bill-question]').forEach(b=>b.disabled=true);
  input.value='';append('user',question);status.textContent=matchMode?'正在对照岗位需求与网站经历…':'正在查阅网站资料…';
  try{
   await load();let answer;
   if(aiReady){
    controller=new AbortController();const timer=setTimeout(()=>controller.abort(),requestMode==='match'?33000:22000);
    try{
     const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:controller.signal,body:JSON.stringify({question,mode:requestMode,history:messages.filter(item=>item.mode===requestMode).slice(requestMode==='match'?-2:-6).map(item=>({role:item.role,content:item.content.slice(0,requestMode==='match'?1200:2000)}))})});
     const data=await response.json();if(!response.ok)throw new Error(data.error||'对话暂时不可用。');
     if(typeof data.answer!=='string'||data.answer.length>5000)throw new Error('回复暂不可用。');
     answer={text:data.answer,sources:Array.isArray(data.sources)?data.sources:[]};
    }catch{
     aiReady=false;modeLabel();if(requestMode==='match'){answer={text:'本次匹配分析未能完成，请稍后重试连接并再次提交。尚未生成匹配判断。',sources:[]};input.value=question;}else{answer=BillGuide.reply(question,knowledge);answer.text='AI 暂时未能回复，以下切换为网站内容导览：\n\n'+answer.text;}
    }finally{clearTimeout(timer);controller=null;}
   }else if(requestMode==='match'){answer={text:'岗位/合作匹配分析需要 AI 连接。请点击“重试连接”，连接成功后再次提交需求。',sources:[]};input.value=question;}else{answer=BillGuide.reply(question,knowledge);if(validEndpoint)answer.text='暂时无法连接 AI，以下按网站公开资料回答：\n\n'+answer.text;}
   append('assistant',answer.text,answer.sources);messages.push({role:'user',content:question,mode:requestMode},{role:'assistant',content:answer.text,mode:requestMode});if(messages.length>8)messages.splice(0,messages.length-8);status.textContent='';
  }catch(error){append('assistant',error.message||'暂时无法加载资料，请稍后重试。');status.textContent='';}
  finally{pending=false;sendButton.disabled=false;matchButton.disabled=false;root.querySelector('.bill-match-back').disabled=false;root.querySelectorAll('[data-bill-question]').forEach(b=>b.disabled=false);}
 }
 form.addEventListener('submit',event=>{event.preventDefault();submit(input.value);});
 input.addEventListener('keydown',event=>{if(!matchMode&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit(input.value);}});
 root.querySelector('.bill-clear').addEventListener('click',()=>{if(pending)return;messages.length=0;log.replaceChildren();welcome();input.focus();});
 function welcome(){append('assistant','你好，我是 Bill 的网站分身。想先了解他的工作经历、作品，还是工作之外？\n\n我会以网站公开资料为依据，没有提到的信息会直接说明。');}
 window.addEventListener('pagehide',()=>controller?.abort());welcome();modeLabel();
})();
