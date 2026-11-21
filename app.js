const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
document.querySelector('#year').textContent=new Date().getFullYear();
const timelineItems=experienceData.map((item,index)=>({item,index})).reverse();
document.querySelector('#experience-timeline').innerHTML=timelineItems.map(({item,index})=>`<li><button class="timeline-card" data-case="${index}" aria-haspopup="dialog" aria-controls="case-dialog" aria-label="查看${escapeHtml(item.fullName)}的工作履历与代表实践"><span class="timeline-card-top"><span class="timeline-period">${escapeHtml(item.period || '任职时间待补充')}</span><span class="timeline-role">${escapeHtml(item.role)}</span></span><span class="timeline-company">${escapeHtml(item.fullName)}</span><span class="timeline-scope">${escapeHtml(item.scope)}</span><span class="timeline-skill">${escapeHtml(item.skill)}</span><span class="timeline-card-bottom"><span>${escapeHtml(item.summary)}</span><span class="timeline-open">查看工作与实践 ＋</span></span></button></li>`).join('');
const caseDialog=document.querySelector('#case-dialog');
function renderExperience(item){
 const projects=[{title:item.primaryTitle,blocks:item.parts.filter(([title])=>!['背景与角色','能力积累'].includes(title))},...item.extraProjects];
 const metrics=item.metrics.map(([value,label])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
 const duties=item.duties.map(([title,body])=>`<article class="duty-card"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(body)}</p></article>`).join('');
 const practices=projects.map(({title,blocks},index)=>`<details class="practice-card"${index===0?' open':''}><summary>${escapeHtml(title)}<span class="practice-hint" aria-hidden="true">展开 / 收起</span></summary><div class="practice-body">${blocks.map(([label,body])=>`<section class="case-part"><h5>${escapeHtml(label)}</h5><p>${escapeHtml(body)}</p></section>`).join('')}</div></details>`).join('');
 const hasDocumentLinks=item.documents.some(doc=>typeof doc==='object'&&/^https:\/\//.test(doc.url || ''));
 const documents=item.documents.length?`<section class="career-section"><h3>相关文档</h3><p class="career-caption">${hasDocumentLinks?'文档在新标签页打开，访问权限遵循原文档设置。':'说明书中列出的相关材料，链接待补充。'}</p><ul class="document-list">${item.documents.map(doc=>typeof doc==='object'&&/^https:\/\//.test(doc.url || '')?`<li class="linked-document"><a href="${escapeHtml(doc.url)}" target="_blank" rel="noopener noreferrer"><span class="document-title">${escapeHtml(doc.title)}</span><span class="document-access">${escapeHtml(doc.access || '访问权限以文档设置为准')}</span><span class="document-action">打开文档</span></a></li>`:`<li>${escapeHtml(typeof doc==='string'?doc:doc.title)}</li>`).join('')}</ul></section>`:'';
 return `<section class="career-section career-results"><h3>工作成果速览</h3><dl class="career-metrics">${metrics}</dl><p class="career-caption">${escapeHtml(item.note || '数据来自个人说明书；统计周期、指标口径与个人贡献边界待补充。不同实践的数据分别标明范围。')}</p></section><div class="career-intro"><section class="career-section"><h3>角色与职责</h3><p>${escapeHtml(item.scope)}</p></section><section class="career-section"><h3>能力成长</h3><span class="experience-skill">${escapeHtml(item.skill)}</span><p>${escapeHtml(item.growth)}</p></section></div><section class="career-section"><h3>具体负责什么</h3><div class="duty-grid">${duties}</div></section><section class="career-section"><h3>代表实践</h3><p class="career-caption">按实践展开查看问题、动作与结果；未提供的判断与取舍保留待补充。</p>${practices}</section>${documents}`;
}
document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{
 const item=experienceData[Number(button.dataset.case)];
 document.querySelector('#case-title').textContent=item.fullName;
 document.querySelector('.dialog-sub').textContent=item.source || '工作履历与代表实践 · 根据个人说明书整理';
 document.querySelector('.detail-meta').textContent=[item.role,item.location,item.period || '任职时间待补充'].join(' · ');
 caseDialog.querySelector('.editor-note').textContent=item.note || '职责与业绩按个人说明书整理；待补充项不作为已确认事实。';
 document.querySelector('#case-body').innerHTML=renderExperience(item);
 caseDialog.showModal();caseDialog.scrollTop=0;document.body.classList.add('modal-open');
}));
const photoDialog=document.querySelector('#photo-dialog');
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{const photo=document.querySelector('#large-photo');photo.src=button.dataset.photo;photo.alt=button.querySelector('img').alt;document.querySelector('#photo-caption').textContent=button.dataset.caption;photoDialog.showModal();document.body.classList.add('modal-open');}));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});});
const menu=document.querySelector('.menu'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'收起':'目录';});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='目录';}));
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){nav.querySelectorAll('a').forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id));}});},{rootMargin:'-10% 0px -65% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));
