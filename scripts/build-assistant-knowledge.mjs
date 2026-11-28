import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync('content.js','utf8')+';globalThis.careers=experienceData',context);
for(const file of ['data/books.js','data/podcasts.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const html=fs.readFileSync('index.html','utf8');
const text=value=>value.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const edu=html.slice(html.indexOf('<div class="education-band"'),html.indexOf('</section>',html.indexOf('<div class="education-band"')));
const education=[...edu.matchAll(/<div class="education-entry">([\s\S]*?)<\/div>/g)].map(m=>text(m[1]));
const life=fs.readFileSync('life.js','utf8');const trips=JSON.parse(life.match(/trips:(\[[\s\S]*?\]),books:/)[1]);
const knowledge={
 profile:{name:'侯雪斌',nickname:'Bill',mbti:html.match(/data-mbti="([A-Z]{4})"/)?.[1]||'',location:text(html.match(/<dt>坐标<\/dt><dd>(.*?)<\/dd>/)[1]),bio:[text(html.match(/<div class="about-content">([\s\S]*?)<div class="tags">/)[1]),text(html.match(/<p class="about-aspiration">([\s\S]*?)<\/p>/)?.[1]||'')].filter(Boolean).join(' '),education,credentials:text(edu),contact:{phone:html.match(/href="tel:([^"]+)"/)[1],email:html.match(/href="mailto:([^"]+)"/)[1]}},
 careers:context.careers.map(x=>({name:x.fullName,role:x.role,period:x.period,scope:x.scope,tags:x.growthTags,cases:x.starCases,documents:x.documents.map(d=>({title:typeof d==='string'?d:d.title}))})),
 projects:[{title:'旅策 · 旅行规划助手',status:'准备中',description:'正在做的旅行规划助手，体验版仍在完善，暂未开放体验。',url:'#lab'},{title:'旅行研学手册生成器',status:'构思中',description:'计划输入目的地、旅行天数和研学目标，生成行程与学习任务的手册初稿，尚未提供示例与下载。'}],
 writing:[{title:'从“做完”到“做到位”',category:'个人成长',summary:'根据个人说明书中关于反馈与交付的自述整理。做完之后，给检查和打磨留一点时间。'}],
 travel:trips.map(x=>({title:x.title,dates:x.dateLabel})),
 books:(context.window.wereadBooks||[]).map(x=>({title:x.title,author:x.author})),
 podcasts:(context.window.xiaoyuzhouPodcasts?.shows||[]).map(x=>({title:x.title,author:x.author})),
 links:[{label:'工作经历',url:'#journey'},{label:'查看作品进度',url:'#lab'},{label:'工作之外',url:'#life'},{label:'教育与个人介绍',url:'#home'},{label:'联系 Bill',url:'#contact'}]
};
const revision=crypto.createHash('sha256').update(JSON.stringify(knowledge)).digest('hex').slice(0,12);
fs.writeFileSync('data/assistant-knowledge.json',JSON.stringify({revision,...knowledge},null,2)+'\n');
console.log(`Assistant knowledge ${revision}: ${knowledge.careers.length} careers, ${knowledge.travel.length} trips; public fields only.`);
