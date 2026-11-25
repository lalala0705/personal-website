(()=>{
 const launcher=document.querySelector('.bill-launcher');
 const avatar=launcher?.querySelector('.bill-avatar');
 const panel=document.querySelector('#bill-panel');
 if(!avatar||!panel)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mouse=matchMedia('(hover: hover) and (pointer: fine)');
 let ready=false,hovered=false,idleTimer=null,frameTimer=null,cycle=0,disposed=false;
 function frame(index){
  avatar.style.backgroundPosition=`${(index%4)*100/3}% ${index<4?0:100}%`;
  avatar.dataset.frame=String(index);
 }
 function stop(){clearTimeout(idleTimer);clearTimeout(frameTimer);frame(0);avatar.dataset.motion='idle';}
 function active(){return ready&&!disposed&&!reduced.matches&&!document.hidden&&panel.hidden;}
 function schedule(){
  clearTimeout(idleTimer);
  if(!active()||hovered)return;
  idleTimer=setTimeout(()=>{
   if(!active()||hovered)return;
   cycle++;
   if(cycle%3===0)play('coffee',[[2,260],[3,850],[4,260],[0,200]],schedule);
   else play('blink',[[1,150],[0,100]],schedule);
  },5000+Math.random()*2500);
 }
 function play(name,steps,done){
  stop();if(!active())return;
  avatar.dataset.motion=name;let index=0;
  function next(){
   if(!active()){stop();return;}
   if(index===steps.length){avatar.dataset.motion='idle';done?.();return;}
   const [pose,duration]=steps[index++];frame(pose);frameTimer=setTimeout(next,duration);
  }
  next();
 }
 function greet(){
  if(!active())return;
  play('wave',[[5,160],[6,220],[7,220],[6,220],[7,220],[5,160]],()=>{
   if(hovered&&active()){frame(5);avatar.dataset.motion='greeting';}else{frame(0);schedule();}
  });
 }
 launcher.addEventListener('pointerenter',event=>{
  if(event.pointerType!=='mouse'||!mouse.matches)return;
  hovered=true;greet();
 });
 launcher.addEventListener('pointerleave',()=>{hovered=false;stop();schedule();});
 launcher.addEventListener('focus',()=>{if(mouse.matches){hovered=true;greet();}});
 launcher.addEventListener('blur',()=>{hovered=false;stop();schedule();});
 const observer=new MutationObserver(()=>{stop();if(panel.hidden)schedule();});
 observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',()=>{hovered=false;stop();schedule();});
 reduced.addEventListener('change',()=>{
  stop();avatar.classList.toggle('is-animated',ready&&!reduced.matches);schedule();
 });
 const sheet=new Image();sheet.decoding='async';
 sheet.onload=()=>{ready=true;avatar.classList.toggle('is-animated',!reduced.matches);frame(0);schedule();};
 sheet.src='assets/assistant/bill-actions.png';
 // A failed image leaves the original static mascot visible and chat still works.
 window.addEventListener('pagehide',()=>{disposed=true;stop();});
 window.addEventListener('pageshow',()=>{disposed=false;schedule();});
})();
