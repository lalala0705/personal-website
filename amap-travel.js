// 高德 JS API Key 属于浏览器端配置；不要在此填入 Web 服务 Key。
// 有代理服务时优先配置 serviceHost；它应在服务器端保管 securityJsCode。
const travelMapConfig={jsKey:'b3b3088a600d4820d8558f2af3e70192',serviceHost:'',securityJsCode:'6ca99b4f65ed3700032a968c693c8922'};
const AmapTravel=(()=>{
 let sdkPromise=null,map=null,currentHost=null,completeTimer=null,sequence=0,tripMarkers=new Map(),cityAreas=[],boundaryPromise=null,areaSequence=0,activeStatus=null,mapReady=false,parking=null;
 // 复用单个 SDK 实例，避免已销毁实例收到高德延迟 JSONP 回调。
 function destroy(){
  sequence++;areaSequence++;tripMarkers.clear();clearTimeout(completeTimer);activeStatus=null;cityAreas=[];
  if(map){map.clearMap();if(currentHost){if(!parking){parking=document.createElement('div');parking.hidden=true;parking.setAttribute('aria-hidden','true');document.body.appendChild(parking);}parking.appendChild(currentHost);}}
  currentHost=null;
 }
 function say(message){if(activeStatus?.isConnected)activeStatus.textContent=message;}
 function sdk(){
  if(window.AMap?.Map)return Promise.resolve(window.AMap);
  if(sdkPromise)return sdkPromise;
  if(!travelMapConfig.serviceHost&&!travelMapConfig.securityJsCode)return Promise.reject(new Error('地图配置尚未完成'));
  sdkPromise=new Promise((resolve,reject)=>{
   window._AMapSecurityConfig=travelMapConfig.serviceHost?{serviceHost:travelMapConfig.serviceHost}:{securityJsCode:travelMapConfig.securityJsCode};
   const script=document.createElement('script');const callback='__travelAmapReady';let timeout;
   function fail(){clearTimeout(timeout);script.remove();delete window[callback];sdkPromise=null;reject(new Error('地图暂时无法加载'));}
   window[callback]=()=>{clearTimeout(timeout);delete window[callback];window.AMap?.Map?resolve(window.AMap):fail();};
   script.onerror=fail;script.src=`https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(travelMapConfig.jsKey)}&callback=${callback}`;script.async=true;
   timeout=setTimeout(fail,15000);document.head.appendChild(script);
  });return sdkPromise;
 }
 async function mount(host,items,onSelect,options={}){
  destroy();const version=sequence;currentHost=host;activeStatus=host.parentElement.querySelector('[data-amap-status]');
  say('正在打开高德地图…');
  try{
   const AMap=await sdk();if(version!==sequence||!host.isConnected)return;
   if(map){const container=map.getContainer();host.replaceWith(container);currentHost=container;}
   else{
    map=new AMap.Map(host,{viewMode:'2D',zoom:4,center:[104.2,35.8],resizeEnable:true,dragEnable:true,scrollWheel:true,keyboardEnable:true,animateEnable:false,isHotspot:false});
    map.on('complete',()=>{mapReady=true;clearTimeout(completeTimer);say('拖动或缩放地图，点击已点亮地点查看旅行记录。');});
   }
   requestAnimationFrame(()=>{if(version===sequence&&currentHost?.isConnected){if(typeof map.resize==='function')map.resize();else window.dispatchEvent(new Event('resize'));}});
   if(mapReady)say('拖动或缩放地图，点击已点亮地点查看旅行记录。');
   else completeTimer=setTimeout(()=>say('地图加载较慢，可切换世界地图继续查看旅行记录。'),12000);
   const markers=[];
   for(const trip of items){
    const locations=trip.places?.length?trip.places:[{title:trip.title,position:trip.position}];
    for(const item of locations){
    if(!Array.isArray(item.position)||item.position.length!==2)continue;
    const node=document.createElement('button');node.type='button';node.className='amap-trip-pin';node.setAttribute('aria-label',`查看${item.title}`);node.textContent=item.title;node.dataset.tripId=trip.id;node.setAttribute('aria-pressed','false');
    node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();onSelect(trip.id);});
    const marker=new AMap.Marker({position:item.position,content:node,anchor:'bottom-center'});marker.setMap(map);markers.push(marker);
    if(!tripMarkers.has(trip.id))tripMarkers.set(trip.id,[]);tripMarkers.get(trip.id).push(marker);
    }
   }
   if(markers.length)map.setFitView(markers,true,[40,40,40,40],9);
   if(options.cityCodes?.length)setCityAreas(options.cityCodes);
  }catch(error){if(version!==sequence)return;say(error.message==='地图配置尚未完成'?'高德地图正在配置，暂可切换世界地图浏览。':'地图暂时无法加载，请稍后重试，或切换世界地图。');}
 }
 function zoom(direction){if(!map)return;if(direction==='reset'){map.setZoomAndCenter(4,[104.2,35.8]);}else if(direction==='in'){map.zoomIn();}else{map.zoomOut();}}
 function focusTrip(id){const markers=tripMarkers.get(id);if(map&&markers?.length)map.setFitView(markers,true,[45,45,45,45],10);}
 async function setCityAreas(codes){
  const version=++areaSequence,currentMap=map;if(!currentMap)return;
  if(cityAreas.length)currentMap.remove(cityAreas);cityAreas=[];
  if(!codes.length)return;
  try{
   if(!boundaryPromise)boundaryPromise=fetch('assets/life/city-boundaries.json').then(response=>{if(!response.ok)throw Error('boundaries');return response.json();}).catch(error=>{boundaryPromise=null;throw error;});
   const data=await boundaryPromise;if(version!==areaSequence||currentMap!==map)return;
   for(const code of codes){const district=data[code];if(!district)continue;for(const path of district.paths){
    const polygon=new window.AMap.Polygon({path,strokeColor:'#487456',strokeWeight:1,strokeOpacity:.65,fillColor:'#789b60',fillOpacity:.18,bubble:false,zIndex:40});polygon.setMap(currentMap);cityAreas.push(polygon);
   }}
  }catch{const status=currentHost?.parentElement.querySelector('[data-amap-status]');if(status)status.textContent='城市轮廓暂未加载，地点标记仍可正常查看。';}
 }
 return {mount,destroy,zoom,focusTrip,setCityAreas};
})();
