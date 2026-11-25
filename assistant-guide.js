(function(root){
 const source=(label,action)=>({label,action});
 function reply(question,k){
  const q=question.trim();
  const link=source('查看工作经历','anchor:journey');
  const company=k.careers.find(x=>q.includes(x.name)||q.includes(x.name.replace('上海','').replace('厦门','').replace('教育',''))||(['新东方','浪起','荣怀','洋葱','学家'].some(t=>q.includes(t)&&x.name.includes(t))));
  if(company){
   const c=company.cases.find(x=>q.includes('古埃及')&&x.title.includes('古埃及'))||company.cases[0];
   return {text:`${company.name}｜${company.role}\n${company.period}\n\n${company.scope}\n\n${c.results.map(x=>`${x[1]}：${x[0]}`).join('\n')}\n${c.resultText||''}`,sources:[source('打开这段工作记录',`career:${k.careers.indexOf(company)}`)]};
  }
  if(/最近|现在|目前|近况/.test(q)){
   const c=k.careers.at(-1);
   return {text:`目前在${c.name}做${c.role}（${c.period}），${c.scope}\n\n工作之外，他也在做「旅策」旅行规划助手，可以打开体验。`,sources:[source('查看最近的工作',`career:${k.careers.length-1}`),source('体验旅策','demo')]};
  }
  if(/学校|学历|专业|教育背景|大学|证书|荣誉/.test(q))return {text:/证书|荣誉/.test(q)?k.profile.credentials:k.profile.education.join('\n\n'),sources:[source('查看教育与荣誉','anchor:home')]};
  if(/联系|邮箱|电话|合作/.test(q))return {text:`可以直接联系 Bill：\n电话：${k.profile.contact.phone}\n邮箱：${k.profile.contact.email}\n\n具体合作、时间安排和意向，需要由本人确认。`,sources:[source('查看联系方式','anchor:contact')]};
  if(/技能|skill|研学手册/i.test(q))return {text:k.projects[1].title+'目前还在构思中。\n'+k.projects[1].description,sources:[source('查看 Skill 计划','library:skill')]};
  if(/旅策|coding|代码|工具/i.test(q))return {text:'旅策是 Bill 正在做的旅行规划助手，已经开放体验。功能仍在完善中。\n\n另一个想法是旅行研学手册生成器，目前还在构思阶段。',sources:[source('体验旅策','demo'),source('查看可体验作品','library:work')]};
  if(/项目|作品|做过|案例/.test(q))return {text:'可以从这几项了解他的工作：\n'+k.careers.map(x=>'· '+x.name+'：'+x.cases[0].title.split('｜').at(-1)).join('\n')+'\n\n网站还放了旅策的体验入口。',sources:[link,source('体验旅策','demo')]};
  if(/经历|工作|职业|运营/.test(q)&&!/工作之外/.test(q))return {text:'他的工作经历，从最近的一站说起：\n\n'+[...k.careers].reverse().map(x=>`${x.period}｜${x.name}\n${x.role}：${x.scope}`).join('\n\n'),sources:[link]};
  if(/阅读|书|读什么/.test(q))return {text:'微信读书书架里有这些书：\n'+k.books.slice(0,5).map(x=>'· '+x.title+(x.author?' / '+x.author:'')).join('\n')+'\n\n这是公开书架，不代表每本都已读完。',sources:[source('打开我的书架','life:reading')]};
  if(/播客|节目|小宇宙/.test(q))return {text:'目前公开收藏的播客包括：\n'+k.podcasts.slice(0,5).map(x=>'· '+x.title).join('\n'),sources:[source('打开播客收藏','life:podcast')]};
  if(/旅行|旅游|去过|兴趣|爱好|生活|工作之外/.test(q))return {text:'工作之外，网站里放了旅行、阅读和播客。旅行记录包括：\n'+k.travel.slice(0,6).map(x=>'· '+x.title+' / '+x.dates).join('\n')+'\n\n照片和感受还在陆续补充。',sources:[source('打开旅行任意门','life:travel'),source('查看工作之外','anchor:life')]};
  if(/认识|介绍|是谁|你好|一分钟|侯雪斌|bill/i.test(q))return {text:`${k.profile.name}，也可以叫他 ${k.profile.nickname}，目前在${k.profile.location}。\n\n做过电商私域、研学社群和课程转化，目前在荣怀学校负责视频号、公众号内容与校区活动执行。工作之外喜欢旅行、阅读和播客，也在做旅策旅行规划助手。`,sources:[link,source('看看工作之外','anchor:life')]};
  return {text:'网站里暂时没有这方面的信息。当前是内容导览模式，还没有接通 AI 自由问答。\n\n你可以问工作经历、代表项目、教育背景、旅行、阅读或联系方式。',sources:[link,source('联系本人','anchor:contact')]};
 }
 root.BillGuide={reply};
})(typeof window==='undefined'?globalThis:window);
