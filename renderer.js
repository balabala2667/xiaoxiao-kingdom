import { BASES } from './core.js';
const palettes = { default: ['#3e7964','#9fb88c'], sun:['#bd8d38','#e7ce85'], violet:['#8862a0','#c8b0d9'], enemy:['#b76951','#dcb098'], ally:['#618aaa','#aec6d7'] };
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.skin='default';this.pet=null;}
 draw(battle,now){
  const {canvas,ctx:c}=this;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const dpr=Math.min(devicePixelRatio||1,2);const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  c.setTransform(w/1000,0,0,h/550,0,0);c.clearRect(0,0,1000,550);
  const bg=c.createLinearGradient(0,0,0,550);bg.addColorStop(0,'#d4e3b8');bg.addColorStop(1,'#bdd29d');c.fillStyle=bg;c.fillRect(0,0,1000,550);
  // Soft islands of grass, a meandering river, and sandy routes between kingdoms.
  this.oval(190,105,230,110,'#cadcae');this.oval(850,450,250,100,'#b8cf93');this.oval(750,40,210,70,'#c1d5a4');
  c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(570,-40);c.bezierCurveTo(470,100,660,160,550,295);c.bezierCurveTo(480,365,610,470,660,580);c.strokeStyle='#b3c99b';c.lineWidth=75;c.stroke();c.strokeStyle='#9fc6bf';c.lineWidth=57;c.stroke();c.strokeStyle='#b0d3c7';c.lineWidth=40;c.stroke();
  c.save();c.globalAlpha=.45;c.strokeStyle='#e8f4d8';c.lineWidth=2;for(let i=0;i<12;i++){const y=i*53+10,x=550+Math.sin(y/90)*29;c.beginPath();c.moveTo(x,y);c.lineTo(x+15,y);c.stroke();}c.restore();
  c.strokeStyle='#b1c28e';c.lineWidth=61;c.beginPath();c.moveTo(125,250);c.lineTo(875,250);c.stroke();c.lineWidth=56;c.strokeStyle='#e6d7a8';c.stroke();
  c.beginPath();c.moveTo(140,260);c.quadraticCurveTo(290,360,500,463);c.quadraticCurveTo(650,365,860,260);c.lineWidth=39;c.strokeStyle='#b0c18c';c.stroke();c.lineWidth=34;c.strokeStyle='#e2d4a6';c.stroke();
  for(let i=0;i<7;i++){c.fillStyle=i%2?'#b09a72':'#c3ad80';c.fillRect(536+i*9,219,8,62);}c.strokeStyle='#937e5b';c.lineWidth=5;c.beginPath();c.moveTo(534,220);c.lineTo(600,220);c.moveTo(534,279);c.lineTo(600,279);c.stroke();
  for(let i=0;i<95;i++){const x=(i*137+47)%1000,y=(i*79+25)%550;if(Math.abs(y-250)<45||Math.abs(y-(x<500?x*.57+173:-x*.57+744))<32)continue;c.strokeStyle=i%3?'#a8bf87':'#e4e9c1';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-5);c.moveTo(x,y);c.lineTo(x+3,y-6);c.stroke();}
  [[45,143,1],[265,98,.85],[321,143,.6],[725,100,.85],[944,146,1.2],[74,429,1.1],[155,464,.8],[870,447,1.2],[795,473,.7],[360,488,.65],[929,70,.6],[63,70,.6]].forEach(([x,y,s])=>this.tree(x,y,s));
  [[315,290],[695,190],[225,398],[770,350]].forEach(([x,y])=>{this.oval(x,y,13,5,'#a8bb89');this.oval(x,y-4,10,7,'#bac0a4');this.oval(x-3,y-7,5,3,'#d9dcc3');});
  if(battle.alliance){c.save();c.setLineDash([7,8]);c.strokeStyle='#779daa';c.lineWidth=2;c.beginPath();c.moveTo(160,294);c.lineTo(468,444);c.stroke();c.restore();}
  for(const side of ['player','enemy','ally']){const k=battle.kings[side];this.castle(k.x,k.y,side,k.lives,now);if(battle.time<k.immuneUntil||(side==='player'&&battle.time<battle.shieldUntil)){c.strokeStyle='#defbff';c.lineWidth=4;this.oval(k.x,k.y-30,67,84,'#b8edf125',true);} }
  [...battle.units].sort((a,b)=>a.y-b.y).forEach(u=>this.unit(u,now,battle.time<8));
  battle.effects.forEach(e=>{c.save();c.globalAlpha=Math.min(1,e.life*2);if(e.type==='star'){c.strokeStyle='#fff6a3';c.lineWidth=5;c.beginPath();c.moveTo(e.x+10,e.y-170);c.lineTo(e.x-7,e.y-65);c.lineTo(e.x+15,e.y-67);c.lineTo(e.x,e.y);c.stroke();}else if(e.type==='heal'){this.oval(e.x,e.y,80,50,'#c7ee8b66');}else{this.oval(e.x,e.y-9,(1-e.life)*17+3,(1-e.life)*17+3,e.type==='puff'?'#f8f3ce':'#fff9cc');}c.restore();});
  if(this.pet){const p=BASES.player;c.font='28px sans-serif';c.textAlign='center';c.fillText(this.pet==='fox'?'🦊':'🐢',p.x-53,p.y+34+Math.sin(now*2)*2);}
  c.textAlign='center';c.fillStyle='#5d7d68';c.font='12px "Microsoft YaHei", sans-serif';c.fillText(battle.kings.ally.lives===0?'蓝湾已撤退':battle.alliance?'蓝湾盟国 · 协防中':battle.allyHostile?'蓝湾王国 · 交战中':'蓝湾王国 · 中立',500,520);
 }
 oval(x,y,rx,ry,color,stroke=false){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke)c.stroke();}
 tree(x,y,s){const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);this.oval(0,5,22,7,'#799b6533');c.fillStyle='#8d9971';c.fillRect(-3,-20,6,28);this.oval(0,-27,21,24,'#73976a');this.oval(-5,-34,15,19,'#8eac77');this.oval(-8,-39,8,11,'#9db984');c.restore();}
 castle(x,y,side,lives,now){const c=this.ctx;const [dark,light]=palettes[side==='player'?this.skin:side];c.save();c.translate(x,y);if(side==='ally')c.scale(.75,.75);if(lives===0)c.globalAlpha=.35;
  this.oval(0,17,75,20,'#667b4c26');c.fillStyle='#aba891';c.fillRect(-60,-44,120,65);c.fillStyle='#e5debf';c.fillRect(-62,-58,124,64);c.fillStyle='#d3cbaa';c.fillRect(-56,6,112,11);
  c.fillStyle='#d9d2b1';c.fillRect(-23,-99,46,106);c.fillStyle='#eee7cb';c.fillRect(-26,-102,52,20);for(let i=0;i<4;i++)c.fillRect(-26+i*14,-112,8,13);
  for(const tx of [-53,53]){c.fillStyle='#eee7ca';c.fillRect(tx-15,-79,30,87);c.fillStyle='#c8c3a5';c.fillRect(tx+7,-72,8,80);c.fillStyle=dark;c.beginPath();c.moveTo(tx-23,-79);c.lineTo(tx,-114);c.lineTo(tx+23,-79);c.closePath();c.fill();c.fillStyle='#778875';c.fillRect(tx-4,-58,8,15);}
  c.fillStyle='#596955';c.beginPath();c.roundRect(-17,-28,34,44,[17,17,0,0]);c.fill();c.fillStyle='#8b9273';c.fillRect(-11,-13,22,27);c.strokeStyle='#515e4b';c.lineWidth=2;for(let i=-5;i<=5;i+=5){c.beginPath();c.moveTo(i,-12);c.lineTo(i,13);c.stroke();}
  c.fillStyle=light;c.fillRect(-13,-68,26,25);c.fillStyle=dark;c.font='20px serif';c.textAlign='center';c.fillText('♛',0,-48);
  c.strokeStyle='#8b8b68';c.lineWidth=3;c.beginPath();c.moveTo(0,-113);c.lineTo(0,-152);c.stroke();c.fillStyle=dark;c.beginPath();c.moveTo(1,-152);c.quadraticCurveTo(18,-156+Math.sin(now*2)*3,37,-147);c.lineTo(32,-130);c.quadraticCurveTo(13,-137,1,-132);c.closePath();c.fill();
  c.fillStyle='#eac06a';c.font='16px serif';c.textAlign='left';c.fillText('✦',8,-136);c.restore();
 }
 unit(u,now,still){const c=this.ctx;const [dark,light]=palettes[u.side==='player'?this.skin:u.side];const boss=u.type==='boss';const s=boss?1.8:.85;const bob=still?0:Math.sin(now*8+u.id)*1.5;c.save();c.translate(u.x,u.y);c.scale(s,s);this.oval(0,3,10,4,'#4255372b');c.translate(0,bob);c.strokeStyle='#5b6555';c.lineWidth=4;c.beginPath();c.moveTo(-4,-2);c.lineTo(-5,3);c.moveTo(4,-2);c.lineTo(5,3);c.stroke();c.fillStyle=dark;c.beginPath();c.roundRect(-8,-19,16,19,4);c.fill();this.oval(0,-24,7,8,'#edc79d');c.fillStyle=boss?'#645766':light;c.beginPath();c.arc(0,-26,9,Math.PI,Math.PI*2);c.lineTo(9,-23);c.lineTo(-9,-23);c.fill();c.fillStyle=dark;c.fillRect(-2,-38,4,6);c.fillStyle='#344739';c.fillRect(2,-25,2,2);
  if(u.type==='archer'){c.strokeStyle='#986e40';c.lineWidth=2;c.beginPath();c.arc(10,-12,11,-Math.PI/2,Math.PI/2);c.stroke();c.beginPath();c.moveTo(10,-23);c.lineTo(10,-1);c.stroke();}else{c.strokeStyle=boss?'#cec7da':'#e9e7d2';c.lineWidth=boss?5:3;c.beginPath();c.moveTo(12,-9);c.lineTo(15,-29);c.stroke();c.strokeStyle='#a69565';c.beginPath();c.moveTo(9,-13);c.lineTo(18,-13);c.stroke();this.oval(-9,-11,6,8,light);c.fillStyle=dark;c.fillRect(-10,-16,2,10);}
  if(u.hp<u.maxHp||boss){c.fillStyle='#68735455';c.fillRect(-13,-44,26,3);c.fillStyle=boss?'#925374':'#6aab72';c.fillRect(-13,-44,26*Math.max(0,u.hp/u.maxHp),3);}if(boss){c.fillStyle='#795768';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText('BOSS',0,-48);}c.restore();
 }
}
