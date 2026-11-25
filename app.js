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
document.querySelector('#experience-timeline').innerHTML=timelineItems.map(({item,index})=>`<li><button class="timeline-card" data-tone="${['sage','clay','blue','sage','clay'][index]}" data-case="${index}" aria-haspopup="dialog" aria-controls="case-dialog" aria-label="查看${escapeHtml(item.fullName)}的工作履历与代表实践"><span class="timeline-card-top"><span class="timeline-period">${escapeHtml(item.period || '任职时间待补充')}</span><span class="timeline-role">${escapeHtml(item.role)}</span></span><span class="timeline-company">${escapeHtml(item.fullName)}</span><span class="timeline-scope">${escapeHtml(item.preview.scope)}</span><span class="timeline-card-bottom"><span class="timeline-tags">${item.preview.tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</span><span class="timeline-open">查看工作与实践 ＋</span></span></button></li>`).join('');
const caseDialog=document.querySelector('#case-dialog');
function renderExperience(item){
 const tags=item.growthTags.map(tag=>`<li>${escapeHtml(tag)}</li>`).join('');
 const documents=item.documents.length?`<section class="career-section star-documents"><h3>相关文档</h3><ul class="document-list">${item.documents.map(doc=>typeof doc==='object'&&/^https:\/\//.test(doc.url || '')?`<li class="linked-document"><a href="${escapeHtml(doc.url)}" target="_blank" rel="noopener noreferrer"><span class="document-title">${escapeHtml(doc.title)}</span><span class="document-access">${escapeHtml(doc.access || '访问权限以文档设置为准')}</span><span class="document-action">${doc.kind==='folder'?'打开文件夹':'打开文档'}</span></a></li>`:`<li>${escapeHtml(typeof doc==='string'?doc:doc.title)}</li>`).join('')}</ul></section>`:'';
 let works='';
 if(item.practiceLayout.type==='gallery'){
  const gallery=item.practiceLayout.gallery;
  const counts=[['视频',gallery.filter(x=>x.kind==='video').length],['海报',gallery.filter(x=>x.image).length],['图文案例',gallery.filter(x=>x.kind==='article-campaign').length]].filter(([,n])=>n).map(([label,n])=>`${n} ${label}`).join(' · ');
  works=`<details class="star-assets"><summary><span>作品佐证</span><small>${counts}</small></summary><div class="star-assets-body">${renderGallery({title:'视频、海报与图文作品'},item.practiceLayout)}</div></details>`;
 }
 return `<div class="career-star-content">${renderStarCases(item)}${works}<section class="career-section star-growth"><h3>能力积累</h3><ul class="career-growth-tags" aria-label="能力成长标签">${tags}</ul></section>${documents}</div>`;
}
document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{
 const item=experienceData[Number(button.dataset.case)];
 document.querySelector('#case-title').textContent=item.fullName;
 document.querySelector('.dialog-sub').textContent='项目复盘 · 背景 / 任务 / 行动 / 结果';
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

// 首页标签进入分类内容；原生 details 承载条目详情，内容增加时继续追加条目。
const libraryCategories={
 work:{group:'lab',label:'可体验作品',intro:'从想法到可使用的作品，点击条目查看说明或直接体验。',items:[{title:'旅策 · 旅行规划助手',status:'可体验',summary:'围绕旅行需求，探索更清晰的行程规划体验。',paragraphs:['旅策是我正在做的旅行规划助手，希望把旅行需求整理成更清晰、便于执行的行程计划。','作品仍在持续完善，可以打开体验链接查看当前版本。'],link:'https://lalala0705.github.io/lvce-travel/',linkLabel:'体验旅策'}]},
 skill:{group:'lab',label:'Skills',intro:'把重复使用的方法，整理成可以复用的能力。',items:[{title:'旅行研学手册生成器',status:'构思中',summary:'计划把旅行安排与研学任务整理成一份手册初稿。',paragraphs:['计划输入目的地、旅行天数与研学目标，生成行程与学习任务，辅助制作旅行研学手册。','目前处于构思阶段，示例手册与 Skill 下载后续补充。']}]},
 growth:{group:'notes',label:'个人成长',intro:'记录反馈、变化，以及正在练习的事。',items:[{title:'从“做完”到“做到位”',status:'成长复盘',summary:'一次关于交付质量的反馈，让我重新理解忙碌、复盘与成长。',article:true}]},
 'work-notes':{group:'notes',label:'工作复盘',intro:'记录工作里的判断、方法与复盘。',items:[]},
 'life-notes':{group:'notes',label:'生活观察',intro:'记录工作之外的好奇、观察与感受。',items:[]}
};
const libraryDialog=document.querySelector('#library-dialog');
const libraryFilters=libraryDialog.querySelector('.library-filters');
const libraryList=document.querySelector('#library-list');
function renderLibraryCategory(key){
 const category=libraryCategories[key];
 if(!category)return;
 const isLab=category.group==='lab';
 document.querySelector('#library-title').textContent=isLab?'Vibe Coding':'思考与创作';
 document.querySelector('#library-eyebrow').textContent=isLab?'BUILD & EXPERIMENT':'THINKING & CREATION';
 document.querySelector('#library-intro').textContent=category.intro;
 libraryFilters.innerHTML=Object.entries(libraryCategories).filter(([,item])=>item.group===category.group).map(([id,item])=>`<button type="button" data-library-category="${id}" aria-pressed="${id===key}">${escapeHtml(item.label)}</button>`).join('');
 if(!category.items.length){
  libraryList.innerHTML='<div class="library-empty"><span>慢慢整理中</span><p>这个分类还没有公开内容，写好后会放在这里。</p></div>';
 }else{
  libraryList.innerHTML=category.items.map(item=>{
   let detail;
   if(item.article){
    const source=document.querySelector('#reflection-dialog .reflection-article').cloneNode(true);
    source.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
    // 标题已在条目上展示，正文从引言开始。
    source.querySelector('h2').remove();detail=source.outerHTML;
   }else{
    detail=item.paragraphs.map(text=>`<p>${escapeHtml(text)}</p>`).join('');
    if(item.link)detail+=`<a class="button library-experience" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.linkLabel)}<span class="sr-only">（新标签页打开）</span></a>`;
   }
   return `<details class="library-record"><summary><span class="library-record-heading"><span class="library-record-title">${escapeHtml(item.title)}</span><span class="library-record-status">${escapeHtml(item.status)}</span></span><span class="library-record-summary">${escapeHtml(item.summary)}</span><span class="library-record-action">${item.article?'阅读全文':'查看项目说明'}<span aria-hidden="true" class="library-expand">＋</span></span></summary><div class="library-record-body">${detail}</div></details>`;
  }).join('');
 }
 libraryDialog.querySelector('.library-scroll').scrollTop=0;
}
libraryFilters.addEventListener('click',event=>{
 const button=event.target.closest('[data-library-category]');if(!button)return;
 const key=button.dataset.libraryCategory;renderLibraryCategory(key);
 libraryFilters.querySelector(`[data-library-category="${key}"]`).focus({preventScroll:true});
});
document.querySelectorAll('[data-library-open]').forEach(button=>button.addEventListener('click',()=>{
 renderLibraryCategory(button.dataset.libraryOpen);libraryDialog.showModal();
 document.body.classList.add('modal-open');
}));
