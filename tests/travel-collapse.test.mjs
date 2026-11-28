import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('travel record toggles closed and open, retains header focus and only focuses real map destinations',()=>{
 const script=fs.readFileSync('life.js','utf8');
 let click;const focusTargets=[],mapTargets=[];
 const c={lifeSelection:'xuancheng-jing-202610',travelProvider:'amap',lifeDialog:{addEventListener:(_,fn)=>{click=fn;}},lifeView:{querySelector:selector=>({focus:()=>focusTargets.push(selector)})},updateTravelDetail:()=>{},CSS:{escape:s=>s},AmapTravel:{focusTrip:id=>mapTargets.push(id)}};
 vm.createContext(c);
 vm.runInContext(script.slice(script.indexOf("lifeDialog.addEventListener('click',e=>{"),script.indexOf('\n});',script.indexOf("lifeDialog.addEventListener('click',e=>{"))+4),c);
 const select=id=>click({target:{closest:()=>({dataset:{lifeRecord:id},hasAttribute:()=>false})}});
 select('xuancheng-jing-202610');assert.equal(c.lifeSelection,'');assert.deepEqual(mapTargets,[]);
 select('xuancheng-jing-202610');assert.equal(c.lifeSelection,'xuancheng-jing-202610');
 select('yiwu-202611');assert.equal(c.lifeSelection,'yiwu-202611');
 assert.deepEqual(mapTargets,['xuancheng-jing-202610','yiwu-202611']);
 assert.ok(focusTargets[0].includes('xuancheng-jing-202610'));
 const renderContext={lifeSelection:'',travelExpanded:false,lifeEscape:s=>s,shortTripDate:()=>'',renderTripDetail:()=>'<div>Photos</div>'};vm.createContext(renderContext);
 vm.runInContext(script.slice(script.indexOf('function renderTripIndex('),script.indexOf('function updateTravelDetail(')),renderContext);
 assert.doesNotMatch(renderContext.renderTripIndex([{id:'xuancheng-jing-202610',title:'宣城'}]),/class="trip-detail"/);
 renderContext.lifeSelection='xuancheng-jing-202610';assert.match(renderContext.renderTripIndex([{id:'xuancheng-jing-202610',title:'宣城'}]),/aria-expanded="true"/);
});
