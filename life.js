// 仅填入用户已确认的生活记录；示例在访客主动开启后展示。
const lifeContent={trips:[{"id": "jiaxing-wuzhen-202610", "title": "浙江嘉兴市区 · 乌镇", "startDate": "2026-10-26", "endDate": "2026-10-27", "dateLabel": "2026 年 10 月 26–27 日", "places": [{"title": "浙江 · 嘉兴市区", "position": [120.755623, 30.746814]}, {"title": "浙江 · 乌镇", "position": [120.499424, 30.739533]}], "position": [120.755623, 30.746814], "photos": [], "guide": "", "intro": "浙江嘉兴市区、乌镇的旅行记录。"}, {"id": "xuancheng-jing-202610", "title": "安徽宣城 · 泾县", "startDate": "2026-10-11", "endDate": "2026-10-13", "dateLabel": "2026 年 10 月 11–13 日", "position": [118.419552, 30.688793], "places": [{"title": "安徽 · 宣城", "position": [118.759127, 30.939278]}, {"title": "安徽 · 泾县", "position": [118.419552, 30.688793]}], "photos": [], "intro": "安徽宣城、泾县的旅行记录。", "guide": ""}, {"id": "shaoxing-202609", "title": "浙江绍兴", "startDate": "2026-09-07", "endDate": "2026-09-08", "dateLabel": "2026 年 9 月 7–8 日", "places": [{"title": "浙江 · 绍兴", "position": [120.582886, 30.051549]}], "position": [120.582886, 30.051549], "photos": [], "guide": "", "intro": "浙江绍兴的旅行记录。"}, {"id": "yunnan-202607", "title": "云南昆明 · 大理 · 丽江", "startDate": "2026-07-29", "endDate": "2026-08-05", "dateLabel": "2026 年 7 月 29 日—8 月 5 日", "places": [{"title": "云南 · 昆明", "position": [102.833669, 24.88149]}, {"title": "云南 · 大理", "position": [100.301614, 25.678466]}, {"title": "云南 · 丽江", "position": [100.225936, 26.855165]}], "position": [102.833669, 24.88149], "photos": [], "guide": "", "intro": "云南昆明、大理、丽江的旅行记录。"}, {"id": "guilin-yangshuo-202605", "title": "广西桂林 · 阳朔", "startDate": "2026-05-07", "endDate": "2026-05-10", "dateLabel": "2026 年 5 月 7–10 日", "places": [{"title": "广西 · 桂林", "position": [110.179752, 25.235615]}, {"title": "广西 · 阳朔", "position": [110.496305, 24.778785]}], "position": [110.179752, 25.235615], "photos": [], "guide": "", "intro": "广西桂林、阳朔的旅行记录。"}, {"id": "yixing-202605", "title": "江苏无锡 · 宜兴", "startDate": "2026-05-01", "endDate": "2026-05-03", "dateLabel": "2026 年 5 月 1–3 日", "places": [{"title": "江苏 · 宜兴", "position": [119.821873, 31.338429]}], "position": [119.821873, 31.338429], "photos": [], "guide": "", "intro": "江苏无锡、宜兴的旅行记录。"}, {"id": "suzhou-202604", "title": "江苏苏州", "startDate": "2026-04-28", "endDate": "2026-04-30", "dateLabel": "2026 年 4 月 28–30 日", "places": [{"title": "江苏 · 苏州", "position": [120.585294, 31.299758]}], "position": [120.585294, 31.299758], "photos": [], "guide": "", "intro": "江苏苏州的旅行记录。"}, {"id": "shanghai-202604", "title": "上海", "startDate": "2026-04-25", "endDate": "2026-04-27", "dateLabel": "2026 年 4 月 25–27 日", "places": [{"title": "上海", "position": [121.473667, 31.230525]}], "position": [121.473667, 31.230525], "photos": [], "guide": "", "intro": "上海的旅行记录。"}],books:[],podcasts:[]};
const lifeExamples={
 trips:[{id:'a',title:'旅程 A · 示例',x:50,y:32,position:[116.397,39.909],image:'assets/mountain.jpg',intro:'这里将放一段旅程的故事。',guide:'路线安排、交通方式、落脚点，以及途中值得记下的小事。'},{id:'b',title:'旅程 B · 示例',x:76,y:44,position:[121.474,31.23],image:'assets/sea.jpg',intro:'把值得回看的风景留在这里。',guide:'这里可以整理目的地攻略、行程与个人建议。'},{id:'c',title:'旅程 C · 示例',x:24,y:42,position:[104.066,30.572],image:'assets/light.jpg',intro:'慢一点，看看沿途。',guide:'这里可以补充散步路线、拍照位置与旅途提醒。'}],
 books:[{id:'a',title:'书籍 A',status:'read',tone:'cream'},{id:'b',title:'书籍 B',status:'reading',tone:'sage'},{id:'c',title:'书籍 C',status:'wish',tone:'clay'},{id:'d',title:'书籍 D',status:'read',tone:'blue'},{id:'e',title:'书籍 E',status:'reading',tone:'cream'},{id:'f',title:'书籍 F',status:'read',tone:'sage'}],
 podcasts:[{id:'a',title:'播客 A',topic:'生活观察',description:'那些关于生活的具体问题。',tone:'sage'},{id:'b',title:'播客 B',topic:'人物对谈',description:'听见不同的经历与选择。',tone:'cream'},{id:'c',title:'播客 C',topic:'知识与好奇',description:'留一点时间，给新的想法。',tone:'blue'}]
};
const lifeDialog=document.querySelector('#life-dialog'),lifeView=document.querySelector('#life-view');
let travelProvider=(travelMapConfig.serviceHost||travelMapConfig.securityJsCode)?'amap':'world';
let lifeSpace='travel',lifeDemo=false,lifeSelection='',lifeFilter='all',lifeTripTab='guide',lifePodcastTab='shows',lifeZoom=1;
const lifeEscape=escapeHtml;
function lifeItems(key){return lifeDemo?lifeExamples[key]:lifeContent[key];}
function lifeEmpty(title,body){return `<div class="life-empty"><span aria-hidden="true">✳</span><h3>${title}</h3><p>${body}</p></div>`;}
function lifeNotice(){
 const message=lifeDemo?'正在体验示例 · 地点、书目、节目与图片均为占位，不是个人真实记录。':lifeSpace==='travel'&&lifeContent.trips.length?`已记录 ${lifeContent.trips.length} 段真实旅程，照片与攻略陆续补充。`:'阅读与播客记录正在整理，可先体验样例。';
 return `<div class="life-demo-bar"><p>${message}</p><button type="button" data-life-demo aria-pressed="${lifeDemo}">${lifeDemo?'退出样例':'体验样例'} <span aria-hidden="true">↗</span></button></div>`;
}
function worldTripPoint(item){
 if(item.position&&!lifeDemo)return {x:(item.position[0]+180)/3.6,y:(90-item.position[1])/1.65};
 return {x:item.x,y:item.y};
}
function renderTripDetail(selected){
 if(!selected)return lifeEmpty(lifeItems('trips').length?'选择一段旅程':'地图，等你点亮','点击地图标记查看攻略和照片；也可以先开启上方的体验样例。');
 const photos=lifeDemo?[{src:selected.image,alt:'旅行风格示意图，非本人作品'}]:(selected.photos||[]);
 const cover=photos[0]?`<img class="trip-cover" src="${lifeEscape(photos[0].src)}" alt="${lifeEscape(photos[0].alt||selected.title)}">`:`<div class="trip-cover-empty"><span aria-hidden="true">⌑</span><span>旅途照片，稍后见</span></div>`;
 const photoContent=photos.length?photos.map(photo=>`<button class="trip-photo-button" data-life-photo="${lifeEscape(photo.src)}" data-life-photo-title="${lifeEscape(selected.title)}" data-life-photo-alt="${lifeEscape(photo.alt||selected.title)}" aria-label="放大${lifeDemo?'示意照片':'旅行照片'}"><img src="${lifeEscape(photo.src)}" alt="${lifeEscape(photo.alt||selected.title)}"><span>放大照片 ↗</span></button>`).join(''):lifeEmpty('照片待上传','这段旅程的照片，正在整理中。');
 return `${cover}<div class="trip-detail-body"><span class="life-sample-label">${lifeDemo?'交互示例':'旅行记录'}</span><h4>${lifeEscape(selected.title)}</h4>${selected.dateLabel?`<p class="trip-date"><time datetime="${lifeEscape(selected.startDate)}">${lifeEscape(selected.dateLabel)}</time></p>`:''}<p>${lifeEscape(selected.intro||'')}</p><div class="life-small-tabs" role="group" aria-label="旅行记录内容"><button data-life-trip-tab="guide" aria-pressed="${lifeTripTab==='guide'}">攻略</button><button data-life-trip-tab="photos" aria-pressed="${lifeTripTab==='photos'}">照片${photos.length&&!lifeDemo?' · '+photos.length:''}</button></div>${lifeTripTab==='guide'?(selected.guide?`<p class="trip-guide">${lifeEscape(selected.guide)}</p>`:lifeEmpty('攻略与感受待补充','路线、途中见闻与感受，稍后慢慢写。')):photoContent}</div>`;
}
function renderTravelMap(items){
 const controls=`<div class="life-small-tabs map-provider" role="group" aria-label="选择地图"><button data-travel-provider="amap" aria-pressed="${travelProvider==='amap'}">国内 · 高德地图</button><button data-travel-provider="world" aria-pressed="${travelProvider==='world'}">世界地图</button></div>`;
 const map=travelProvider==='amap'?`<div class="amap-map-host" id="amap-travel-map" role="region" aria-label="可拖动和缩放的高德旅行地图"></div><p class="amap-map-status" data-amap-status role="status">正在打开高德地图…</p>`:`<div class="travel-map-window"><div class="travel-map-canvas" style="transform:scale(${lifeZoom})"><img src="assets/life/world-map.svg" alt="世界地图与旅行足迹">${items.map(x=>`<button class="travel-pin${x.id===lifeSelection?' selected':''}" data-life-trip="${lifeEscape(x.id)}" style="left:${worldTripPoint(x).x}%;top:${worldTripPoint(x).y}%" aria-pressed="${x.id===lifeSelection}" aria-label="查看${lifeEscape(x.title)}"><i></i><span>${lifeEscape(x.title)}</span></button>`).join('')}</div></div>`;
 return `<div class="travel-map-area">${controls}<div class="travel-map-label"><span>我的旅行地图</span><span>${lifeDemo?'示例地点，非本人行程':`${items.reduce((n,item)=>n+(item.places?.length||1),0)} 个地点 · ${items.length} 段旅程`}</span></div>${map}<div class="travel-map-footer"><span>${travelProvider==='amap'?'拖动地图，点击标记查看旅程':'点击亮点，打开一段旅程'}</span><div class="map-zoom" role="group" aria-label="地图缩放"><button data-life-zoom="out" aria-label="缩小地图" ${travelProvider==='world'&&lifeZoom===1?'disabled':''}>−</button><button data-life-zoom="reset" aria-label="重置地图缩放">复位</button><button data-life-zoom="in" aria-label="放大地图" ${travelProvider==='world'&&lifeZoom>=1.6?'disabled':''}>＋</button></div></div>${travelProvider==='world'?'<p class="map-credit">地图：Natural Earth / world-atlas</p>':''}</div>`;
}
function updateTravelDetail(){
 const template=document.createElement('template');template.innerHTML=renderTravel();
 lifeView.querySelector('.trip-detail').replaceWith(template.content.querySelector('.trip-detail'));
 lifeView.querySelectorAll('.trip-record-link').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lifeRecord===lifeSelection)));
 lifeView.querySelectorAll('.amap-trip-pin,.travel-pin').forEach(button=>{const active=(button.dataset.tripId||button.dataset.lifeTrip)===lifeSelection;button.setAttribute('aria-pressed',String(active));button.classList.toggle('selected',active);});
}
function renderTripIndex(items){
 return `<section class="travel-index" aria-label="旅行索引"><h4>旅行索引 <span>${items.length} 段${lifeDemo?'示例':''}旅程</span></h4><div class="travel-index-list">${items.map(trip=>`<button class="trip-record-link" data-life-record="${lifeEscape(trip.id)}" aria-pressed="${trip.id===lifeSelection}"><span>${lifeEscape(trip.title)}</span><small>${lifeEscape(trip.dateLabel||'交互示例')}</small></button>`).join('')}</div></section>`;
}
function renderTravel(){
 const items=lifeItems('trips'),selected=items.find(x=>x.id===lifeSelection);
 return `<div class="life-view-title"><span class="eyebrow">01 / TRAVEL</span><h3>推开门，去远一点的地方。</h3><p>把走过的路，慢慢收进地图。</p></div><div class="travel-layout">${renderTravelMap(items)}<div class="travel-record-column">${renderTripIndex(items)}<aside class="trip-detail" aria-label="旅行详情">${renderTripDetail(selected)}</aside></div></div>`;
}
const bookStates={read:'读过',reading:'在读',wish:'想读'};
function renderReading(){
 const items=lifeItems('books'),visible=items.filter(x=>lifeFilter==='all'||x.status===lifeFilter),selected=items.find(x=>x.id===lifeSelection);
 return `<div class="life-view-title"><span class="eyebrow">02 / READING</span><h3>在文字里，慢慢长出自己。</h3><p>读过的、在读的，还有想读的。</p></div><div class="reading-layout"><div><div class="life-small-tabs" role="group" aria-label="阅读状态筛选">${[['all','全部'],['reading','在读'],['read','读过'],['wish','想读']].map(([key,label])=>`<button data-life-book-filter="${key}" aria-pressed="${lifeFilter===key}">${label}</button>`).join('')}</div><div class="reading-shelf">${visible.length?visible.map(x=>`<button class="shelf-book ${lifeEscape(x.tone)}${x.id===lifeSelection?' selected':''}" data-life-book="${lifeEscape(x.id)}" aria-pressed="${x.id===lifeSelection}"><span class="shelf-book-front"><strong>${lifeEscape(x.title)}</strong><span class="book-motif" aria-hidden="true">✳</span><small>${lifeDemo?'示例书目':'阅读记录'}</small></span><span class="book-state">${bookStates[x.status]}</span></button>`).join(''):lifeEmpty('书架，留给下一本书','书目尚待整理。开启体验样例，可查看筛选和阅读笔记的呈现方式。')}</div></div><aside class="book-detail">${selected?`<span class="eyebrow">READING NOTES / 阅读笔记</span><h4>${lifeEscape(selected.title)}</h4><span class="life-sample-label">${bookStates[selected.status]} · 示例书目</span><section><h5>为什么打开这本书</h5><p>记录一个想弄明白的问题。</p></section><section><h5>留下的一点思考</h5><p>这里将放读书笔记、摘录和自己的想法。当前为交互样例，尚未填入个人阅读记录。</p></section>`:lifeEmpty('翻开一本书','点击书封，看看它留下了什么。')}</aside></div>`;
}
function renderPodcast(){
 const items=lifeItems('podcasts'),selected=items.find(x=>x.id===lifeSelection);
 return `<div class="life-view-title"><span class="eyebrow">03 / PODCAST</span><h3>让耳朵，带我去别人的世界。</h3><p>通勤、散步，或是不着急的片刻。</p></div><div class="podcast-layout"><div class="podcast-collection"><div class="life-small-tabs" role="group" aria-label="播客收藏内容"><button data-life-podcast-tab="shows" aria-pressed="${lifePodcastTab==='shows'}">关注的节目</button><button data-life-podcast-tab="episodes" aria-pressed="${lifePodcastTab==='episodes'}">推荐单集</button></div>${items.length?`<div class="podcast-list">${items.map(x=>`<button class="podcast-item${x.id===lifeSelection?' selected':''}" data-life-podcast="${lifeEscape(x.id)}" aria-pressed="${x.id===lifeSelection}"><span class="podcast-cover ${lifeEscape(x.tone)}" aria-hidden="true">${lifePodcastTab==='shows'?'◎':'≋'}</span><span><strong>${lifePodcastTab==='shows'?lifeEscape(x.title):`${lifeEscape(x.title)} · 单集示例`}</strong><small>${lifeEscape(x.description)}</small><em>${lifeEscape(x.topic)} · 示意</em></span><span aria-hidden="true">↗</span></button>`).join('')}</div>`:lifeEmpty('收藏，还在慢慢整理','未来放关注的节目、推荐单集与听后感。可以先开启体验样例。')}</div><aside class="podcast-detail">${selected?`<div class="podcast-detail-art ${lifeEscape(selected.tone)}" aria-hidden="true">◎</div><span class="life-sample-label">${lifePodcastTab==='shows'?'节目':'单集'}示例</span><h4>${lifeEscape(selected.title)}</h4><h5>为什么想分享给你</h5><p>${lifeEscape(selected.description)}这里将补充推荐理由与听后感。</p><p class="life-pending-link">真实节目与原平台收听链接待补充</p>`:lifeEmpty('听一段不同的生活','选择一个节目，看看推荐理由。这里不会自动播放声音。')}</aside></div>`;
}
function renderLife(){
 AmapTravel.destroy();
 lifeDialog.querySelectorAll('[data-life-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lifeTab===lifeSpace)));
 lifeView.innerHTML=lifeNotice()+({travel:renderTravel,reading:renderReading,podcast:renderPodcast}[lifeSpace])();
 if(lifeSpace==='travel'&&travelProvider==='amap'){AmapTravel.mount(lifeView.querySelector('#amap-travel-map'),lifeItems('trips'),id=>{lifeSelection=id;updateTravelDetail();});}
}
function selectLife(space){lifeSpace=space;lifeSelection=space==='travel'&&!lifeDemo?(lifeContent.trips[0]?.id||''):'';lifeFilter='all';lifeTripTab='guide';lifePodcastTab='shows';lifeZoom=1;renderLife();}
document.querySelectorAll('[data-life-open]').forEach(b=>b.addEventListener('click',()=>{lifeDemo=false;selectLife(b.dataset.lifeOpen);lifeDialog.showModal();lifeDialog.scrollTop=0;document.body.classList.add('modal-open');}));
lifeDialog.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.lifeRecord){lifeSelection=b.dataset.lifeRecord;updateTravelDetail();if(travelProvider==='amap')AmapTravel.focusTrip(lifeSelection);return;}
 if(b.dataset.travelProvider){travelProvider=b.dataset.travelProvider;renderLife();return;}
 if(b.dataset.lifeTrip){lifeSelection=b.dataset.lifeTrip;updateTravelDetail();return;}
 if(b.dataset.lifeTripTab){lifeTripTab=b.dataset.lifeTripTab;updateTravelDetail();return;}
 if(b.dataset.lifeZoom&&travelProvider==='amap'){AmapTravel.zoom(b.dataset.lifeZoom);return;}
 if(b.hasAttribute('data-life-tab')){selectLife(b.dataset.lifeTab);return;}
 if(b.hasAttribute('data-life-demo')){lifeDemo=!lifeDemo;lifeSelection=lifeSpace==='travel'&&!lifeDemo?(lifeContent.trips[0]?.id||''):'';renderLife();lifeView.querySelector('[data-life-demo]').focus({preventScroll:true});return;}
 const handlers=[['lifeTrip',v=>{lifeSelection=v;}],['lifeTripTab',v=>{lifeTripTab=v;}],['lifeBookFilter',v=>{lifeFilter=v;lifeSelection='';}],['lifeBook',v=>{lifeSelection=v;}],['lifePodcastTab',v=>{lifePodcastTab=v;lifeSelection='';}],['lifePodcast',v=>{lifeSelection=v;}],['lifeZoom',v=>{lifeZoom=v==='reset'?1:Math.max(1,Math.min(1.6,Math.round((lifeZoom+(v==='in'?.2:-.2))*10)/10));}]];
 for(const [key,handler] of handlers){if(b.dataset[key]!==undefined){const val=b.dataset[key];handler(val);renderLife();const attr='data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());const target=lifeView.querySelector(`[${attr}="${CSS.escape(val)}"]`);if(target&&!target.disabled)target.focus({preventScroll:true});return;}}
 if(b.dataset.lifePhoto){const photo=document.querySelector('#large-photo');photo.src=b.dataset.lifePhoto;photo.alt=b.dataset.lifePhotoAlt||'旅行照片';document.querySelector('#photo-caption').textContent=lifeDemo?'旅行相册 · 示意照片':b.dataset.lifePhotoTitle||'旅行相册';document.querySelector('#photo-dialog .small').textContent=lifeDemo?'摄影风格示意，非本人旅行作品。':'个人旅行照片';photoDialog.showModal();}
});

// 首页书封可独立操作；真实书目未填入时明确打开示例笔记。
document.querySelectorAll('[data-shelf-preview]').forEach(button=>button.addEventListener('click',()=>{
 lifeDemo=true;selectLife('reading');lifeSelection=button.dataset.shelfPreview;renderLife();
 lifeDialog.showModal();lifeDialog.scrollTop=0;document.body.classList.add('modal-open');
}));
const gramophoneToggle=document.querySelector('.gramophone-toggle');
const gramophoneCard=document.querySelector('.life-podcast');
gramophoneToggle.addEventListener('click',()=>{
 const turning=gramophoneToggle.getAttribute('aria-pressed')!=='true';
 gramophoneToggle.setAttribute('aria-pressed',String(turning));
 gramophoneToggle.setAttribute('aria-label',turning?'暂停唱片转动，仅视觉效果':'开始转动唱片，仅视觉效果');
 gramophoneCard.classList.toggle('is-turning',turning);
 gramophoneToggle.querySelector('[data-record-symbol]').textContent=turning?'Ⅱ':'▶';
 gramophoneToggle.querySelector('[data-record-label]').textContent=turning?'暂停转动':'转动唱片';
 gramophoneCard.querySelector('[data-record-status]').textContent=turning?'唱片转动中 · 仅视觉效果，无声音':'轻触留声机，让唱片转起来 · 无声音';
});
// 离开可见区域或切换标签页时暂停绘制，返回后恢复主动开启的状态。
if('IntersectionObserver' in window){new IntersectionObserver(entries=>{
 for(const entry of entries)entry.target.classList.toggle('motion-offscreen',!entry.isIntersecting);
}).observe(gramophoneCard);}
document.addEventListener('visibilitychange',()=>gramophoneCard.classList.toggle('motion-background',document.hidden));

lifeDialog.addEventListener('close',()=>AmapTravel.destroy());
