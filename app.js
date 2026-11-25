const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// 只强调展示文本中的数字与方法词，链接、标题和原始数据保持不变。
function highlightText(value){
 const text=String(value);
 const pattern=/(?:0\s*到\s*1|\d+(?:[.,]\d+)*(?:\s*(?:→|—|–|至|到|-)\s*\d+(?:[.,]\d+)*)?\s*(?:万元|万\+?|元|%|\+|个月|分钟|个|场|人|条|天)|SOP|AI|ERP|MRD)/g;
 let html='',cursor=0;
 for(const match of text.matchAll(pattern)){html+=escapeHtml(text.slice(cursor,match.index))+`<mark class="text-highlight">${escapeHtml(match[0])}</mark>`;cursor=match.index+match[0].length;}
 return html+escapeHtml(text.slice(cursor));
}
document.querySelector('#year').textContent=new Date().getFullYear();
const timelineItems=experienceData.map((item,index)=>({item,index})).reverse();
document.querySelector('#experience-timeline').innerHTML=timelineItems.map(({item,index})=>`<li><button class="timeline-card" data-tone="${['sage','clay','blue','sage','clay'][index]}" data-case="${index}" aria-haspopup="dialog" aria-controls="case-dialog" aria-label="查看${escapeHtml(item.fullName)}的工作履历与代表实践"><span class="timeline-card-top"><span class="timeline-period">${escapeHtml(item.period || '任职时间待补充')}</span><span class="timeline-role">${escapeHtml(item.role)}</span></span><span class="timeline-company">${escapeHtml(item.fullName)}</span><span class="timeline-scope">${escapeHtml(item.scope)}</span><span class="timeline-skill">${escapeHtml(item.skill)}</span><span class="timeline-card-bottom"><span>${highlightText(item.summary)}</span><span class="timeline-open">查看工作与实践 ＋</span></span></button></li>`).join('');
const caseDialog=document.querySelector('#case-dialog');
function renderExperience(item){
 const projects=[{title:item.primaryTitle,blocks:item.parts.filter(([title])=>!['背景与角色','能力积累'].includes(title))},...item.extraProjects];
 const metrics=item.metrics.map(([value,label])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
 const duties=item.duties.map(([title])=>`<li>${escapeHtml(title)}</li>`).join('');
 const growthTags=item.growthTags.map(tag=>`<li>${escapeHtml(tag)}</li>`).join('');
 const practices=renderPractices(item,projects);
 const hasDocumentLinks=item.documents.some(doc=>typeof doc==='object'&&/^https:\/\//.test(doc.url || ''));

 const documents=item.documents.length?`<section class="career-section"><h3>相关文档</h3><p class="career-caption">${hasDocumentLinks?'资料在新标签页打开，访问权限遵循原文档或文件夹设置。':'说明书中列出的相关材料，链接待补充。'}</p><ul class="document-list">${item.documents.map(doc=>typeof doc==='object'&&/^https:\/\//.test(doc.url || '')?`<li class="linked-document"><a href="${escapeHtml(doc.url)}" target="_blank" rel="noopener noreferrer"><span class="document-title">${escapeHtml(doc.title)}</span><span class="document-access">${escapeHtml(doc.access || '访问权限以文档设置为准')}</span><span class="document-action">${doc.kind==='folder'?'打开文件夹':'打开文档'}</span></a></li>`:`<li>${escapeHtml(typeof doc==='string'?doc:doc.title)}</li>`).join('')}</ul></section>`:'';
 return `<section class="career-section career-results"><h3>工作成果</h3><dl class="career-metrics">${metrics}</dl><p class="career-caption">${escapeHtml(item.note || '数据来自个人说明书；统计周期、指标口径与个人贡献边界待补充。不同实践的数据分别标明范围。')}</p></section><section class="career-section career-role"><h3>我的角色和职责</h3><p class="career-role-summary"><strong>${escapeHtml(item.role)}</strong><span>${escapeHtml(item.scope)}</span></p><ul class="role-duty-list" aria-label="职责概览">${duties}</ul></section><section class="career-section career-growth"><h3>能力成长</h3><ul class="career-growth-tags" aria-label="能力成长标签">${growthTags}</ul></section><section class="career-section"><h3>代表实践</h3><p class="career-caption">工作链路、实际作品与相关成果。</p>${practices}</section>${documents}`;
}
document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{
 const item=experienceData[Number(button.dataset.case)];
 document.querySelector('#case-title').textContent=item.fullName;
 document.querySelector('.dialog-sub').textContent=item.source || '工作履历与代表实践 · 根据个人说明书整理';
 document.querySelector('.detail-meta').textContent=[item.role,item.location,item.period || '任职时间待补充'].join(' · ');
 caseDialog.querySelector('.editor-note').textContent=item.note || '职责与业绩按个人说明书整理；待补充项不作为已确认事实。';
 document.querySelector('#case-body').innerHTML=renderExperience(item);
 setupPracticeInteractions(document.querySelector('#case-body'));
 caseDialog.showModal();caseDialog.scrollTop=0;document.body.classList.add('modal-open');
}));
const videoDialog=document.querySelector('#video-dialog');
const workVideo=document.querySelector('#work-video');
function openVideoViewer(item){
 document.querySelector('#video-title').textContent=item.title;
 document.querySelector('#video-status').textContent='';
 workVideo.src=item.src;workVideo.poster=item.poster;workVideo.preload='metadata';workVideo.load();
 videoDialog.showModal();document.body.classList.add('modal-open');
}
videoDialog.addEventListener('close',()=>{workVideo.pause();workVideo.removeAttribute('src');workVideo.removeAttribute('poster');workVideo.load();document.querySelector('#video-status').textContent='';});
workVideo.addEventListener('error',()=>{if(workVideo.getAttribute('src'))document.querySelector('#video-status').textContent='视频暂时无法加载，请稍后重试。';});
const artworkDialog=document.querySelector('#artwork-dialog');
let currentArtworks=[],artworkIndex=0;
function showArtwork(index){
 artworkIndex=(index+currentArtworks.length)%currentArtworks.length;
 const artwork=currentArtworks[artworkIndex];
 document.querySelector('#artwork-title').textContent=artwork.title;
 const image=document.querySelector('#artwork-image');image.src=artwork.src;image.alt=artwork.alt;
 document.querySelector('#artwork-original').href=artwork.src;
 document.querySelector('#artwork-count').textContent=`${artworkIndex+1} / ${currentArtworks.length}`;
 artworkDialog.scrollTop=0;
}
function openArtworkViewer(artworks,index){
 currentArtworks=artworks;showArtwork(index);artworkDialog.showModal();document.body.classList.add('modal-open');
}
document.querySelector('#artwork-prev').addEventListener('click',()=>showArtwork(artworkIndex-1));
document.querySelector('#artwork-next').addEventListener('click',()=>showArtwork(artworkIndex+1));
artworkDialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showArtwork(artworkIndex+(event.key==='ArrowLeft'?-1:1));}});
const photoDialog=document.querySelector('#photo-dialog');
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{const photo=document.querySelector('#large-photo');photo.src=button.dataset.photo;photo.alt=button.querySelector('img').alt;document.querySelector('#photo-caption').textContent=button.dataset.caption;photoDialog.showModal();document.body.classList.add('modal-open');}));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});});
const menu=document.querySelector('.menu'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'收起':'目录';});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='目录';}));
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){nav.querySelectorAll('a').forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id));}});},{rootMargin:'-10% 0px -65% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));

// 内容默认可见；支持动效的浏览器才启用一次性入场动画。
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reducedMotion && 'IntersectionObserver' in window){
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-revealed');revealObserver.unobserve(entry.target);}}},{threshold:0.08,rootMargin:'0px 0px 24px 0px'});
 document.querySelectorAll('.about-content,.experience-timeline>li,.future,.photo-grid figure').forEach(element=>{element.classList.add('reveal-ready');revealObserver.observe(element);});
}

// 复盘文章复用原生 dialog 的键盘、焦点与关闭行为。
const reflectionDialog=document.querySelector('#reflection-dialog');
document.querySelector('.reflection-read').addEventListener('click',()=>{
 reflectionDialog.showModal();reflectionDialog.scrollTop=0;document.body.classList.add('modal-open');
});
