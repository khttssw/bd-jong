// ================= Config =================
const TILE=32, COLS=26, ROWS=22;
let scene=1, T=0;
const START1={x:13*TILE,y:7*TILE}, START2={x:12*TILE,y:18*TILE};
const player={x:START1.x,y:START1.y,w:44,h:52,speed:3.4,dir:'down',frame:0,timer:0,moving:false};

// ผังห้องตามแปลน: ชิ้นที่เดินทะลุไม่ได้ (หน่วยเป็นพิกเซล)
const solids=[
  {x:1*TILE,y:1*TILE,w:9*TILE,h:2.7*TILE},       // โต๊ะ (แนวนอน)
  {x:1*TILE,y:1*TILE,w:4*TILE,h:8.2*TILE},       // โต๊ะคอม (แนวตั้ง)
  {x:1*TILE,y:10*TILE,w:9*TILE,h:11*TILE},       // เตียง
  {x:13.2*TILE,y:18*TILE,w:4*TILE,h:3*TILE},     // โต๊ะเล็ก
  {x:21*TILE,y:8.6*TILE,w:4*TILE,h:12.4*TILE},   // ตู้เสื้อผ้า
  {x:10.7*TILE,y:1*TILE,w:3.6*TILE,h:2.4*TILE},  // ชั้นหนังสือ
  {x:19.3*TILE-38,y:19.6*TILE-30,w:76,h:36},     // กลองชุด
  {x:11.7*TILE,y:14.4*TILE,w:1.8*TILE,h:1.2*TILE}, // บีนแบ็ก
  {x:20.3*TILE-10,y:11.1*TILE,w:20,h:10},        // โคมไฟตั้งพื้น
  {x:10.3*TILE,y:18.9*TILE,w:1.1*TILE,h:1.2*TILE} // ตะกร้าผ้า
];

const roomObjects=[
  {id:'lighthouseDesk',x:6*TILE,y:1.5*TILE,w:2*TILE,h:2*TILE,title:'โต๊ะทำไฟประภาคาร',solved:false},
  {id:'constellationBook',x:6*TILE,y:10*TILE,w:2*TILE,h:2*TILE,title:'สมุดบันทึกกลุ่มดาว',solved:false},
  {id:'submarineRadio',x:14.2*TILE,y:18*TILE,w:2*TILE,h:2*TILE,title:'กล่องดนตรีวิทยุเรือดำน้ำ',solved:false},
  {id:'vanityMirror',x:21*TILE,y:12*TILE,w:2*TILE,h:2*TILE,title:'กระจกบานตู้เสื้อผ้า',solved:false},
  {id:'guitarMinigame',x:16.4*TILE,y:18.3*TILE,w:2*TILE,h:2*TILE,title:'กีตาร์โปร่งตัวโปรด',isMinigame:true},
  {id:'bedroomDoor',x:15.2*TILE,y:0,w:4*TILE,h:TILE,title:'ประตูห้องนอน',isDoor:true}
];
const endingObjects=[{id:'birthdayCake',x:12*TILE,y:10*TILE,w:2*TILE,h:2*TILE,title:'เค้กวันเกิดพิกเซล',isCake:true}];

const keys={up:false,down:false,left:false,right:false};
const dust=Array.from({length:55},()=>({x:Math.random()*COLS*TILE,y:Math.random()*ROWS*TILE,s:Math.random()*2+1,v:-(Math.random()*.25+.05),a:Math.random()*.6+.3,ph:Math.random()*6}));
const stars=Array.from({length:70},()=>({x:Math.random()*COLS*TILE,y:Math.random()*8*TILE,s:Math.random()<.2?2:1,ph:Math.random()*6}));
const fireworks=[], confetti=[];

// ================= DOM =================
const $=id=>document.getElementById(id);
const canvas=$('gameCanvas');
const mainCtx=canvas.getContext('2d',{alpha:false});
let ctx=mainCtx; // ฟังก์ชันวาดทุกตัวใช้ ctx ตัวนี้ — สลับไปวาดลง cache ได้ชั่วคราว
canvas.width=COLS*TILE; canvas.height=ROWS*TILE;
ctx.imageSmoothingEnabled=false;
let activeObject=null, solvedCount=0, candlesBlown=false;

// intro starfield
(function(){
  const c=$('introStars'); c.width=innerWidth; c.height=innerHeight; const x=c.getContext('2d');
  const s=Array.from({length:80},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*2+1,p:Math.random()*6}));
  (function f(t){ x.clearRect(0,0,c.width,c.height); s.forEach(o=>{ x.fillStyle=`rgba(254,243,199,${.3+.5*Math.abs(Math.sin(t/900+o.p))})`; x.fillRect(o.x,o.y,o.r,o.r); }); if(!$('introScreen').classList.contains('hidden')) requestAnimationFrame(f); })(0);
})();

// ================= Intro =================
const intro=["ท่ามกลางความเงียบสงบยามค่ำคืน...","คุณตื่นขึ้นมาใน 'ห้องนอนความทรงจำ' กลางดึก มีเพียงแสงไฟสีเขียวจากเครื่องคอมที่ส่องสว่าง...","ทว่าประตูห้องถูกล็อกเอาไว้ด้วยกลไกปริศนา...","ไขภารกิจทั้ง 4 จุดในห้องนอน เพื่อปลดล็อกประตูออกไปสู่เซอร์ไพรส์วันเกิดกันนะ! ❤️"];
let si=0, ci=0;
function typeIt(){
  if(si>=intro.length) return;
  const cur=intro[si];
  if(ci<cur.length){ $('typewriterText').innerText+=cur.charAt(ci++); setTimeout(typeIt,50); }
  else setTimeout(()=>{ si++; if(si<intro.length){ $('typewriterText').innerText=''; ci=0; typeIt(); } else $('startBtn').classList.remove('hidden'); },1200);
}
typeIt();
$('startBtn').addEventListener('click',()=>{
  audio.init(); audio.playSolve();
  $('introScreen').classList.add('opacity-0');
  setTimeout(()=>{ $('introScreen').classList.add('hidden'); $('gameHUD').classList.remove('opacity-0'); $('mobileControls').classList.remove('opacity-0'); },1000);
});

// ================= Input =================
const map={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
addEventListener('keydown',e=>{
  if(map[e.key]){ keys[map[e.key]]=true; e.preventDefault(); }
  if((e.key==='e'||e.key==='E'||e.key===' ')&&!e.repeat){ e.preventDefault(); handleInteraction(); }
});
addEventListener('keyup',e=>{ if(map[e.key]) keys[map[e.key]]=false; });
[['btnUp','up'],['btnDown','down'],['btnLeft','left'],['btnRight','right']].forEach(([id,k])=>{
  const b=$(id);
  b.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;});
  b.addEventListener('touchend',e=>{e.preventDefault();keys[k]=false;});
  b.addEventListener('mousedown',()=>keys[k]=true);
  b.addEventListener('mouseup',()=>keys[k]=false);
  b.addEventListener('mouseleave',()=>keys[k]=false);
});
$('btnMobileAction').addEventListener('click',handleInteraction);
$('actionBtn').addEventListener('click',handleInteraction);

// ================= Logic =================
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function blocked(nx,ny){
  if(scene!==1) return false;
  const box={x:nx+6,y:ny+24,w:player.w-12,h:player.h-24}; // เช็กเฉพาะช่วงเท้า ให้หัวซ้อนเฟอร์นิเจอร์ได้
  return solids.some(s=>hit(box,s));
}
function updatePlayer(){
  let mx=0,my=0;
  if(keys.up){my-=player.speed;player.dir='up';}
  if(keys.down){my+=player.speed;player.dir='down';}
  if(keys.left){mx-=player.speed;player.dir='left';}
  if(keys.right){mx+=player.speed;player.dir='right';}
  if(mx&&my){mx*=.75;my*=.75;}
  player.moving=!!(mx||my);
  if(player.moving){
    const minX=TILE, maxX=(COLS-1)*TILE-player.w;
    const minY=(scene===1?TILE+4:9*TILE), maxY=(ROWS-1)*TILE-player.h;
    const nx=Math.min(Math.max(player.x+mx,minX),maxX);
    if(!blocked(nx,player.y)) player.x=nx;
    const ny=Math.min(Math.max(player.y+my,minY),maxY);
    if(!blocked(player.x,ny)) player.y=ny;
    player.timer++;
    if(player.timer%10===0){ player.frame=(player.frame+1)%4; audio.playStep(); }
  } else player.frame=0;
  detectProximity();
}
function detectProximity(){
  const list=scene===1?roomObjects:endingObjects;
  let best=null, bd=85;
  list.forEach(o=>{
    const d=Math.hypot(player.x+player.w/2-(o.x+o.w/2), player.y+player.h/2-(o.y+o.h/2));
    if(d<bd){ bd=d; best=o; }
  });
  activeObject=best;
  if(activeObject){ $('interactPrompt').classList.remove('hidden'); $('actionBtnText').innerText=`กด [E] หรือแตะสำรวจ "${activeObject.title}"`; }
  else $('interactPrompt').classList.add('hidden');
}
function modalOpen(){ return !$('puzzleModal').classList.contains('hidden') || !$('endingModal').classList.contains('hidden'); }

function handleInteraction(){
  if(!activeObject || modalOpen()) return;
  audio.init(); audio.playInteract();
  const o=activeObject;
  if(o.isDoor){
    if(solvedCount<4){
      openModal('🔒 ประตูห้องนอนถูกล็อก!','🚪',`<p class="text-yellow-200">ประตูถูกล็อกด้วยแม่กุญแจความทรงจำ...</p><p class="mt-2 text-xs text-yellow-300">ไขปริศนาในห้องนอนให้ครบทั้ง 4 จุดเพื่อปลดล็อกประตูกันนะ! (${solvedCount}/4)</p>`);
      $('solveBtn').classList.add('hidden');
    } else {
      audio.playUnlockDoor();
      scene=2; player.x=START2.x; player.y=START2.y; player.dir='up';
      $('questTitle').innerText="ฉากจบวันเกิด: เดินไปหาเค้กวันเกิดตรงกลางกันเถอะ! 🎉";
      $('questProgress').innerText="Done!"; $('progressBar').style.width="100%";
    }
    return;
  }
  if(o.isMinigame){ startGuitarMinigame(); return; }
  if(o.isCake){ $('endingModal').classList.remove('hidden'); setTimeout(()=>$('endingModal').classList.remove('opacity-0'),50); return; }

  const quests={
    lighthouseDesk:['🚨 ภารกิจ #1: โต๊ะทำไฟประภาคาร','⚓',`<p>บนโต๊ะไม้มีแบบจำลองประภาคารจิ๋วส่องแสงระยิบระยับ...</p><p class="text-xs text-yellow-300">"ประภาคารนี้คอยนำทางใจเสมอ ไม่ว่าท้องทะเลจะมืดมิดเพียงใด"</p><div class="p-3 bg-yellow-950/80 rounded-xl border border-yellow-600/40 my-2 text-center text-yellow-200">หมุนประภาคารไปที่องศาความรัก: <span class="font-bold text-yellow-400 font-pixel text-[10px]">365° ALL DAYS</span></div>`,'เก็บชิ้นส่วนประภาคาร ✨'],
    constellationBook:['🌌 ภารกิจ #2: สมุดบันทึกกลุ่มดาว','📖',`<p>สมุดบันทึกเล่มหนาวางอยู่บนผ้าห่มตรงปลายเตียง เปิดออกประกายแสงระยิบระยับคล้ายทางช้างเผือก...</p><div class="p-3 bg-indigo-950/80 rounded-xl border border-indigo-400/40 my-2 space-y-1"><p class="text-yellow-200 font-bold">บันทึกดวงดาว:</p><p class="text-xs text-indigo-200">"ในบรรดาดาวนับล้านดวงบนท้องฟ้า... มีดาวดวงหนึ่งที่สว่างและอบอุ่นที่สุดในใจเราเสมอ นั่นก็คือเธอ"</p></div>`,'บันทึกดวงดาวลงในใจ ✨'],
    submarineRadio:['📻 ภารกิจ #3: วิทยุเรือดำน้ำความทรงจำ','🎶',`<p>วิทยุไม้ทรงวินเทจประดับสัญลักษณ์เรือดำน้ำเหลืองจิ๋ว...</p><p class="text-xs text-yellow-300">เมื่อหมุนคลื่นความถี่ จะได้ยินบทเพลงใต้น้ำที่เราเคยฟังด้วยกันในปีที่แล้ว...</p><div class="p-3 bg-yellow-950/80 rounded-xl border border-yellow-600/40 my-2 text-center text-yellow-300 font-bold">🎵 FREQUENCY: 104.4 MHz — SEA OF LOVE</div>`,'ไขสไลด์เสียงเพลง ✨'],
    vanityMirror:['🪞 ภารกิจ #4: กระจกบานตู้เสื้อผ้า','✨',`<p>บานตู้เสื้อผ้ามีกระจกเงาบานใหญ่ประดับหลอดไฟนีออนสีเขียวล้อมรอบ...</p><div class="p-3 bg-rose-950/80 rounded-xl border border-rose-400/40 my-2 text-center space-y-1"><p class="text-xs text-rose-200">ข้อความสลักบนกระจก:</p><p class="text-sm font-bold text-yellow-300">"เธองดงามและคู่ควรกับความสุขที่สุดในโลกเสมอ"</p></div>`,'รับกุญแจทองคำ ✨']
  };
  const q=quests[o.id]; if(!q) return;
  openModal(q[0],q[1],q[2]);
  const b=$('solveBtn'); b.classList.remove('hidden');
  b.innerText = o.solved ? 'เก็บไว้แล้ว ✅' : q[3];
  b.onclick=()=>completeTask(o);
}
// TODO: ออกแบบมินิเกมกีตาร์ตรงนี้ภายหลัง (ตอนนี้เป็นแค่ตัวยึดตำแหน่ง ไม่นับในภารกิจ 4 จุด)
function startGuitarMinigame(){
  openModal('🎸 มินิเกมกีตาร์','🎸','<p>กีตาร์โปร่งตัวโปรดวางพิงโต๊ะอยู่ข้างๆ กลองชุด...</p><p class="text-xs text-yellow-300 mt-2">🎵 มินิเกมกำลังเตรียมมาเร็วๆ นี้ — รอติดตามนะ!</p>');
  $('solveBtn').classList.add('hidden');
}
function openModal(title,icon,html){
  $('modalTitle').innerText=title; $('modalIcon').innerText=icon; $('puzzleBody').innerHTML=html;
  $('puzzleModal').classList.remove('hidden'); setTimeout(()=>$('puzzleModal').classList.remove('opacity-0'),50);
}
function completeTask(o){
  audio.playSolve();
  if(!o.solved){
    o.solved=true; solvedCount++;
    $('questProgress').innerText=`${solvedCount}/4`;
    $('progressBar').style.width=`${solvedCount/4*100}%`;
    $('questTitle').innerText = solvedCount===4 ? "ปลดล็อกครบแล้ว! เดินไปเปิดประตูทางออกได้เลย 🚪✨" : `สำรวจภารกิจความทรงจำในห้องนอน (${solvedCount}/4)`;
  }
  closeModal();
}
function closeModal(){ $('puzzleModal').classList.add('opacity-0'); setTimeout(()=>$('puzzleModal').classList.add('hidden'),300); }
$('closeModalBtn').addEventListener('click',closeModal);

// Ending
function burst(){
  const cols=['#f97316','#fbbf24','#f43f5e','#38bdf8','#a855f7','#4ade80'];
  for(let b=0;b<4;b++){
    const cx=Math.random()*canvas.width*.8+canvas.width*.1, cy=Math.random()*canvas.height*.4+20, col=cols[Math.floor(Math.random()*cols.length)];
    for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, sp=1.5+Math.random()*2.5;
      fireworks.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color:col,life:1}); }
  }
}
let fwTimer=null;
$('blowCandleBtn').addEventListener('click',()=>{
  if(candlesBlown) return; candlesBlown=true;
  audio.playHappyBirthdayMelody();
  $('candleFlame').innerText="🎂✨";
  $('blowCandleBtn').classList.add('opacity-50','pointer-events-none');
  $('blowCandleBtn').innerText="เป่าเทียนเรียบร้อยแล้ว! 💖";
  burst(); let n=0; fwTimer=setInterval(()=>{ burst(); if(++n>6) clearInterval(fwTimer); },700);
  for(let i=0;i<120;i++) confetti.push({x:Math.random()*canvas.width,y:-Math.random()*200,vy:1+Math.random()*2,vx:(Math.random()-.5)*1,c:['#fbbf24','#f43f5e','#38bdf8','#4ade80','#c084fc'][i%5],s:3+Math.random()*3});
});
$('restartGameBtn').addEventListener('click',()=>{
  audio.playSolve(); clearInterval(fwTimer);
  $('endingModal').classList.add('opacity-0');
  setTimeout(()=>{
    $('endingModal').classList.add('hidden');
    scene=1; solvedCount=0; candlesBlown=false; fireworks.length=0; confetti.length=0;
    $('candleFlame').innerText="🕯️🎂";
    $('blowCandleBtn').classList.remove('opacity-50','pointer-events-none');
    $('blowCandleBtn').innerText="💨 เป่าเทียนวันเกิด (Blow Candles)";
    roomObjects.forEach(o=>o.solved=false);
    $('questProgress').innerText="0/4"; $('progressBar').style.width="0%";
    player.x=START1.x; player.y=START1.y; player.dir='down';
    $('questTitle').innerText="ประตูห้องถูกล็อก! สำรวจภารกิจความทรงจำในห้องนอน (0/4)";
  },500);
});

// ================= Drawing helpers =================
const R=(x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
function glow(x,y,r,color){
  const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,color); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
}
function shadow(x,y,w,h){ R(x+3,y+h-4,w,6,'rgba(0,0,0,.35)'); }

// ================= Bedroom =================
const T_=TILE;

function neon(x,y,w,h,a){ R(x,y,w,h,`rgba(34,197,94,${a})`); }

function woodTop(x,y,w,h,col,hl,edge){
  R(x+5,y+6,w,h,'rgba(0,0,0,.45)');
  R(x,y,w,h,col); R(x,y,w,3,hl);
  for(let gx=x+10;gx<x+w;gx+=24) R(gx,y+8,1,h-18,'rgba(0,0,0,.18)');
  R(x,y+h-6,w,6,edge);
}

function drawWindow(x,y,w,h,seed,moon){
  R(x,y,w,h,'#080b12');
  const gx=x+4, gy=y+4, gw=w-8, gh=h-8;
  const g=ctx.createLinearGradient(0,gy,0,gy+gh); g.addColorStop(0,'#050a1c'); g.addColorStop(1,'#16235a');
  ctx.fillStyle=g; ctx.fillRect(gx,gy,gw,gh);
  for(let i=0;i<10;i++){
    const sx=gx+((seed*37+i*53)%Math.max(4,gw-2)), sy=gy+((seed*91+i*29)%Math.max(4,gh-2));
    const sa=.45+.5*Math.abs(Math.sin(T/20+i+seed)); R(sx,sy,1.5,1.5,`rgba(255,255,255,${sa})`);
    if(i%3===0){ R(sx-2,sy+.5,5,1,`rgba(220,235,255,${sa*.7})`); R(sx+.5,sy-2,1,5,`rgba(220,235,255,${sa*.7})`); }
  }
  if(moon){
    ctx.fillStyle='#e2e8f0'; ctx.beginPath(); ctx.arc(moon.x,moon.y,8,0,7); ctx.fill();
    ctx.fillStyle='#0a1236'; ctx.beginPath(); ctx.arc(moon.x+4,moon.y-3,7,0,7); ctx.fill();
  }
  if(h>w){ for(let k=1;k<4;k++) R(gx,gy+gh*k/4-1,gw,3,'#080b12'); R(gx+gw/2-1,gy,3,gh,'#080b12'); }
  else { for(let k=1;k<4;k++) R(gx+gw*k/4-1,gy,3,gh,'#080b12'); R(gx,gy+gh/2-1,gw,3,'#080b12'); }
  ctx.strokeStyle='#2b3345'; ctx.lineWidth=2; ctx.strokeRect(x+1,y+1,w-2,h-2);
}

function beam(pts){
  const g=ctx.createLinearGradient(pts[0][0],pts[0][1],pts[2][0],pts[2][1]);
  g.addColorStop(0,'rgba(147,197,253,.13)'); g.addColorStop(1,'rgba(147,197,253,0)');
  ctx.fillStyle=g; ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.closePath(); ctx.fill();
}

function fan(cx,cy,r){
  ctx.fillStyle='#03120b'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  ctx.strokeStyle=`rgba(74,222,128,${.8+.2*Math.sin(T/12)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(34,197,94,.9)';
  for(let k=0;k<3;k++){ const a=T/6+k*2.094; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*(r-2),cy+Math.sin(a)*(r-2)); ctx.stroke(); }
  R(cx-2,cy-2,4,4,'#bbf7d0');
}

function drawDesk(){
  const H1={x:1*T_,y:1*T_,w:9*T_,h:2.7*T_}, V1={x:1*T_,y:1*T_,w:4*T_,h:8.2*T_};
  [H1,V1].forEach(r=>R(r.x+5,r.y+6,r.w,r.h,'rgba(0,0,0,.5)'));
  [H1,V1].forEach(r=>{
    R(r.x,r.y,r.w,r.h,'#7a5236');
    for(let gy=r.y+10;gy<r.y+r.h-8;gy+=14){ R(r.x+4,gy,r.w-8,1,'rgba(40,20,8,.28)'); R(r.x+4+((gy*7)%40),gy+5,r.w*.3,1,'rgba(255,220,170,.10)'); }
    for(let gx=r.x+10;gx<r.x+r.w;gx+=48) R(gx,r.y+4,1,r.h-10,'rgba(40,20,8,.22)');
  });
  R(H1.x,H1.y,H1.w,3,'#a47850');
  R(V1.x,V1.y,3,V1.h,'#946846');
  R(5*T_,H1.y+H1.h-6,5*T_,6,'#4a2e1c');
  R(V1.x,V1.y+V1.h-6,V1.w,6,'#4a2e1c');
  R(V1.x+V1.w-6,H1.y+H1.h,6,V1.h-H1.h,'#4a2e1c');
  const pl=.6+.25*Math.sin(T/20);

  // เมาส์แพด + จอ + คีย์บอร์ด RGB
  const mx=1.15*T_, my=4.3*T_;
  R(mx-4,my+52,104,60,'rgba(0,0,0,.4)'); R(mx-6,my+50,104,60,'#06070b'); R(mx-6,my+50,104,2,'#1c1f29'); R(mx-3,my+53,98,54,'rgba(255,255,255,.035)'); R(mx-6,my+108,104,2,'#000');
  R(mx,my,74,48,'#080b12');
  const sg=ctx.createLinearGradient(0,my+4,0,my+44); sg.addColorStop(0,'#04261a'); sg.addColorStop(1,'#0b6b3a');
  ctx.fillStyle=sg; ctx.fillRect(mx+4,my+4,66,40);
  for(let i=0;i<6;i++){ const lw=10+((Math.sin(T/25+i*1.7)+1)*.5)*38; R(mx+8,my+8+i*6,lw,2,'rgba(134,239,172,.9)'); }
  if((T>>4)%2) R(mx+8+36,my+8+5*6-1,3,5,'#bbf7d0');
  R(mx+30,my+48,14,8,'#10131b'); R(mx+20,my+56,34,4,'#1f2533');
  const kx=mx, ky=my+68;
  R(kx,ky,70,14,'#0b0e14');
  for(let i=0;i<10;i++){ R(kx+3+i*6.5,ky+3,5,3,`rgba(74,222,128,${.45+.5*Math.sin(T/8+i*.6)})`); R(kx+3+i*6.5,ky+8,5,3,`rgba(74,222,128,${.45+.5*Math.sin(T/8+i*.6+2)})`); }
  R(kx+76,ky+1,9,14,'#0b0e14'); R(kx+79,ky+4,3,3,`rgba(74,222,128,${.6+.4*Math.sin(T/10)})`);

  // เคสพีซีกระจกใส ไฟน้ำเขียว
  const tx=mx+76, ty=4.0*T_;
  R(tx-2,ty-2,44,84,'#05070b'); R(tx,ty,40,80,'#0b0e14');
  R(tx+4,ty+4,32,72,'#03120b');
  fan(tx+20,ty+17,10); fan(tx+20,ty+40,10);
  ctx.strokeStyle=`rgba(74,222,128,${.65+.3*Math.sin(T/15)})`; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(tx+8,ty+8); ctx.lineTo(tx+8,ty+54); ctx.quadraticCurveTo(tx+8,ty+62,tx+16,ty+62); ctx.lineTo(tx+30,ty+62); ctx.stroke();
  R(tx+6,ty+64,28,7,'#111827'); R(tx+8,ty+66,24,3,`rgba(34,197,94,${.6+.4*Math.sin(T/9)})`);
  glow(tx+20,ty+40,140,`rgba(34,197,94,${.20+.07*Math.sin(T/20)})`);
  glow(mx+37,my+26,90,'rgba(34,197,94,.14)');

  // กระป๋องเอเนอร์จี้ + หูฟัง บนโต๊ะแนวนอน
  const cx=9.1*T_, cy=2.0*T_;
  R(cx+3,cy+16,12,4,'rgba(0,0,0,.4)');
  R(cx,cy,10,18,'#0b0e14'); R(cx+1,cy+4,8,10,'#22c55e'); R(cx+3,cy+7,4,2,'#052e16'); R(cx,cy,10,2,'#9ca3af');
  ctx.strokeStyle='#0b0e14'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(8.2*T_,2.2*T_,10,Math.PI,0); ctx.stroke();
  R(8.2*T_-14,2.2*T_,7,10,'#0b0e14'); R(8.2*T_+7,2.2*T_,7,10,'#0b0e14'); R(8.2*T_-12,2.2*T_+3,3,4,'#22c55e'); R(8.2*T_+9,2.2*T_+3,3,4,'#22c55e');
}

function drawBed(){
  const x=1*T_, y=10*T_, w=9*T_, h=11*T_;
  const E=(cx,cy,rx,ry,c,rot=0)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,rot,0,7); ctx.fill(); };
  R(x+6,y+6,w,h,'rgba(0,0,0,.5)');
  R(x,y,w,h,'#0b0e14');
  R(x,y+h-26,w,26,'#0f131b'); R(x,y+h-26,w,4,'#262d3d');
  neon(x+8,y+h-30,w-16,2,.55+.2*Math.sin(T/25));
  R(x,y,w,8,'#10141d'); R(x,y,w,2,'#262d3d');
  R(x+10,y+8,w-20,h-34,'#2a3a5c'); R(x+10,y+8,w-20,3,'#3b4f7a');
  // หมอนลายการ์ตูนสีฟ้า
  [[1.8,3],[5.6,3]].forEach(([px,pw],k)=>{
    const X=px*T_,Y=18.4*T_,Wd=pw*T_,Hh=1.7*T_;
    R(X,Y,Wd,Hh,'#1e3a8a'); R(X+2,Y+2,Wd-4,Hh-6,'#7dd3fc'); R(X+8,Y+8,Wd-16,3,'#bae6fd');
    E(X+Wd/2,Y+Hh/2-2,9,6,'#fff'); E(X+Wd/2+10,Y+Hh/2-2,3,3,'#fff'); R(X+Wd/2-4,Y+Hh/2-4,2,2,'#0c4a6e');
    [[14,10],[Wd-16,22],[Wd-30,8]].forEach(([a,b])=>R(X+a,Y+b,3,3,'#fde047'));
  });
  // ผ้าห่มลายการ์ตูนสีฟ้า
  const bx=x+10, by=y+8, bw=w-20, bh=6.6*T_+ (16.6-10-6.6+0)*T_;
  const BH=8.4*T_;
  R(bx,by,bw,BH,'#2f7fd1');
  for(let i=0;i<9;i++) R(bx,by+6+i*30,bw,14,'#3d94e6');
  for(let r=0;r<6;r++) for(let c=0;c<8;c++){
    const px=bx+14+c*34+(r%2?17:0), py=by+16+r*40;
    if((r+c)%3===0){ E(px,py,8,5,'#e0f2fe'); E(px-5,py+2,5,4,'#e0f2fe'); E(px+5,py+2,5,4,'#e0f2fe'); }          // เมฆ
    else if((r+c)%3===1){ R(px-1,py-5,3,10,'#fde047'); R(px-5,py-1,11,3,'#fde047'); R(px-3,py-3,7,7,'#fef08a'); }   // ดาว
    else { E(px,py,7,4,'#7dd3fc'); R(px+6,py-3,5,6,'#7dd3fc'); R(px-4,py-1,2,2,'#0c4a6e'); }                      // ปลา
  }
  R(bx,by+BH-12,bw,12,'#1e5fa8'); R(bx,by+BH,bw,3,'#0c2f5a');
  // ===== ตุ๊กตา =====
  // ฉลามตัวใหญ่ (ใหญ่กว่าวาฬ)
  { const cx=4.3*T_, cy=13.3*T_;
    R(cx-48,cy+20,100,5,'rgba(0,0,0,.25)');
    ctx.fillStyle='#64748b'; ctx.beginPath(); ctx.moveTo(cx+44,cy); ctx.lineTo(cx+72,cy-26); ctx.lineTo(cx+64,cy); ctx.lineTo(cx+72,cy+24); ctx.fill();   // หาง
    E(cx,cy,54,22,'#64748b'); E(cx-4,cy+10,46,11,'#f1f5f9');
    ctx.fillStyle='#475569'; ctx.beginPath(); ctx.moveTo(cx-8,cy-18); ctx.lineTo(cx+8,cy-44); ctx.lineTo(cx+20,cy-16); ctx.fill();         // ครีบหลัง
    ctx.fillStyle='#475569'; ctx.beginPath(); ctx.moveTo(cx-6,cy+14); ctx.lineTo(cx-22,cy+34); ctx.lineTo(cx+8,cy+18); ctx.fill();
    R(cx-40,cy-6,5,5,'#0b1220'); R(cx-39,cy-7,2,2,'#fff'); R(cx-52,cy+4,22,3,'#0b1220');
    for(let i=0;i<5;i++){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx-50+i*4,cy+4); ctx.lineTo(cx-48+i*4,cy+9); ctx.lineTo(cx-46+i*4,cy+4); ctx.fill(); }
  }
  // วาฬ (เล็กกว่าฉลาม)
  { const wx=7.3*T_, wy=14.2*T_;
    E(wx,wy,24,13,'#2f86ad'); E(wx-2,wy+6,19,6,'#bfe3f2');
    ctx.fillStyle='#2f86ad'; ctx.beginPath(); ctx.moveTo(wx+20,wy); ctx.lineTo(wx+33,wy-11); ctx.lineTo(wx+30,wy+5); ctx.fill();
    R(wx-15,wy-4,3,3,'#04202e');
  }
  // ห่านขาวตัวยาว (ยาวเท่าเตียง)
  { const gx=9.05*T_, cy=14.9*T_;
    R(gx-18,cy-96,36,206,'rgba(0,0,0,.22)');
    ctx.fillStyle='#f8fafc'; ctx.beginPath(); ctx.moveTo(gx-14,cy+92); ctx.lineTo(gx,cy+122); ctx.lineTo(gx+14,cy+92); ctx.fill();   // หาง
    E(gx,cy,23,102,'#f8fafc'); E(gx+6,cy+8,15,86,'#e2e8f0');
    E(gx-14,cy+4,8,60,'#cbd5e1',.05); E(gx+14,cy+4,8,60,'#cbd5e1',-.05);                                                        // ปีก
    for(let i=0;i<6;i++){ R(gx-12,cy-40+i*22,24,2,'rgba(148,163,184,.5)'); }
    R(gx-7,cy-132,14,48,'#f8fafc');                                                                                                // คอ
    E(gx,cy-136,12,10,'#fff');
    ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.moveTo(gx-7,cy-142); ctx.lineTo(gx,cy-160); ctx.lineTo(gx+7,cy-142); ctx.fill(); // ปาก
    R(gx-7,cy-140,3,3,'#0b1220'); R(gx+4,cy-140,3,3,'#0b1220');
    R(gx-12,cy+104,8,8,'#f59e0b'); R(gx+4,cy+104,8,8,'#f59e0b');
  }
  // ตุ๊กตาหมาขนฟูสีดำ จมูกขาว + ปีกสีขาว
  { const dx=2.7*T_, dy=16.3*T_;
    R(dx-34,dy+30,70,4,'rgba(0,0,0,.3)');
    // ปีก
    [-1,1].forEach(sg=>{ ctx.fillStyle='#f8fafc'; ctx.beginPath(); ctx.moveTo(dx+sg*16,dy+2); ctx.lineTo(dx+sg*50,dy-22); ctx.lineTo(dx+sg*44,dy-6); ctx.lineTo(dx+sg*54,dy+6); ctx.lineTo(dx+sg*42,dy+8); ctx.lineTo(dx+sg*50,dy+20); ctx.lineTo(dx+sg*16,dy+18); ctx.fill();
      R(dx+sg*40-1,dy-12,2,18,'#cbd5e1'); });
    const FUR='#2b2b2f', FUR2='#3a3a40';
    E(dx,dy+16,22,19,FUR);                                  // ลำตัว
    E(dx-24,dy+12,8,13,FUR,.3); E(dx+24,dy+12,8,13,FUR,-.3); // แขน
    E(dx-11,dy+32,9,6,FUR); E(dx+11,dy+32,9,6,FUR);          // เท้า
    for(let a=0;a<18;a++){ const t=a/18*6.283; E(dx+Math.cos(t)*26,dy-14+Math.sin(t)*22,5,5,a%2?FUR:FUR2); }  // ขนฟูรอบหัว
    E(dx,dy-14,26,22,FUR);
    E(dx-25,dy-26,9,13,'#1e1e22',.4); E(dx+25,dy-26,9,13,'#1e1e22',-.4);   // หู
    E(dx-10,dy-24,5,4,'#f5f5f4'); E(dx+10,dy-24,5,4,'#f5f5f4');             // แต้มขาวเหนือตา
    R(dx-11,dy-18,2,2,'#05060a'); R(dx+9,dy-18,2,2,'#05060a');              // ตา
    E(dx,dy-4,19,13,'#fafaf9'); E(dx,dy-2,15,9,'#fff');                     // ปากขาวฟู
    E(dx,dy-9,6,4,'#05060a'); R(dx-2,dy-10,2,1,'#52525b');                  // จมูก
  }
  // ตุ๊กตาเต่า
  { const tx=5*T_+10, ty=16.6*T_;
    R(tx-24,ty+14,50,3,'rgba(0,0,0,.25)');
    E(tx,ty+2,22,14,'#16a34a'); E(tx,ty,16,9,'#22c55e');
    [[-8,-2],[4,-3],[-2,5],[10,3]].forEach(([a,b])=>R(tx+a,ty+b,5,5,'#15803d'));
    E(tx-26,ty+2,8,7,'#a3e635'); R(tx-29,ty,2,2,'#0b1220');
    [[-14,10],[12,10]].forEach(([a,b])=>E(tx+a,ty+b,6,4,'#a3e635'));
  }
  neon(x,y+h-3,w,2,.5+.2*Math.sin(T/25));
}

function drawWardrobe(){
  const x=21*T_, y=8.6*T_, w=4*T_, h=12.4*T_;
  R(x-7,y+8,7,h,'rgba(0,0,0,.5)');
  R(x,y,w,h,'#6b4630'); R(x,y,w,8,'#4a2e1c'); R(x,y,w,2,'#9a6b46');
  R(x,y+8,2,h-8,'#3d2415');
  const pw=(w-24)/2, ph=(h-24)/4;
  for(let r=0;r<4;r++) for(let c=0;c<2;c++){
    const px=x+8+c*(pw+8), py=y+12+r*ph;
    R(px,py,pw-2,ph-6,'#4a2e1c'); R(px+3,py+3,pw-8,ph-12,'#7a5236'); R(px+3,py+3,pw-8,2,'#a47850'); for(let k=0;k<4;k++) R(px+6,py+10+k*((ph-24)/4),pw-14,1,'rgba(40,20,8,.25)');
    const hx=c===0?px+pw-9:px+4; R(hx,py+ph/2-14,3,16,'#d4b483'); R(hx,py+ph/2-14,1,16,'#f3e2bd');
  }
}

function drawGuitar(){
  ctx.save(); ctx.translate(17.4*T_,19.3*T_); ctx.rotate(.2);
  R(-14,28,34,4,'rgba(0,0,0,.35)');
  // คอ + หัวกีตาร์ + clef ลูกบิด
  R(-3,-48,6,38,'#3b2314');
  for(let k=0;k<6;k++) R(-3,-44+k*6,6,1,'#d6d3d1');
  R(-5,-62,10,15,'#7a4a24');
  [-1,1].forEach(sg=>{ for(let k=0;k<3;k++) R(sg*7-1,-60+k*4,3,2,'#e5e7eb'); });
  // ตัวกีตาร์โปร่ง: ขอบเข้ม แล้วทับด้วยไม้สีทอง
  const edge='#5b3216', wood='#c98a4b';
  EL(0,-2,13,12,edge); EL(0,14,17,18,edge); R(-11,0,22,12,edge);
  EL(0,-2,11,10,wood); EL(0,14,15,16,wood); R(-9,1,18,10,wood);
  ctx.strokeStyle='rgba(90,45,15,.35)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(0,14,12,13,0,0,7); ctx.stroke();
  EL(-5,9,5,9,'rgba(255,235,190,.22)');
  // ปากกีตาร์ + pickguard + สะพานสาย
  EL(0,10,6,6,'#1a0f08'); ctx.strokeStyle='#6b3d1a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,10,7,0,7); ctx.stroke();
  EL(9,17,3,6,'rgba(30,15,5,.55)');
  R(-8,25,16,3,'#3b2314'); for(let k=0;k<6;k++) R(-6+k*2.4,25,1,1,'#f5f5f4');
  // สาย
  ctx.strokeStyle='rgba(250,250,240,.65)'; ctx.lineWidth=1;
  for(let k=0;k<3;k++){ ctx.beginPath(); ctx.moveTo(-2+k*2,-48); ctx.lineTo(-3+k*3,26); ctx.stroke(); }
  ctx.restore();
}

function drawDumbbell(){
  ctx.save(); ctx.translate(13.35*T_,11.75*T_); ctx.rotate(-.25);
  R(-24,8,56,4,'rgba(0,0,0,.45)');
  R(-26,-3,52,6,'#6b7280'); R(-26,-3,52,2,'#9ca3af');
  [-1,1].forEach(s=>{
    R(s*27-5+(s>0?0:-3),-12,8,24,'#05070b'); R(s*19-3,-9,6,18,'#10131b'); R(s*27-4+(s>0?0:-3),-11,2,22,'#374151');
  });
  ctx.restore();
}

function drawPlant(){
  const px=23.5*T_, py=1.5*T_;
  R(px,py+14,22,16,'#1f2937'); R(px-2,py+11,26,5,'#374151');
  [[-6,-6],[3,-16],[12,-9],[19,-2]].forEach(([dx,dy])=>{ ctx.fillStyle='#14532d'; ctx.beginPath(); ctx.ellipse(px+10+dx,py+8+dy,6,10,dx/12,0,7); ctx.fill(); });
}

function drawPoster(x,col){
  R(x,3,18,22,'#05070b'); R(x+2,5,14,18,'#0b1620');
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(x+2,23); ctx.lineTo(x+8,12); ctx.lineTo(x+12,18); ctx.lineTo(x+16,23); ctx.fill();
  R(x+11,7,3,3,'#e2e8f0');
}

// ================= Wood floor (cached) =================
let _woodFloor=null;
function getWoodFloor(){
  if(_woodFloor) return _woodFloor;
  const c=document.createElement('canvas'); c.width=COLS*TILE; c.height=ROWS*TILE;
  const g=c.getContext('2d');
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const FR=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  const tones=['#7a5236','#6f4a31','#845a3b','#6a452e','#774f35','#8a6040'];
  const PH=16, x0=TILE, x1=(COLS-1)*TILE, y0=TILE, y1=(ROWS-1)*TILE;
  FR(x0,y0,x1-x0,y1-y0,'#2a1a10');
  let row=0;
  for(let y=y0;y<y1;y+=PH,row++){
    let x=x0-((row*37)%90)-rnd()*10;
    while(x<x1){
      const w=70+Math.floor(rnd()*60);
      const px=Math.max(x,x0), pw=Math.min(x+w,x1)-px;
      if(pw>2){
        const col=tones[Math.floor(rnd()*tones.length)];
        FR(px,y,pw,PH,col);
        FR(px,y,pw,2,'rgba(255,225,180,.14)');          // ขอบบนสว่าง
        FR(px,y+PH-3,pw,3,'rgba(30,15,5,.35)');          // ขอบล่างเข้ม
        FR(px,y+PH-1,pw,1,'#24150c');                    // ร่องระหว่างแผ่น
        for(let k=0;k<3;k++){                            // ลายเสี้ยนไม้
          const gy=y+3+Math.floor(rnd()*(PH-7)), gx=px+Math.floor(rnd()*pw*.4), gl=Math.floor(pw*(.3+rnd()*.5));
          FR(gx,gy,Math.min(gl,px+pw-gx),1,rnd()<.5?'rgba(40,20,8,.28)':'rgba(255,220,170,.10)');
        }
        if(rnd()<.18){ const kx=px+8+rnd()*(pw-16); FR(kx,y+5,5,5,'rgba(40,20,8,.35)'); FR(kx+1,y+6,3,3,'rgba(25,12,4,.45)'); } // ตาไม้
        FR(px,y,1,PH,'#24150c');                         // รอยต่อหัวแผ่น
      }
      x+=w;
    }
  }
  _woodFloor=c; return c;
}

function EL(x,y,rx,ry,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,7); ctx.fill(); }
function LN(x1,y1,x2,y2,c,w){ ctx.strokeStyle=c||'#9ca3af'; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

// กลองชุด ตั้งข้างกีตาร์
function drawDrums(){
  const cx=19.3*T_, by=19.6*T_;
  EL(cx,by+2,54,9,'rgba(0,0,0,.4)');
  // เก้าอี้กลอง
  LN(cx-6,by+16,cx-9,by+27,'#6b7280',2); LN(cx+10,by+16,cx+13,by+27,'#6b7280',2);
  EL(cx+2,by+15,11,4,'#111827'); EL(cx+2,by+13,11,4,'#374151');
  // ขาตั้งฉาบ
  LN(cx-30,by-2,cx-30,by-62); LN(cx-30,by-6,cx-41,by+2); LN(cx-30,by-6,cx-21,by+2);
  EL(cx-30,by-64,14,4,'#ca8a04'); EL(cx-30,by-65,14,3,'#facc15'); R(cx-31,by-68,2,3,'#a16207');
  LN(cx+30,by-2,cx+30,by-54); LN(cx+30,by-6,cx+40,by+2); LN(cx+30,by-6,cx+21,by+2);
  EL(cx+30,by-56,15,4,'#ca8a04'); EL(cx+30,by-57,15,3,'#fde047'); R(cx+29,by-60,2,3,'#a16207');
  // กลองใหญ่ (หน้ากลองสีขาว ลายหัวใจแดง)
  R(cx-22,by-4,4,6,'#9ca3af'); R(cx+18,by-4,4,6,'#9ca3af');
  EL(cx,by-28,26,26,'#1f2937'); EL(cx,by-28,23,23,'#b91c1c'); EL(cx,by-28,20,20,'#f1f5f9'); EL(cx,by-28,20,20,'rgba(148,163,184,.25)'); EL(cx,by-30,16,16,'#f8fafc');
  for(let k=0;k<8;k++){ const a=k/8*6.283; R(cx+Math.cos(a)*24-1.5,by-28+Math.sin(a)*24-1.5,3,3,'#cbd5e1'); }
  EL(cx-3,by-31,3.5,3.5,'#ef4444'); EL(cx+3,by-31,3.5,3.5,'#ef4444');
  ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.moveTo(cx-6.5,by-29.5); ctx.lineTo(cx+6.5,by-29.5); ctx.lineTo(cx,by-22); ctx.fill();
  // ทอมบนกลองใหญ่
  LN(cx,by-54,cx,by-62,'#9ca3af',2);
  [-11,11].forEach(o=>{ R(cx+o-8,by-62,16,10,'#b91c1c'); R(cx+o-8,by-62,16,2,'#fca5a5'); EL(cx+o,by-62,8,3,'#f1f5f9'); EL(cx+o,by-52,8,3,'#7f1d1d'); });
  // ทอมพื้น
  LN(cx+24,by-8,cx+24,by,'#9ca3af',2); LN(cx+44,by-8,cx+44,by,'#9ca3af',2);
  EL(cx+34,by-8,12,3,'#7f1d1d'); R(cx+22,by-24,24,16,'#b91c1c'); R(cx+22,by-24,24,2,'#fca5a5'); EL(cx+34,by-24,12,4,'#f8fafc');
  // กลองสแนร์ + ขาตั้ง
  LN(cx-24,by-14,cx-24,by-2); LN(cx-24,by-6,cx-33,by+1); LN(cx-24,by-6,cx-15,by+1);
  EL(cx-24,by-16,10,3,'#94a3b8'); R(cx-34,by-26,20,10,'#e5e7eb'); R(cx-34,by-26,20,2,'#fff'); R(cx-34,by-18,20,2,'#94a3b8'); EL(cx-24,by-26,10,3,'#fff');
  LN(cx-31,by-29,cx-19,by-26,'#d6b27a',1.5); LN(cx-29,by-27,cx-17,by-29,'#d6b27a',1.5);
}

// ชั้นหนังสือ ชิดผนังบน
function drawBookshelf(){
  const x=10.7*T_, y=1.05*T_, w=3.6*T_, h=2.4*T_;
  R(x+4,y+6,w,h,'rgba(0,0,0,.45)');
  R(x,y,w,h,'#4a2e1c'); R(x+3,y+3,w-6,h-6,'#2b180d'); R(x,y,w,3,'#9a6b46');
  const cols=['#ef4444','#38bdf8','#fde047','#a78bfa','#34d399','#fb923c','#f472b6','#e2e8f0'];
  const rows=3, rh=(h-8)/rows;
  for(let r=0;r<rows;r++){
    const sy=y+4+r*rh;
    R(x+3,sy+rh-3,w-6,3,'#6b4630');
    let bx=x+6, i=r*5;
    while(bx<x+w-12){
      if(r===1 && bx>x+w*.55 && bx<x+w*.55+8){
        EL(bx+12,sy+rh-10,9,6,'#2f86ad'); R(bx+19,sy+rh-16,5,6,'#2f86ad'); R(bx+6,sy+rh-12,2,2,'#04202e');
        bx+=28; continue;
      }
      const bw=4+((i*7)%5), bh=rh-8-((i*3)%6);
      R(bx,sy+rh-3-bh,bw,bh,cols[i%cols.length]); R(bx,sy+rh-3-bh,1,bh,'rgba(255,255,255,.3)');
      bx+=bw+1; i++;
    }
  }
}

// บีนแบ็ก
function drawBeanbag(){
  const cx=12.6*T_, cy=14.9*T_;
  EL(cx+4,cy+20,34,8,'rgba(0,0,0,.4)');
  EL(cx,cy,32,24,'#7c6bd6'); EL(cx-8,cy-9,17,9,'#a79bf0'); EL(cx+7,cy+3,13,8,'#6a59c4');
  ctx.strokeStyle='rgba(40,25,110,.45)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(cx-24,cy-8); ctx.quadraticCurveTo(cx,cy+6,cx+24,cy-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx,cy-22); ctx.quadraticCurveTo(cx+6,cy,cx,cy+22); ctx.stroke();
  // หมอนดาวบนบีนแบ็ก
  R(cx+10,cy-12,14,14,'#fde047'); R(cx+12,cy-10,10,10,'#fef08a'); R(cx+16,cy-6,2,2,'#f59e0b');
}

// โคมไฟตั้งพื้น
function drawFloorLamp(){
  const x=20.3*T_, y0=11.3*T_;
  EL(x+2,y0+3,12,4,'rgba(0,0,0,.4)'); EL(x,y0,11,4,'#111827'); EL(x,y0-1,9,3,'#1f2937');
  R(x-1,y0-86,3,86,'#4b5563'); R(x-1,y0-86,1,86,'#9ca3af');
  ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.moveTo(x-17,y0-68); ctx.lineTo(x+17,y0-68); ctx.lineTo(x+11,y0-94); ctx.lineTo(x-11,y0-94); ctx.fill();
  R(x-17,y0-70,34,3,'#f59e0b'); R(x-11,y0-95,22,3,'#fbbf24'); R(x-8,y0-90,3,18,'rgba(255,255,255,.45)');
  glow(x,y0-80,60,'rgba(253,230,138,.35)');
}

// ของตกแต่งบนผนัง: ไฟประดับ + นาฬิกา
function drawWallDeco(){
  // ไฟสายยาว (fairy lights)
  const cols=['253,224,71','244,114,182','110,231,183','125,211,252'];
  for(let seg=0;seg<4;seg++){
    const x0=1.4*T_+seg*5.8*T_, x1=x0+5.8*T_, mid=(x0+x1)/2;
    ctx.strokeStyle='rgba(15,10,5,.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x0,5); ctx.quadraticCurveTo(mid,25,x1,5); ctx.stroke();
    for(let k=1;k<9;k++){
      const t=k/9, bx=(1-t)*(1-t)*x0+2*(1-t)*t*mid+t*t*x1, by=(1-t)*(1-t)*5+2*(1-t)*t*25+t*t*5;
      const c=cols[(k+seg)%4], tw=.55+.45*Math.sin(T/14+k*1.7+seg);
      glow(bx,by+3,9,`rgba(${c},${.45*tw})`); R(bx-1.5,by,3,4,`rgba(${c},${.6+.4*tw})`);
    }
  }
  // นาฬิกาติดผนัง
  const cx=7.6*T_, cy=11, d=new Date(), mA=d.getMinutes()/60*6.283-1.571, hA=((d.getHours()%12)+d.getMinutes()/60)/12*6.283-1.571;
  EL(cx,cy,10,10,'#2b180d'); EL(cx,cy,8,8,'#f1f5f9');
  for(let k=0;k<4;k++) R(cx+Math.cos(k*1.571)*6-.5,cy+Math.sin(k*1.571)*6-.5,1,1,'#334155');
  LN(cx,cy,cx+Math.cos(hA)*4,cy+Math.sin(hA)*4,'#111827',1.5); LN(cx,cy,cx+Math.cos(mA)*6,cy+Math.sin(mA)*6,'#111827',1);
}

// ของจุกจิกทั่วห้องให้ดูมีชีวิต
function drawClutter(){
  // บนโต๊ะ: กระบอกดินสอ + แก้วกาแฟ + โน้ตแปะจอ
  R(5.3*T_,1.15*T_+6,10,13,'#f43f5e'); R(5.3*T_,1.15*T_+6,10,2,'#fda4af');
  LN(5.3*T_+3,1.15*T_+6,5.3*T_+1,1.15*T_-6,'#fde047',2); LN(5.3*T_+6,1.15*T_+6,5.3*T_+8,1.15*T_-4,'#38bdf8',2); LN(5.3*T_+8,1.15*T_+6,5.3*T_+12,1.15*T_-2,'#4ade80',2);
  R(9.5*T_,2.9*T_,11,10,'#f8fafc'); R(9.5*T_+11,2.9*T_+2,4,5,'#f8fafc'); R(9.5*T_+2,2.9*T_+2,7,3,'#78350f');
  const mx=1.15*T_, my=4.3*T_;
  R(mx-1,my+2,5,5,'#fde047'); R(mx+70,my+8,5,5,'#f9a8d4'); R(mx+68,my+30,5,5,'#86efac');
  // บนพรม: หนังสือเปิด + แก้วมีไอน้ำ + เบาะกลม
  const rx=9*T_, ry=4.8*T_, rw=9*T_, rh=4.5*T_;
  R(rx+46,ry+rh-44,30,18,'#0b0f17'); R(rx+48,ry+rh-42,13,14,'#e5e7eb'); R(rx+62,ry+rh-42,13,14,'#f1f5f9'); R(rx+61,ry+rh-42,2,14,'#94a3b8');
  for(let k=0;k<3;k++){ R(rx+50,ry+rh-39+k*4,9,1,'#94a3b8'); R(rx+64,ry+rh-39+k*4,9,1,'#94a3b8'); }
  EL(rx+rw-72,ry+40,10,6,'#0b0f17'); EL(rx+rw-72,ry+37,9,5,'#f8fafc'); EL(rx+rw-72,ry+37,6,3,'#78350f');
  for(let k=0;k<2;k++){ const ph=(T/40+k*.5)%1; R(rx+rw-74+k*5+Math.sin(T/10+k)*2,ry+30-ph*18,2,3,`rgba(255,255,255,${.5*(1-ph)})`); }
  EL(rx+rw*.72,ry+rh*.72,20,12,'#fb7185'); EL(rx+rw*.72-4,ry+rh*.72-4,10,5,'#fda4af');
  // ตะกร้าผ้า
  const bx=10.3*T_, by=18.8*T_;
  R(bx+2,by+36,34,4,'rgba(0,0,0,.35)');
  R(bx+2,by-4,10,12,'#38bdf8'); R(bx+14,by-8,12,14,'#f9a8d4'); R(bx+24,by-3,10,10,'#fde047');
  R(bx,by+4,36,34,'#a16207'); R(bx,by+4,36,3,'#ca8a04');
  for(let k=0;k<5;k++) R(bx,by+10+k*6,36,1,'#713f12'); for(let k=0;k<4;k++) R(bx+6+k*8,by+4,1,34,'#713f12');
  // รองเท้าผ้าใบ 1 คู่
  [[11.9*T_,20.3*T_],[12.5*T_,20.3*T_]].forEach(([sx,sy],k)=>{
    R(sx,sy+3,15,5,'#e5e7eb'); R(sx,sy+7,15,2,'#64748b'); R(sx+9,sy-1,6,5,'#f43f5e'); R(sx+1,sy,4,3,'#cbd5e1');
  });
  // สเกตบอร์ดพิงตู้เสื้อผ้า
  ctx.save(); ctx.translate(20.7*T_,16.1*T_); ctx.rotate(.1);
  R(-6,-44,12,88,'#0f172a'); R(-6,-44,12,3,'#475569'); R(-6,-8,12,10,'#f43f5e'); R(-6,12,12,6,'#38bdf8'); R(-5,-30,3,10,'#fde047');
  R(-9,-36,4,7,'#e5e7eb'); R(5,-36,4,7,'#e5e7eb'); R(-9,28,4,7,'#e5e7eb'); R(5,28,4,7,'#e5e7eb');
  ctx.restore();
}

function drawBedroom(){
  const W=COLS*TILE, H=ROWS*TILE;
  R(0,0,W,H,'#0d1018');
  for(let c=0;c<COLS;c++){ R(c*TILE,0,TILE,TILE,c%2?'#1a2030':'#151a28'); R(c*TILE+14,0,4,TILE,'rgba(255,255,255,.03)'); }
  R(0,TILE-10,W,10,'#0a0d14');
  neon(0,TILE-9,W,3,.75+.25*Math.sin(T/30));
  drawPoster(2.6*T_,'#16a34a'); drawPoster(4.4*T_,'#0ea5e9'); drawPoster(10.4*T_,'#22c55e'); drawPoster(12.6*T_,'#a855f7'); drawPoster(20.4*T_,'#0ea5e9'); drawPoster(22*T_,'#16a34a');
  R(TILE-3,TILE,3,(ROWS-2)*TILE,'#05070b'); R((COLS-1)*TILE,TILE,3,(ROWS-2)*TILE,'#05070b'); R(TILE,(ROWS-1)*TILE-3,(COLS-2)*TILE,3,'#05070b');
  // พื้นไม้
  ctx.drawImage(getWoodFloor(),0,0);
  // หน้าต่าง 3 บาน
  drawWindow(0,6.5*T_,T_,7*T_,1,{x:16,y:6.5*T_+34});
  drawWindow(25*T_,2*T_,T_,7*T_,2,null);
  drawWindow(4.2*T_,21*T_,7*T_,T_,3,null); drawWindow(18.4*T_,21*T_,6*T_,T_,3,null);
  // พรมกลางห้อง
  const rx=9*T_, ry=4.8*T_, rw=9*T_, rh=4.5*T_;
  R(rx,ry,rw,rh,'#0b0f17'); R(rx+6,ry+6,rw-12,rh-12,'#111826');
  ctx.strokeStyle=`rgba(34,197,94,${.7+.2*Math.sin(T/25)})`; ctx.lineWidth=2; ctx.strokeRect(rx+10,ry+10,rw-20,rh-20);
  for(let i=0;i<5;i++){ const dx=rx+rw/2-48+i*24, dy=ry+rh/2; ctx.fillStyle=i%2?'#15803d':'#14532d'; ctx.beginPath(); ctx.moveTo(dx,dy-12); ctx.lineTo(dx+10,dy); ctx.lineTo(dx,dy+12); ctx.lineTo(dx-10,dy); ctx.fill(); }
  for(let x=rx;x<rx+rw;x+=6){ R(x,ry-4,2,4,'#1f2937'); R(x,ry+rh,2,4,'#1f2937'); }
  drawWallDeco();
  // เฟอร์นิเจอร์ตามแปลน
  drawDesk(); drawBed();
  woodTop(13.2*T_,18*T_,4*T_,3*T_,'#262c3c','#414a62','#10131b');
  drawWardrobe(); drawDumbbell(); drawPlant(); drawBookshelf(); drawBeanbag(); drawFloorLamp(); drawGuitar(); drawDrums(); drawClutter();
}

// ของที่โต้ตอบได้
function drawObject(o){
  const x=o.x,y=o.y,w=o.w,h=o.h, near=(activeObject===o);
  if(o.id==='lighthouseDesk'){
    R(x+20,y+34,34,5,'rgba(0,0,0,.4)');
    R(x+30,y+2,14,6,'#f43f5e'); R(x+28,y+8,18,10,'#e5e7eb'); R(x+26,y+18,22,10,'#f43f5e'); R(x+24,y+28,26,6,'#e5e7eb');
    R(x+30,y-6,14,8,'#bbf7d0'); R(x+28,y-10,18,4,'#0b0e14');
    const beamA=.5+.5*Math.sin(T/14); glow(x+37,y-2,46,`rgba(187,247,208,${.25+.3*beamA})`);
    ctx.fillStyle=`rgba(187,247,208,${.1+.15*beamA})`; ctx.beginPath(); ctx.moveTo(x+44,y-2); ctx.lineTo(x+90,y-14); ctx.lineTo(x+90,y+10); ctx.fill();
  }
  else if(o.id==='constellationBook'){
    const yy=y+10;
    R(x+4,yy+16,58,26,'rgba(0,0,0,.35)');
    R(x+6,yy+12,52,24,'#0f1535'); R(x+8,yy+14,24,20,'#a5b4fc'); R(x+32,yy+14,24,20,'#c7d2fe'); R(x+31,yy+14,2,20,'#4f46e5');
    [[14,20],[20,26],[26,19],[38,22],[46,18],[50,28]].forEach(([a,b],i)=>R(x+a,yy+b,2,2,i%2?'#4ade80':'#4338ca'));
    ctx.strokeStyle='#4f46e5'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+15,yy+21); ctx.lineTo(x+21,yy+27); ctx.lineTo(x+27,yy+20); ctx.stroke();
    const tw=.5+.5*Math.sin(T/10); R(x+30,yy+4-tw*4,2,2,'#bbf7d0'); R(x+22,yy+6-tw*3,2,2,'#bbf7d0'); R(x+40,yy+8-tw*5,2,2,'#bbf7d0');
    glow(x+32,yy+10,40,`rgba(165,180,252,${.18+.12*tw})`);
  }
  else if(o.id==='submarineRadio'){
    R(x+4,y+38,58,5,'rgba(0,0,0,.4)');
    R(x+6,y+8,52,32,'#3b4558'); R(x+6,y+8,52,4,'#64748b'); R(x+8,y+12,52,2,'#1f2937');
    R(x+10,y+16,24,18,'#05070b'); for(let i=0;i<6;i++) R(x+12,y+18+i*3,20,1,'#1f3a2a');
    ctx.fillStyle='#10131b'; ctx.beginPath(); ctx.arc(x+44,y+20,6,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(x+44,y+32,5,0,7); ctx.fill();
    R(x+43,y+16,2,5,'#4ade80');
    R(x+34,y+2,14,6,'#86efac'); R(x+40,y-2,4,4,'#86efac'); R(x+36,y+4,3,3,'#38bdf8');
    for(let i=0;i<3;i++){ const ph=(T/30+i*.33)%1; ctx.fillStyle=`rgba(134,239,172,${1-ph})`; ctx.font='12px serif'; ctx.fillText(i%2?'♪':'♫',x+56+i*4,y-ph*30+6); }
  }
  else if(o.id==='vanityMirror'){
    R(x+10,y-6,46,48,'#0b0e14');
    const g=ctx.createLinearGradient(x,y,x+54,y+40); g.addColorStop(0,'#7dd3fc'); g.addColorStop(.5,'#e0f2fe'); g.addColorStop(1,'#60a5fa');
    ctx.fillStyle=g; ctx.fillRect(x+14,y-2,38,40);
    R(x+18,y+2,4,18,'rgba(255,255,255,.7)');
    for(let i=0;i<7;i++){ const on=.6+.4*Math.sin(T/12+i); R(x+8+i*8,y-12,4,4,`rgba(74,222,128,${on})`); R(x+8,y+i*6-8,4,4,`rgba(74,222,128,${on})`); R(x+54,y+i*6-8,4,4,`rgba(74,222,128,${on})`); }
  }
  else if(o.id==='guitarMinigame'){
    for(let k=0;k<3;k++){ const ph=(T/45+k*.33)%1; ctx.fillStyle=`rgba(253,224,71,${.9*(1-ph)})`; ctx.font='13px serif'; ctx.fillText(k%2?'♪':'♫',x+30+k*9+Math.sin(T/9+k)*3,y-6-ph*34); }
  }
  else if(o.isDoor){
    const open=solvedCount>=4;
    const DH=T_+10, half=w/2;
    // ช่องประตู (ด้านหลังบานประตู)
    R(x-9,0,w+18,DH+6,'#2b180d');
    if(open){
      R(x,0,w,DH,'#fff3c4');
      glow(x+half,18,110,'rgba(255,240,190,.65)');
      for(let i=0;i<8;i++) R(x+14+i*(w-28)/8,2,5,DH-2,`rgba(255,255,255,${.35+.25*Math.sin(T/10+i)})`);
      // บานประตูเปิดแง้มเห็นแค่ด้านข้าง
      [[x,-1],[x+w,1]].forEach(([px,sg])=>{
        R(sg<0?px:px-12,0,12,DH,'#7a4a28'); R(sg<0?px:px-12,0,12,2,'#a8744a'); R(sg<0?px+10:px-12,0,2,DH,'#3d2415');
        R(sg<0?px+3:px-9,12,6,16,'#8a5a36');
      });
    } else {
      // บานประตูไม้คู่
      [[x,0],[x+half,1]].forEach(([lx,k])=>{
        R(lx,0,half,DH,'#8a5a36');
        for(let i=0;i<half;i+=7) R(lx+i+((k*3)%4),2,1,DH-4,'rgba(50,25,10,.22)');          // ลายเสี้ยนไม้
        R(lx,0,half,2,'#b0804f');                                                            // ขอบบนสว่าง
        R(lx+(k?half-2:0),0,2,DH,'rgba(30,15,5,.45)');                                       // ร่องข้างบาน
        // แผงบานประตู (panel นูน)
        R(lx+8,7,half-16,DH-17,'#6b4126'); R(lx+10,9,half-20,DH-21,'#9a6840');
        R(lx+10,9,half-20,2,'#bd8b5c'); R(lx+10,9,2,DH-21,'#b07c4f'); R(lx+10,DH-14,half-20,2,'#5b3519');
        R(lx+14,13,half-28,1,'rgba(40,20,8,.25)'); R(lx+14,19,half-28,1,'rgba(40,20,8,.2)');
      });
      R(x+half-1,0,2,DH,'#2b180d');                                                          // รอยต่อกลาง
      // บานพับทองเหลือง
      [x+1,x+w-5].forEach(hx=>{ [6,DH-14].forEach(hy=>{ R(hx,hy,4,8,'#d4a24c'); R(hx,hy,1,8,'#f3d58a'); }); });
      // ลูกบิด + แผ่นกุญแจ
      R(x+half-12,13,6,18,'#c99a3f'); R(x+half+6,13,6,18,'#c99a3f'); R(x+half-12,13,1,18,'#f3d58a');
      EL(x+half-9,30,4,4,'#e0b04f'); EL(x+half+9,30,4,4,'#e0b04f'); R(x+half-10,28,2,2,'rgba(255,255,255,.7)'); R(x+half+8,28,2,2,'rgba(255,255,255,.7)');
      R(x+half-4,16,8,13,'#b8862f'); EL(x+half,21,2.2,2.2,'#1a0f08'); R(x+half-.8,22,1.6,5,'#1a0f08');
      glow(x+half,22,26,`rgba(253,224,130,${.12+.06*Math.sin(T/20)})`);
    }
    // วงกบประตู + บัวหัวประตู
    R(x-9,0,9,DH+6,'#5b3a22'); R(x+w,0,9,DH+6,'#5b3a22');
    R(x-9,0,w+18,6,'#6b4630'); R(x-11,0,w+22,2,'#a8744a'); R(x-9,6,w+18,2,'#2b180d');
    R(x-9,0,2,DH+6,'#8a5a36'); R(x+w+7,0,2,DH+6,'#3d2415');
    // พรมเช็ดเท้า
    R(x+half-34,T_+14,68,11,'#4a3a22'); R(x+half-32,T_+16,64,7,'#8a7048');
    for(let i=0;i<16;i++) R(x+half-30+i*4,T_+16,2,7,i%2?'#6f5a38':'#a38a5c');
  }
  if(near){
    const b=Math.sin(T/6)*3; ctx.fillStyle='#fde68a'; ctx.beginPath();
    if(o.isDoor){ const ay=T_+40+b; ctx.moveTo(x+w/2-6,ay); ctx.lineTo(x+w/2+6,ay); ctx.lineTo(x+w/2,ay-10); }
    else { ctx.moveTo(x+w/2-6,y-18+b); ctx.lineTo(x+w/2+6,y-18+b); ctx.lineTo(x+w/2,y-8+b); }
    ctx.fill();
    ctx.strokeStyle='rgba(253,230,138,.9)'; ctx.lineWidth=2; ctx.setLineDash([4,4]); ctx.strokeRect(x-4,y-4,w+8,h+8); ctx.setLineDash([]);
  }
  if(o.solved){
    ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(x+w-4,y+2,9,0,7); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(x+w-8,y+2); ctx.lineTo(x+w-5,y+5); ctx.lineTo(x+w,y-2); ctx.stroke();
    glow(x+w/2,y+h/2,60,'rgba(253,230,138,.2)');
  }
}

// ================= Balcony (night) =================
function drawBalcony(){
  const hz=8*TILE, W=COLS*TILE;
  const g=ctx.createLinearGradient(0,0,0,hz+20);
  g.addColorStop(0,'#02040d'); g.addColorStop(.55,'#0b1a3a'); g.addColorStop(1,'#0f3b52');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,hz+20);
  // ออโรร่า
  for(let k=0;k<3;k++){
    ctx.fillStyle=`rgba(74,222,128,${.05+.03*k})`; ctx.beginPath(); ctx.moveTo(0,hz*.55);
    for(let x=0;x<=W;x+=16) ctx.lineTo(x,hz*(.28+.08*k)+Math.sin(x/70+T/90+k)*18);
    ctx.lineTo(W,hz*.6); ctx.closePath(); ctx.fill();
  }
  stars.forEach(s=>{ if(s.y<5.5*TILE) R(s.x,s.y,s.s,s.s,`rgba(255,255,255,${.35+.65*Math.abs(Math.sin(T/20+s.ph))})`); });
  for(let i=0;i<14;i++){ const st=stars[i]; if(st.y<5.5*TILE){ const a=.3+.6*Math.abs(Math.sin(T/18+st.ph)); R(st.x-3,st.y,7,1,`rgba(220,235,255,${a})`); R(st.x,st.y-3,1,7,`rgba(220,235,255,${a})`); } }
  if(!window._shoot && Math.random()<.004) window._shoot={x:W*.35+Math.random()*W*.6,y:10+Math.random()*80,life:1};
  if(window._shoot){ const sh=window._shoot; const gx=ctx.createLinearGradient(sh.x,sh.y,sh.x+60,sh.y-24); gx.addColorStop(0,`rgba(255,255,255,${sh.life})`); gx.addColorStop(1,'rgba(255,255,255,0)');
    ctx.strokeStyle=gx; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sh.x,sh.y); ctx.lineTo(sh.x+60,sh.y-24); ctx.stroke();
    sh.x-=7; sh.y+=2.8; sh.life-=.025; if(sh.life<=0) window._shoot=null; }
  // พระจันทร์
  glow(21*TILE,3.2*TILE,200,'rgba(226,232,240,.32)');
  if(!window._moon){ const m=document.createElement('canvas'); m.width=64; m.height=64; const mc=m.getContext('2d');
    mc.fillStyle='#e2e8f0'; mc.beginPath(); mc.arc(32,32,26,0,7); mc.fill();
    mc.globalCompositeOperation='destination-out'; mc.beginPath(); mc.arc(43,26,23,0,7); mc.fill(); window._moon=m; }
  ctx.drawImage(window._moon,21*TILE-32,3.2*TILE-32);
  [[3,2.2],[8,4.4],[16,5.8]].forEach(([cx,cy],i)=>{
    const x=(cx*TILE+T*.12+i*90)%(W+100)-40;
    ctx.fillStyle='rgba(100,116,139,.28)'; ctx.beginPath(); ctx.ellipse(x,cy*TILE,30,9,0,0,7); ctx.ellipse(x+18,cy*TILE-5,20,9,0,0,7); ctx.fill();
  });
  const sg=ctx.createLinearGradient(0,hz-6,0,hz+22); sg.addColorStop(0,'#0f3b52'); sg.addColorStop(1,'#031c26');
  ctx.fillStyle=sg; ctx.fillRect(0,hz-6,W,28);
  for(let i=0;i<28;i++) R((i*28+T*.5)%W,hz-2+(i%4)*5,14,2,'rgba(186,230,253,.35)');
  for(let i=0;i<9;i++) R(21*TILE-14+Math.sin(T/15+i)*6-i,hz-4+i*3,28+i*2,2,`rgba(226,232,240,${.5-i*.05})`);
  // วาฬเรืองแสง
  const wx=13*TILE+Math.sin(T/60)*40, wy=4.6*TILE+Math.sin(T/30)*8;
  glow(wx,wy,150,'rgba(56,189,248,.22)');
  ctx.save(); ctx.translate(wx,wy);
  ctx.fillStyle='#2f9fd0'; ctx.beginPath(); ctx.ellipse(0,0,62,26,0,0,7); ctx.fill();
  ctx.fillStyle='#d3effa'; ctx.beginPath(); ctx.ellipse(-4,10,52,12,0,0,Math.PI); ctx.fill();
  ctx.fillStyle='#2f9fd0'; ctx.beginPath(); ctx.moveTo(56,-4); ctx.quadraticCurveTo(80,-20,86,-34); ctx.quadraticCurveTo(74,-8,86,4); ctx.quadraticCurveTo(70,12,56,6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10,14); ctx.lineTo(-28,34); ctx.lineTo(6,20); ctx.fill();
  R(-44,-6,5,5,'#04202e'); R(-45,-7,2,2,'#fff');
  for(let i=0;i<3;i++){ const ph=(T/30+i/3)%1; ctx.fillStyle=`rgba(186,230,253,${1-ph})`; ctx.fillRect(-14+i*3,-26-ph*26,3,3); ctx.fillRect(-18+i*6,-30-ph*20,2,2); }
  ctx.restore();
  // ระเบียง
  for(let r=8;r<ROWS;r++) for(let c=0;c<COLS;c++){
    R(c*TILE,r*TILE,TILE,TILE,(c+r)%2?'#1d2332':'#232a3b'); R(c*TILE,r*TILE+TILE-2,TILE,2,'#0b0e14'); R(c*TILE+TILE-2,r*TILE,2,TILE,'#0b0e14');
  }
  R(0,8*TILE-6,W,6,'#05070b'); for(let c=0;c<COLS*2;c++) R(c*16+6,8*TILE,4,TILE*.8,'#10141d');
  for(let i=0;i<26;i++){ const x=i*TILE+16, on=.5+.5*Math.sin(T/15+i); glow(x,8*TILE+6,16,`rgba(74,222,128,${.4*on})`); R(x-2,8*TILE+2,5,6,['#4ade80','#a7f3d0','#fde68a'][i%3]); }
  R(10.5*TILE,9.6*TILE,5*TILE,4.4*TILE,'#0f3d36'); ctx.strokeStyle='#fde68a'; ctx.lineWidth=2; ctx.strokeRect(10.5*TILE+6,9.6*TILE+6,5*TILE-12,4.4*TILE-12);
  [[2,'#22c55e'],[3,'#38bdf8'],[23,'#a3e635'],[24,'#c084fc']].forEach(([cx,c],i)=>{
    const bx=cx*TILE, by=13*TILE+Math.sin(T/25+i)*5;
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,by+16); ctx.lineTo(bx,17*TILE); ctx.stroke();
    ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(bx,by,11,14,0,0,7); ctx.fill(); R(bx-4,by-8,3,5,'rgba(255,255,255,.5)');
  });
}
function drawCake(o){
  const x=o.x,y=o.y;
  glow(x+32,y+20,100,'rgba(253,224,71,.35)');
  R(x+4,y+54,56,6,'rgba(0,0,0,.4)');
  R(x+2,y+42,60,14,'#f9a8d4'); R(x+2,y+42,60,4,'#fff'); R(x+10,y+26,44,18,'#fda4af'); R(x+10,y+26,44,4,'#fff');
  for(let i=0;i<6;i++){ R(x+6+i*10,y+46,3,6+(i%2)*3,'#fff'); }
  [0,1,2].forEach(i=>{ R(x+18+i*14,y+14,5,12,['#38bdf8','#fbbf24','#a855f7'][i]);
    if(!candlesBlown){ const f=Math.sin(T/5+i)*1.5; ctx.fillStyle='#fde047'; ctx.beginPath(); ctx.ellipse(x+20.5+i*14,y+9+f/2,3,5,0,0,7); ctx.fill(); ctx.fillStyle='#fb923c'; ctx.beginPath(); ctx.ellipse(x+20.5+i*14,y+11,1.6,3,0,0,7); ctx.fill(); glow(x+20+i*14,y+8,22,'rgba(253,224,71,.4)'); } });
  R(x+28,y+36,8,4,'#f43f5e'); R(x+26,y+34,4,4,'#f43f5e'); R(x+34,y+34,4,4,'#f43f5e');
  if(activeObject===o){ const b=Math.sin(T/6)*3; ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.moveTo(x+26,y-14+b); ctx.lineTo(x+38,y-14+b); ctx.lineTo(x+32,y-4+b); ctx.fill(); }
}

// ================= Character =================
function drawPlayer(){
  const p=player, x=0, y=0;
  ctx.save(); ctx.translate(Math.round(p.x),Math.round(p.y)); ctx.scale(2,2);
  const bob=p.moving?Math.abs(Math.sin(p.timer*.4))*-2:0, sw=p.moving?Math.sin(p.timer*.4)*3:0;
  R(x+2,y+24,18,5,'rgba(0,0,0,.5)');
  R(x+5,y+22+sw,5,5,'#0f172a'); R(x+13,y+22-sw,5,5,'#0f172a');
  R(x+4,y+26+sw,7,2,'#e2e8f0'); R(x+12,y+26-sw,7,2,'#e2e8f0');
  ctx.save(); ctx.translate(0,bob);
  // ฮู้ดดี้ดำ แถบเขียว
  R(x+2,y+11,18,12,'#2a3345'); R(x+2,y+11,18,3,'#3b475c'); R(x+2,y+19,18,2,'#1a2130');
  R(x+10,y+13,2,9,'#22c55e'); R(x+5,y+17,4,3,'#1a2130'); R(x+13,y+17,4,3,'#1a2130');
  R(x,y+12+(p.moving?sw/2:0),3,9,'#2a3345'); R(x+19,y+12-(p.moving?sw/2:0),3,9,'#2a3345');
  R(x,y+20,3,2,'#e0b894'); R(x+19,y+20,3,2,'#e0b894');
  R(x+4,y+1,14,12,'#e0b894');
  R(x+3,y-3,16,7,'#1c1917'); R(x+2,y-1,3,10,'#1c1917'); R(x+17,y-1,3,10,'#1c1917');
  if(p.dir==='up'){ R(x+3,y-3,16,14,'#1c1917'); }
  else {
    R(x+4,y+3,14,2,'#1c1917');
    const ex = p.dir==='left'?-1:p.dir==='right'?1:0;
    const blink = (T%180)<6;
    if(!blink){ R(x+7+ex,y+6,2,3,'#0b0e14'); R(x+13+ex,y+6,2,3,'#0b0e14'); R(x+7+ex,y+6,1,1,'#4ade80'); R(x+13+ex,y+6,1,1,'#4ade80'); } else { R(x+7+ex,y+8,3,1,'#0b0e14'); R(x+13+ex,y+8,3,1,'#0b0e14'); }
    R(x+10+ex,y+10,3,1,'#7c4a2d');
  }
  ctx.restore();
  ctx.restore();
}

// ================= Lighting (night) =================
// เลเยอร์แสงวาดที่ความละเอียด 1/4 (แสงเบลอๆ อยู่แล้ว ดูไม่ออกว่าต่าง) → เร็วขึ้นราว 16 เท่า
const LS=0.25, LW=Math.ceil(COLS*TILE*LS), LH=Math.ceil(ROWS*TILE*LS);
const darkLayer=document.createElement('canvas'); darkLayer.width=LW; darkLayer.height=LH;
const dctx=darkLayer.getContext('2d');
const glowLayer=document.createElement('canvas'); glowLayer.width=LW; glowLayer.height=LH;
const gctx=glowLayer.getContext('2d');

// แคชฉาก (ห้องนอน/ระเบียง) + แคชบรรยากาศกลางคืน — วาดใหม่ทุก CACHE_EVERY tick แล้ว blit ทุกเฟรม
const CACHE_EVERY=3;
const sceneCache=document.createElement('canvas'); sceneCache.width=COLS*TILE; sceneCache.height=ROWS*TILE;
const sceneCtx=sceneCache.getContext('2d',{alpha:false}); sceneCtx.imageSmoothingEnabled=false;
const moodCache=document.createElement('canvas'); moodCache.width=COLS*TILE; moodCache.height=ROWS*TILE;
const moodCtx=moodCache.getContext('2d');
let cacheT=-999, cacheScene=0;

// วิกเนตต์สร้างครั้งเดียว
const vignetteLayer=(()=>{
  const c=document.createElement('canvas'); c.width=COLS*TILE; c.height=ROWS*TILE; const x=c.getContext('2d');
  const W=c.width, H=c.height, vg=x.createRadialGradient(W/2,H/2,H*.38,W/2,H/2,H*.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(4,4,18,.55)');
  x.fillStyle=vg; x.fillRect(0,0,W,H); return c;
})();
// color grade สร้างครั้งเดียว (gradient ไม่เปลี่ยน)
const gradeGrad=(()=>{ const g=mainCtx.createLinearGradient(0,0,0,ROWS*TILE); g.addColorStop(0,'rgba(120,100,255,.28)'); g.addColorStop(1,'rgba(255,170,120,.22)'); return g; })();

const projStars=Array.from({length:110},(_,i)=>({x:TILE+Math.random()*(COLS-2)*TILE,y:TILE+Math.random()*(ROWS-2)*TILE,s:Math.random()<.3?2:1,ph:Math.random()*6,big:i<14,vx:-.03-Math.random()*.05}));
function beamAdd(pts,a){
  const g=ctx.createLinearGradient(pts[0][0],pts[0][1],pts[2][0],pts[2][1]);
  g.addColorStop(0,`rgba(170,205,255,${a})`); g.addColorStop(1,'rgba(170,205,255,0)');
  ctx.fillStyle=g; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
}
function drawNightMood(){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  beamAdd([[TILE,6.5*TILE],[TILE,13.5*TILE],[7*TILE,16.5*TILE],[7*TILE,8.5*TILE]],.20);
  beamAdd([[25*TILE,2*TILE],[25*TILE,9*TILE],[18.5*TILE,11.5*TILE],[18.5*TILE,3.5*TILE]],.20);
  beamAdd([[18.4*TILE,21*TILE],[24.4*TILE,21*TILE],[23.5*TILE,15.5*TILE],[19*TILE,15.5*TILE]],.12);
  beamAdd([[4.2*TILE,21*TILE],[11.2*TILE,21*TILE],[12*TILE,15.5*TILE],[4*TILE,15.5*TILE]],.12);
  // เนบิวลาจากโปรเจกเตอร์ดาว
  [[4,6,'99,102,241'],[20,5,'56,189,248'],[12,14,'217,119,166'],[16,8,'129,102,241'],[8,16,'251,191,119']].forEach(([cx,cy,c],i)=>{
    const x=cx*TILE+Math.sin(T/200+i)*34, y=cy*TILE+Math.cos(T/230+i)*26, r=190;
    const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(${c},.06)`); g.addColorStop(1,`rgba(${c},0)`);
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  });
  // ดาวลอยทั่วห้อง
  projStars.forEach(p=>{
    p.x+=p.vx; if(p.x<TILE) p.x=(COLS-1)*TILE;
    const a=.18+.4*Math.abs(Math.sin(T/25+p.ph));
    ctx.fillStyle=`rgba(205,228,255,${a})`; ctx.fillRect(p.x,p.y,p.s,p.s);
    if(p.big){ ctx.fillRect(p.x-3,p.y+(p.s-1)/2,p.s+6,1); ctx.fillRect(p.x+(p.s-1)/2,p.y-3,1,p.s+6); }
  });
  ctx.restore();
}
function getLights(){
  const L=[], pl=.5+.5*Math.sin(T/20);
  L.push({x:player.x+22,y:player.y+26,r:190,a:.6,col:'110,231,183',ca:.05});
  if(scene===1){
    L.push({x:3.2*TILE,y:5.8*TILE,r:340,a:.9,col:'34,197,120',ca:.15+.05*pl});
    L.push({x:7*TILE,y:2.6*TILE,r:120,a:.7,col:'187,247,208',ca:.12});
    L.push({x:TILE,y:10*TILE,r:240,a:.5,col:'147,197,253',ca:.12});
    L.push({x:25*TILE,y:5.5*TILE,r:240,a:.5,col:'147,197,253',ca:.12});
    L.push({x:7.7*TILE,y:21*TILE,r:190,a:.4,col:'147,197,253',ca:.10});
    for(let i=0;i<7;i++) L.push({x:(i*4+2)*TILE,y:TILE,r:110,a:.4,col:i%2?'45,212,191':'251,191,119',ca:.08});
    L.push({x:20.3*TILE,y:9.1*TILE,r:210,a:.8,col:'255,205,130',ca:.18});
    L.push({x:15.2*TILE,y:19.4*TILE,r:190,a:.85,col:'255,196,120',ca:.20+.03*Math.sin(T/9)});
    L.push({x:7*TILE,y:15*TILE,r:230,a:.55,col:'255,170,130',ca:.07});
    L.push({x:22*TILE,y:13*TILE,r:130,a:.6,col:'255,190,150',ca:.11});
    L.push({x:7*TILE,y:11.4*TILE,r:100,a:.55,col:'165,180,252',ca:.10});
    L.push({x:5.5*TILE,y:20.5*TILE,r:200,a:.35,col:'34,197,94',ca:.05});
    L.push({x:21*TILE,y:21*TILE,r:140,a:.3,col:'34,197,94',ca:.04});
    L.push({x:17.2*TILE,y:T_,r:(solvedCount>=4?240:110),a:(solvedCount>=4?.95:.5),col:(solvedCount>=4?'255,240,190':'255,190,120'),ca:(solvedCount>=4?.28:.08)});
  } else {
    L.push({x:10*TILE,y:11.7*TILE,r:230,a:.9,col:'253,224,71',ca:.14});
    L.push({x:21*TILE,y:3.2*TILE,r:200,a:.5,col:'226,232,240',ca:.05});
    L.push({x:13*TILE,y:8.2*TILE,r:330,a:.5,col:'74,222,128',ca:.05});
  }
  return L;
}
function applyLighting(){
  const W=canvas.width, H=canvas.height, base=scene===1?.64:.40;
  const L=getLights();
  // --- ชั้นมืด (ความละเอียดต่ำ) ---
  dctx.setTransform(1,0,0,1,0,0);
  dctx.globalCompositeOperation='source-over'; dctx.clearRect(0,0,LW,LH);
  dctx.fillStyle=`rgba(10,10,32,${base})`; dctx.fillRect(0,0,LW,LH);
  dctx.globalCompositeOperation='destination-out';
  dctx.setTransform(LS,0,0,LS,0,0);
  L.forEach(l=>{
    const g=dctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r); g.addColorStop(0,`rgba(0,0,0,${l.a})`); g.addColorStop(1,'rgba(0,0,0,0)');
    dctx.fillStyle=g; dctx.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);
  });
  // --- ชั้นสีเรืองแสง (ความละเอียดต่ำ) ---
  gctx.setTransform(1,0,0,1,0,0); gctx.clearRect(0,0,LW,LH);
  gctx.globalCompositeOperation='lighter';
  gctx.setTransform(LS,0,0,LS,0,0);
  L.forEach(l=>{
    if(!l.col) return;
    const g=gctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r); g.addColorStop(0,`rgba(${l.col},${l.ca})`); g.addColorStop(1,`rgba(${l.col},0)`);
    gctx.fillStyle=g; gctx.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);
  });
  // ขยายกลับขนาดจริงแบบ smooth
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(darkLayer,0,0,W,H);
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowLayer,0,0,W,H); ctx.restore();
  ctx.imageSmoothingEnabled=false;
  // บรรยากาศกลางคืน (ลำแสง/เนบิวลา/ดาว) — วาดลง cache ทุก CACHE_EVERY tick
  if(scene===1){
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.drawImage(moodCache,0,0); ctx.restore();
  }
  // color grade
  ctx.save(); ctx.globalCompositeOperation='soft-light'; ctx.fillStyle=gradeGrad; ctx.fillRect(0,0,W,H); ctx.restore();
  // vignette (แคชไว้)
  ctx.drawImage(vignetteLayer,0,0);
}

// วาดฉาก + บรรยากาศลง cache (เรียกไม่ถี่ทุกเฟรม)
function refreshSceneCache(){
  ctx=sceneCtx;
  sceneCtx.clearRect(0,0,sceneCache.width,sceneCache.height);
  if(scene===1) drawBedroom(); else drawBalcony();
  ctx=moodCtx;
  moodCtx.clearRect(0,0,moodCache.width,moodCache.height);
  if(scene===1){ const vx=projStars.map(p=>p.vx); projStars.forEach(p=>p.vx*=CACHE_EVERY); drawNightMood(); projStars.forEach((p,i)=>p.vx=vx[i]); }
  ctx=mainCtx;
  cacheT=T; cacheScene=scene;
}

// ================= Effects =================
function drawEffects(){
  applyLighting();
  dust.forEach(p=>{ p.y+=p.v; p.x+=Math.sin(T/40+p.ph)*.15; if(p.y<0){ p.y=canvas.height; p.x=Math.random()*canvas.width; }
    R(p.x,p.y,p.s,p.s,`rgba(254,243,199,${p.a*.7*(.5+.5*Math.sin(T/20+p.ph))})`); });
  for(let i=fireworks.length-1;i>=0;i--){
    const p=fireworks[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=.04; p.life-=.014;
    if(p.life<=0){ fireworks.splice(i,1); continue; }
    ctx.globalAlpha=p.life; R(p.x,p.y,4,4,p.color); R(p.x-p.vx*2,p.y-p.vy*2,2,2,p.color);
  }
  ctx.globalAlpha=1;
  for(let i=confetti.length-1;i>=0;i--){ const c=confetti[i]; c.y+=c.vy; c.x+=c.vx+Math.sin(c.y/20)*.5; if(c.y>canvas.height+10){ confetti.splice(i,1); continue; } R(c.x,c.y,c.s,c.s,c.c); }
}

// ================= Loop =================
// fixed timestep 60Hz: จอ 120/144Hz เกมไม่เร็วขึ้น และเฟรมตกก็ไม่ช้าลงจนผิดปกติ
const STEP=1000/60;
let lastTime=0, acc=0;
function loop(now){
  requestAnimationFrame(loop);
  if(!lastTime) lastTime=now;
  acc+=Math.min(now-lastTime,100); lastTime=now;
  if(acc<STEP-2) return; // เผื่อ jitter ของ rAF บนจอ 60Hz ไม่ให้ข้ามเฟรมมั่ว
  while(acc>=STEP-2){ T++; updatePlayer(); acc-=STEP; }
  if(document.hidden) return;

  // ฉากที่เปลี่ยนแอนิเมชันช้าๆ → วาดใหม่ทุก 3 tick (~20fps) แล้ว blit ทุกเฟรม
  if(cacheScene!==scene || T-cacheT>=CACHE_EVERY) refreshSceneCache();
  ctx.drawImage(sceneCache,0,0);

  if(scene===1) roomObjects.forEach(drawObject);
  else endingObjects.forEach(drawCake);
  drawPlayer();
  drawEffects();
}
window.onload=()=>requestAnimationFrame(loop);

$('audioToggleBtn').addEventListener('click',()=>{
  audio.muted=!audio.muted;
  $('audioToggleBtn').querySelector('i').className = audio.muted ? 'fa-solid fa-volume-xmark text-base text-stone-400' : 'fa-solid fa-volume-high text-base';
});
