// ================= Audio =================
class RetroSoundEngine {
  constructor(){ this.ctx=null; this.muted=false; }
  init(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); if(this.ctx.state==='suspended') this.ctx.resume(); }
  tone(type,f0,f1,dur,vol,delay=0){
    if(this.muted||!this.ctx) return;
    const t=this.ctx.currentTime+delay, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t);
    if(f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+dur);
  }
  playStep(){ this.tone('triangle',110,40,0.05,0.04); }
  playInteract(){ this.tone('square',300,600,0.15,0.06); }
  playSolve(){ [440,554.37,659.25,880].forEach((f,i)=>this.tone('sine',f,f,0.3,0.1,i*0.07)); }
  playUnlockDoor(){ this.tone('sawtooth',150,900,0.4,0.08); }
  playHappyBirthdayMelody(){
    const m=[[261.63,.2],[261.63,.2],[293.66,.4],[261.63,.4],[349.23,.4],[329.63,.8],[261.63,.2],[261.63,.2],[293.66,.4],[261.63,.4],[392,.4],[349.23,.8]];
    let d=0; m.forEach(([f,l])=>{ this.tone('square',f,f,l,0.07,d); d+=l+0.05; });
  }
}
const audio=new RetroSoundEngine();

