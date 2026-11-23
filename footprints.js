// 足迹只依据已提供的行程统计；行政区点亮不代表探索面积或轨迹覆盖率。
const Footprints=(()=>{
 const esc=value=>escapeHtml(value);
 function filterTrips(trips,year){return year==='all'?trips:trips.filter(trip=>trip.startDate?.slice(0,4)===year);}
 function summarize(trips){
  const placeMap=new Map(),cityMap=new Map(),countryMap=new Map();
  for(const trip of [...trips].sort((a,b)=>(a.startDate||'').localeCompare(b.startDate||''))){
   for(const place of trip.places?.length?trip.places:[{title:trip.title,position:trip.position}]){
    const key=[place.country,place.title,...(place.position||[])].join('|');
    if(!placeMap.has(key))placeMap.set(key,{...place,firstDate:trip.startDate,tripId:trip.id});
    if(place.cityCode){
     if(!cityMap.has(place.cityCode))cityMap.set(place.cityCode,{code:place.cityCode,name:place.city,province:place.province,country:place.country,firstDate:trip.startDate,tripId:trip.id,places:new Set(),trips:new Set()});
     const city=cityMap.get(place.cityCode);city.places.add(place.title);city.trips.add(trip.id);
    }
    if(place.country){
     if(!countryMap.has(place.country))countryMap.set(place.country,{name:place.country,continent:place.continent,firstDate:trip.startDate,tripId:trip.id,cities:new Set()});
     if(place.cityCode)countryMap.get(place.country).cities.add(place.cityCode);
    }
   }
  }
  const cities=[...cityMap.values()].sort((a,b)=>(b.firstDate||'').localeCompare(a.firstDate||''));
  return {trips,corners:[...placeMap.values()].filter(place=>place.localityName),places:[...placeMap.values()],cities,countries:[...countryMap.values()],provinces:new Set(cities.map(x=>x.province)).size,continents:new Set([...countryMap.values()].map(x=>x.continent).filter(Boolean)).size};
 }
 function controls(allTrips,year,view){
  const data=summarize(filterTrips(allTrips,year)),years=[...new Set(allTrips.map(x=>x.startDate?.slice(0,4)).filter(Boolean))].sort().reverse();
  const tabs=[['records','点亮记录',data.trips.length,'段旅程','↗'],['countries','世界',data.countries.length,'个国家/地区','◎'],['cities','城市',data.cities.length,'个旅行城市','▥'],['places','地点',data.places.length,'个记录地点','⚑'],['corners','角落',data.corners.length,'个已记录县镇','⌑'],['tracks','轨迹','待导入','真实行走路线','∿']];
  return `<section class="footprint-overview" aria-labelledby="footprint-title"><div class="footprint-heading"><div><span class="eyebrow">MY FOOTPRINTS / 慢慢点亮世界</span><h4 id="footprint-title">走过的地方，都有迹可循。</h4></div><label class="footprint-year">记录年份<select data-footprint-year aria-label="筛选足迹年份"><option value="all"${year==='all'?' selected':''}>全部年份</option>${years.map(value=>`<option value="${value}"${year===value?' selected':''}>${value} 年</option>`).join('')}</select></label></div><div class="footprint-stat-tabs" role="group" aria-label="足迹分类">${tabs.map(([key,label,value,unit,icon])=>`<button data-footprint-view="${key}" aria-pressed="${view===key}"><span class="footprint-stat-name"><i aria-hidden="true">${icon}</i>${label}</span><strong${typeof value==='string'?' class="stat-pending"':''}>${value}</strong><small>${unit}</small></button>`).join('')}</div><p class="footprint-scope">仅统计已整理的旅行记录。县镇归并至所属地级行政区（含自治州、直辖市）；行政区点亮不代表全域探索；日期按相关行程的出发日展示。</p></section>`;
 }
 function recordButton(trip,latest){
  return `<button class="footprint-record" data-footprint-trip="${esc(trip.id)}">${latest?'<span class="footprint-latest">最近记录</span>':''}<strong>${esc(trip.title)}</strong><span>${esc(trip.dateLabel||'示例记录')}</span><small>${(trip.places||[]).map(x=>esc(x.title)).join(' · ')}</small><span class="footprint-record-arrow" aria-hidden="true">↗</span></button>`;
 }
 function timeline(trips){
  if(!trips.length)return lifeEmpty('这个年份，还没有旅行记录','选择其他年份，继续翻看已整理的旅程。');
  const groups=new Map();for(const trip of trips){const key=trip.startDate?.slice(0,7)||'sample';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(trip);}
  return `<div class="footprint-timeline">${[...groups].sort(([a],[b])=>b.localeCompare(a)).map(([month,items])=>`<section class="footprint-month"><h5>${month==='sample'?'交互示例':`${month.slice(0,4)} 年 ${Number(month.slice(5))} 月`}</h5>${items.map(trip=>recordButton(trip,trip.id===trips[0]?.id)).join('')}</section>`).join('')}</div>`;
 }
 function panel(trips,view){
  const data=summarize(trips);let content,title;
  if(view==='records'){title='点亮记录';content=timeline(trips);}
  if(view==='countries'){
   title='世界 · 已记录的足迹';content=`<p class="footprint-summary">${data.continents} 个大洲 · ${data.countries.length} 个国家/地区</p><div class="country-passports">${data.countries.map(country=>`<button class="country-passport" data-footprint-trip="${esc(country.tripId)}"><span class="country-passport-art"><span aria-hidden="true">◎</span><strong>${esc(country.name)}</strong><small>${esc(country.continent||'')}</small></span><span class="country-passport-text"><strong>${esc(country.name)}</strong><span>已记录 ${country.cities.size} 个旅行城市</span><small>最早行程 ${esc(country.firstDate||'待补充')}</small><em>打开相关旅程 ↗</em></span></button>`).join('')}</div>${!data.countries.length?lifeEmpty('国家资料待补充','示例未填入国家信息，不计入真实足迹。'):''}`;
  }
  if(view==='cities'){
   title='城市足迹';content=`<p class="footprint-summary">${data.cities.length} 个旅行城市 · ${data.provinces} 个省级行政区</p><div class="footprint-city-grid">${data.cities.map(city=>`<button class="footprint-city" data-footprint-trip="${esc(city.tripId)}"><span class="footprint-city-art"><img src="assets/life/cities/${city.code}.svg" alt="${esc(city.name)}行政区轮廓" loading="lazy"><em>已记录</em></span><strong>${esc(city.name)}</strong><small>${esc(city.province||'')} · ${city.places.size} 个地点</small><span>最早行程 ${esc(city.firstDate||'待补充')}</span><span class="city-open">查看旅程 ↗</span></button>`).join('')}</div>${!data.cities.length?lifeEmpty('城市资料待补充','示例未设置行政归属，不计入真实城市足迹。'):''}`;
  }
  if(view==='places'){
   title='地点清单';content=`<p class="footprint-summary">${data.places.length} 个已记录地点，按最早记录日期由近及远排列。</p><div class="footprint-place-list">${data.places.sort((a,b)=>(b.firstDate||'').localeCompare(a.firstDate||'')).map(place=>`<button data-footprint-trip="${esc(place.tripId)}"><span><strong>${esc(place.title)}</strong><small>${esc(place.city||'示例地点')} · ${esc(place.firstDate||'待补充')}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div>`;
  }
  if(view==='corners'){
   title='探索的角落';content=`<p class="footprint-summary">目前展示已明确提供的 ${data.corners.length} 个县镇，不代表完整街道探索；面积与探索比例尚无数据。</p><div class="footprint-place-list">${data.corners.map(place=>`<button data-footprint-trip="${esc(place.tripId)}"><span><strong>${esc(place.localityName)} <em>${esc(place.localityType)}</em></strong><small>${esc(place.city)} · ${esc(place.firstDate||'待补充')}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div>${!data.corners.length?lifeEmpty('更多角落，慢慢补齐','补充明确的区县、乡镇、街道或景点后，继续点亮城市中的小地方。'):''}`;
  }
  if(view==='tracks'){
   title='旅途轨迹';content=lifeEmpty('等一条真实走过的路线','后续可补充 GPX / KML 或含时间、经纬度的轨迹记录，再展示路线和距离。现阶段不把城市间直线当作实际行走里程。');
  }
  return `<section class="footprint-panel" aria-labelledby="footprint-panel-title"><div class="footprint-panel-heading"><h4 id="footprint-panel-title" tabindex="-1">${title}</h4><button type="button" data-footprint-top>返回足迹分类 ↑</button></div>${content}</section>`;
 }
 function cityCodes(trips){return summarize(trips).cities.map(city=>city.code);}
 return {filterTrips,summarize,controls,panel,cityCodes};
})();
