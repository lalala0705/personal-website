// 高德 JS API Key 属于浏览器端配置；不要在此填入 Web 服务 Key。
// 有代理服务时优先配置 serviceHost；它应在服务器端保管 securityJsCode。
const travelMapConfig={jsKey:'b3b3088a600d4820d8558f2af3e70192',serviceHost:'',securityJsCode:'6ca99b4f65ed3700032a968c693c8922'};
const AmapTravel=(()=>{
 let sdkPromise=null,map=null,currentHost=null,completeTimer=null,sequence=0,tripMarkers=new Map();
 function destroy(){sequence++;tripMarkers.clear();clearTimeout(completeTimer);if(map){map.destroy();map=null;}currentHost=null;}
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
 async function mount(host,items,onSelect){
  destroy();const version=sequence;currentHost=host;const status=host.parentElement.querySelector('[data-amap-status]');
  function say(message){if(status&&host.isConnected)status.textContent=message;}
  say('正在打开高德地图…');
  try{
   const AMap=await sdk();if(version!==sequence||!host.isConnected)return;
   map=new AMap.Map(host,{viewMode:'2D',zoom:4,center:[104.2,35.8],resizeEnable:true,dragEnable:true,scrollWheel:true,keyboardEnable:true});
   completeTimer=setTimeout(()=>say('地图加载较慢，可切换世界地图继续查看旅行记录。'),12000);
   map.on('complete',()=>{clearTimeout(completeTimer);say('拖动或缩放地图，点击已点亮地点查看旅行记录。');});
   const markers=[];
   for(const trip of items){
    const locations=trip.places?.length?trip.places:[{title:trip.title,position:trip.position}];
    for(const item of locations){
    if(!Array.isArray(item.position)||item.position.length!==2)continue;
    const node=document.createElement('button');node.type='button';node.className='amap-trip-pin';node.setAttribute('aria-label',`查看${item.title}`);node.textContent=item.title;node.dataset.tripId=trip.id;node.setAttribute('aria-pressed','false');
    node.addEventListener('click',()=>onSelect(trip.id));
    const marker=new AMap.Marker({position:item.position,content:node,anchor:'bottom-center'});marker.setMap(map);markers.push(marker);
    if(!tripMarkers.has(trip.id))tripMarkers.set(trip.id,[]);tripMarkers.get(trip.id).push(marker);
    }
   }
   if(markers.length)map.setFitView(markers,false,[40,40,40,40],9);
  }catch(error){if(version!==sequence)return;say(error.message==='地图配置尚未完成'?'高德地图正在配置，暂可切换世界地图浏览。':'地图暂时无法加载，请稍后重试，或切换世界地图。');}
 }
 function zoom(direction){if(!map)return;if(direction==='reset'){map.setZoomAndCenter(4,[104.2,35.8]);}else if(direction==='in'){map.zoomIn();}else{map.zoomOut();}}
 function focusTrip(id){const markers=tripMarkers.get(id);if(map&&markers?.length)map.setFitView(markers,false,[45,45,45,45],10);}
 return {mount,destroy,zoom,focusTrip};
})();
