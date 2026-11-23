// 模板只读取已有履历内容；图标用于说明流程，不代表真实作品截图。
function practiceIcon(name){
 const paths={
  users:'<circle cx="20" cy="15" r="6"/><path d="M8 38v-5a12 12 0 0 1 24 0v5M34 10a6 6 0 0 1 0 12M39 38v-5a11 11 0 0 0-6-10"/>',
  plan:'<rect x="9" y="7" width="30" height="36" rx="3"/><path d="M17 5v6M31 5v6M16 19h16M16 27h9M16 35h13"/>',
  content:'<rect x="7" y="6" width="34" height="36" rx="3"/><path d="M14 14h20M14 21h20M14 28h12M14 35h16"/>',
  handoff:'<path d="M5 18l9-7 10 6 9-6 10 7-9 15-10 5-10-5zM14 18l10 7 10-7M24 25v13"/>',
  chart:'<path d="M8 7v34h34M16 32v-8M25 32V17M34 32V10M14 15l10-7 10-3"/>',
  film:'<rect x="5" y="10" width="27" height="28" rx="4"/><path d="M32 19l11-7v24l-11-7M12 18h13M12 25h9"/>'
 };
 return `<svg class="practice-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.plan}</svg>`;
}

function practiceRecord(project){
 return `<details class="practice-record"><summary>查看完整项目记录</summary><div class="practice-body">${project.blocks.map(([label,body])=>`<section class="case-part"><h5>${escapeHtml(label)}</h5><p>${highlightText(body)}</p></section>`).join('')}</div></details>`;
}

function practiceHeader(project,type){
 return `<header class="practice-view-heading"><span class="practice-format">${type}</span><h4>${escapeHtml(project.title)}</h4></header>`;
}

function renderStoryboard(project,steps,aside){
 return `<article class="practice-view practice-storyboard">${practiceHeader(project,'流程故事板')}<ol class="story-steps">${steps.map(([title,body,icon],index)=>`<li><div class="story-step-art">${practiceIcon(icon)}<span class="story-step-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span></div><h5>${escapeHtml(title)}</h5><p>${highlightText(body)}</p></li>`).join('')}</ol>${aside?`<p class="practice-aside">${highlightText(aside)}</p>`:''}${practiceRecord(project)}</article>`;
}

function renderVideoMedia(item){
 if(!item.src)return `<div class="video-thumb video-thumb-pending">${practiceIcon('film')}<span>视频原片待接入</span></div>`;
 return `<button type="button" class="gallery-video" data-video-src="${escapeHtml(item.src)}" data-video-poster="${escapeHtml(item.poster)}" data-video-title="${escapeHtml(item.title)}" aria-haspopup="dialog" aria-controls="video-dialog" aria-label="观看${escapeHtml(item.title)}"><span class="video-thumb"><img src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)}视频画面封面" loading="lazy" decoding="async"><span class="video-play" aria-hidden="true">▶</span><span class="video-duration">${escapeHtml(item.duration)}</span></span><span class="gallery-artwork-label">观看视频</span></button>`;
}

function renderArticleCampaign(item){
 return `<div class="article-campaign-hero"><span class="eyebrow">${escapeHtml(item.format)}</span><h5>${escapeHtml(item.title)}</h5><p>${escapeHtml(item.workflow)}</p></div><div class="article-campaign-body"><dl class="article-campaign-brief"><div><dt>内容目的</dt><dd>${escapeHtml(item.goal)}</dd></div><div><dt>目标读者</dt><dd>${escapeHtml(item.audience)}</dd></div><div><dt>我负责的部分</dt><dd>${escapeHtml(item.contribution)}</dd></div></dl><h6>传播表现与账号增长</h6><dl class="article-campaign-metrics" style="--metric-count:${item.metrics.length}">${item.metrics.map(([value,label])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><p class="article-campaign-note">${escapeHtml(item.metricNote)}</p><div class="article-campaign-links">${item.links.map(([label,url])=>`<a class="button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div>`;
}

function renderGallery(project,layout){
 const posterCount=layout.gallery.filter(item=>item.category==='posters').length;
 const videoCount=layout.gallery.filter(item=>item.kind==='video').length;
 const playableCount=layout.gallery.filter(item=>item.kind==='video'&&item.src).length;
 const selected=videoCount?'videos':posterCount?'posters':'all';
 const filters=[['all','全部'],...(posterCount?[['posters','招生海报']]:[]),...(videoCount?[['videos','视频作品']]:[]),['content','图文内容'],['events','线下活动']];
 const topics=['升学政策','学习方法','校长口播','家庭教育','校区动态'];
 const videoTopics=videoCount?`<div class="video-topic-controls" role="group" aria-label="筛选视频主题"${selected!=='videos'?' hidden':''}><span class="video-topic-label">视频分类</span>${[['all','全部视频'],...topics.map(topic=>[topic,topic])].map(([value,label])=>{const count=layout.gallery.filter(item=>item.kind==='video'&&(value==='all'||item.subtitle===value)).length;return `<button type="button" data-video-topic="${value}" aria-pressed="${value==='all'}">${label}<span>${count}</span></button>`;}).join('')}</div>`:'';
 const cards=layout.gallery.map(item=>{
  const media=item.kind==='article-campaign'?renderArticleCampaign(item):item.kind==='video'?renderVideoMedia(item):item.image?`<button type="button" class="gallery-artwork" data-artwork-src="${escapeHtml(item.image)}" data-artwork-title="${escapeHtml(item.title)}" data-artwork-alt="${escapeHtml(item.alt)}" aria-haspopup="dialog" aria-controls="artwork-dialog" aria-label="放大查看${escapeHtml(item.title)}"><span class="gallery-artwork-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async"></span><span class="gallery-artwork-label">查看完整海报</span></button>`:`<div class="gallery-slot-art">${practiceIcon(item.icon)}<span>展示位 · 素材待补充</span><div class="placeholder-lines" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
  return `<section class="gallery-slot${item.kind==='article-campaign'?' gallery-slot-campaign':''}${item.image?' gallery-slot-work':''}${item.kind==='video'?' gallery-slot-video':''}" data-gallery-category="${item.category}"${item.kind==='video'?` data-video-category="${escapeHtml(item.subtitle)}"`:''}${selected!=='all'&&item.category!==selected?' hidden':''}>${media}${item.kind==='article-campaign'?'':`<div class="gallery-slot-caption"><h5>${escapeHtml(item.title)}</h5><p>${escapeHtml(item.subtitle)}</p><span>${escapeHtml(item.status)}</span></div>`}</section>`;
 }).join('');
 const intro=videoCount?`已整理 ${videoCount} 个视频条目，${playableCount===videoCount?'均可播放':`其中 ${playableCount} 条可播放、${videoCount-playableCount} 条原片待接入`}；另有 ${posterCount} 张招生海报。`:posterCount?`已收录 ${posterCount} 张招生海报。点击查看完整海报，其他作品持续补充。`:'内容策划、拍摄剪辑与活动落地。真实作品将在这里补充展示。';
 return `<article class="practice-view practice-gallery">${practiceHeader(project,'作品画廊')}<p class="practice-view-intro">${intro}</p><div class="gallery-controls" role="group" aria-label="筛选作品类型">${filters.map(([value,label])=>`<button type="button" data-gallery-filter="${value}" aria-pressed="${value===selected}">${label}</button>`).join('')}</div>${videoTopics}<div class="practice-gallery-grid">${cards}</div><p class="practice-aside">新媒体内容获取的有效线索，由招生团队承接与跟进成交。作品在此展示，不单独归因整体获客与成交数据。</p>${practiceRecord(project)}</article>`;
}

function renderSplitPractice(project,item,index){
 const uid=`practice-${index}`;
 const background=project.blocks.filter(([label])=>['问题','判断'].includes(label));
 const results=project.blocks.filter(([label])=>label==='结果');
 return `<article class="practice-view practice-split">${practiceHeader(project,'过程与成果')}<div class="practice-split-grid"><div><div class="practice-tabs" role="tablist" aria-label="${escapeHtml(project.title)}内容"><button type="button" id="${uid}-background-tab" role="tab" aria-selected="false" aria-controls="${uid}-background" tabindex="-1">工作背景</button><button type="button" id="${uid}-actions-tab" role="tab" aria-selected="true" aria-controls="${uid}-actions" tabindex="0">我的行动</button><button type="button" id="${uid}-results-tab" role="tab" aria-selected="false" aria-controls="${uid}-results" tabindex="-1">结果复盘</button></div><section id="${uid}-background" class="practice-tab-panel" role="tabpanel" aria-labelledby="${uid}-background-tab" tabindex="0" hidden>${background.map(([label,body])=>`<h5>${escapeHtml(label)}</h5><p>${highlightText(body)}</p>`).join('')}</section><section id="${uid}-actions" class="practice-tab-panel" role="tabpanel" aria-labelledby="${uid}-actions-tab" tabindex="0"><ol class="practice-action-list">${item.duties.map(([title,body])=>`<li><h5>${escapeHtml(title)}</h5><p>${highlightText(body)}</p></li>`).join('')}</ol></section><section id="${uid}-results" class="practice-tab-panel" role="tabpanel" aria-labelledby="${uid}-results-tab" tabindex="0" hidden>${results.map(([label,body])=>`<h5>${escapeHtml(label)}</h5><p>${highlightText(body)}</p>`).join('')}<h5>能力积累</h5><p>${highlightText(item.growth)}</p></section></div><aside class="practice-evidence"><h5>相关成果</h5><dl>${item.metrics.slice(0,3).map(([value,label])=>`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><p>该阶段多项运营工作的结果；统计周期、口径及个人贡献边界待补充。</p></aside></div>${practiceRecord(project)}</article>`;
}

function renderPractices(item,projects){
 const layout=item.practiceLayout;
 return projects.map((project,index)=>{
  if(layout.type==='gallery')return renderGallery(project,layout);
  if(layout.type==='split' && index===0)return renderSplitPractice(project,item,index);
  if(layout.type==='storyboard' && layout.flows[index])return renderStoryboard(project,layout.flows[index],index===0?layout.aside:'');
  // 辅助实践仍可展开完整阅读，不合并不同项目的成果。
  return `<article class="practice-view">${practiceHeader(project,'相关实践')}${practiceRecord(project)}</article>`;
 }).join('');
}

function activatePracticeTab(tab){
 const group=tab.closest('[role="tablist"]');
 group.querySelectorAll('[role="tab"]').forEach(button=>{
  const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  document.getElementById(button.getAttribute('aria-controls')).hidden=!active;
 });
}

function setupPracticeInteractions(container){
 container.querySelectorAll('[data-video-src]').forEach(button=>button.addEventListener('click',()=>openVideoViewer({src:button.dataset.videoSrc,poster:button.dataset.videoPoster,title:button.dataset.videoTitle})));
 container.querySelectorAll('[data-artwork-src]').forEach(button=>button.addEventListener('click',()=>{
  const artworks=Array.from(button.closest('.practice-gallery').querySelectorAll('[data-artwork-src]')).map(control=>({src:control.dataset.artworkSrc,title:control.dataset.artworkTitle,alt:control.dataset.artworkAlt}));
  openArtworkViewer(artworks,Array.from(button.closest('.practice-gallery').querySelectorAll('[data-artwork-src]')).indexOf(button));
 }));
 container.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{
  const gallery=button.closest('.practice-gallery');
  gallery.querySelectorAll('[data-gallery-filter]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  const topics=gallery.querySelector('.video-topic-controls');
  if(topics){
   topics.hidden=button.dataset.galleryFilter!=='videos';
   topics.querySelectorAll('[data-video-topic]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.videoTopic==='all')));
  }
  gallery.querySelectorAll('[data-gallery-category]').forEach(card=>card.hidden=button.dataset.galleryFilter!=='all'&&card.dataset.galleryCategory!==button.dataset.galleryFilter);
 }));
 container.querySelectorAll('[data-video-topic]').forEach(button=>button.addEventListener('click',()=>{
  const gallery=button.closest('.practice-gallery');
  gallery.querySelectorAll('[data-video-topic]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  gallery.querySelectorAll('[data-gallery-category]').forEach(card=>card.hidden=card.dataset.galleryCategory!=='videos'||(button.dataset.videoTopic!=='all'&&card.dataset.videoCategory!==button.dataset.videoTopic));
 }));
 container.querySelectorAll('.practice-tabs [role="tab"]').forEach(tab=>{
  tab.addEventListener('click',()=>activatePracticeTab(tab));
  tab.addEventListener('keydown',event=>{
   const tabs=Array.from(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
   let index=tabs.indexOf(tab);
   if(event.key==='ArrowRight')index=(index+1)%tabs.length;
   else if(event.key==='ArrowLeft')index=(index-1+tabs.length)%tabs.length;
   else if(event.key==='Home')index=0;
   else if(event.key==='End')index=tabs.length-1;
   else return;
   event.preventDefault();activatePracticeTab(tabs[index]);tabs[index].focus();
  });
 });
}
