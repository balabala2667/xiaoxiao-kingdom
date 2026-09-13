import { Battle, ITEMS, REWARDS, newProfile, buy, bossReward, courseKey } from './core.js';
import { QuestionDeck } from './questions.js';
import { Renderer } from './renderer.js';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='little-kingdom-v1';
let storageWarning=false, store;
try { store=JSON.parse(localStorage.getItem(STORE)); } catch { storageWarning=true; }
if(!store || !Array.isArray(store.profiles) || !store.profiles.length) { const p=newProfile();store={version:1,active:p.id,profiles:[p]}; }
store.profiles=store.profiles.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').map(p=>{
 const base=newProfile(p.name); const merged={...base,...p,settings:{...base.settings,...p.settings}};
 for(const key of ['balance','total','beans','bosses','correct','answered','wins']) merged[key]=Number.isFinite(merged[key])?Math.max(0,Math.floor(merged[key])):0;
 merged.king=Math.max(1,Math.min(5,Number(merged.king)||1));merged.owned=Array.isArray(merged.owned)?merged.owned.filter(id=>ITEMS.some(i=>i.id===id)):['default'];
 if(!merged.owned.includes('default'))merged.owned.push('default');
 merged.mistakes=Array.isArray(merged.mistakes)?merged.mistakes.filter(q=>q&&typeof q.text==='string'&&Array.isArray(q.options)&&q.options.includes(q.answer)).slice(-100):[];
 merged.stages=merged.stages&&typeof merged.stages==='object'?merged.stages:{};
 if(!['1','2'].includes(merged.settings.grade))merged.settings.grade='1';if(!['1','2'].includes(merged.settings.semester))merged.settings.semester='1';
 if(!['math','chinese'].includes(merged.settings.subject))merged.settings.subject='math';if(!Object.hasOwn(REWARDS,merged.settings.difficulty))merged.settings.difficulty='easy';
 if(!['default','sun','violet'].includes(merged.skin)||!merged.owned.includes(merged.skin))merged.skin='default';if(!['fox','turtle'].includes(merged.pet)||!merged.owned.includes(merged.pet))merged.pet=null;
 return merged;
});
if(!store.profiles.length)store.profiles.push(newProfile());
let profile=store.profiles.find(p=>p.id===store.active)||store.profiles[0];store.active=profile.id;
let battle,deck,currentQuestion,running=false,paused=false,resultShown=false,answered=0,correct=0,earned=0,questionLocked=true,currentTab='battle',toastTimer,lastFrame=0,lastUI=0,sessionStage=1,reviewMode=false;
const renderer=new Renderer($('map'));
function save(){try{localStorage.setItem(STORE,JSON.stringify(store));}catch{if(!storageWarning){storageWarning=true;toast('浏览器未能保存进度，请检查存储空间或隐私设置。');}}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function log(text){$('battleLog').textContent='✦ '+text;}
function stage(){const value=Number(profile.stages[courseKey(profile.settings)]);return Number.isFinite(value)?Math.max(1,Math.floor(value)):1;}
function setPage(name){if(running&&name!=='battle'){toast('先完成本场守护，再前往其他营地。');return; }currentTab=name;document.querySelectorAll('.page').forEach(el=>el.hidden=el.id!==name);document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));if(name==='growth')renderShop();if(name==='rank')renderRank();if(name==='review')renderReview();}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setPage(b.dataset.tab));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setPage(b.dataset.open));
function setSettings(){for(const id of ['grade','semester','subject','difficulty'])$(id).value=profile.settings[id];}
for(const id of ['grade','semester','subject','difficulty'])$(id).onchange=()=>{profile.settings[id]=$(id).value;save();preview();};
function preview(){running=false;paused=false;questionLocked=true;currentQuestion=null;resultShown=false;answered=0;correct=0;earned=0;sessionStage=stage();battle=new Battle({stage:sessionStage,king:profile.king,pet:profile.pet,archer:profile.owned.includes('archer')});renderer.skin=profile.skin;renderer.pet=profile.pet;$('startButton').innerHTML='开始守护 <span>→</span>';$('startButton').disabled=false;$('answers').replaceChildren();$('feedback').textContent='';$('nextQuestion').hidden=true;$('questionText').innerHTML='用知识的力量，<br>召唤你的第一支军队。';$('questionHint').textContent='点击「开始守护」，答对一题召唤两只小兵。';$('topic').textContent='准备出发';$('mapBanner').hidden=false;updateUI();}
function updateUI(){
 document.body.classList.toggle('in-battle',running);
 const s=profile.settings;const gradeName=s.grade==='1'?'一年级':'二年级';const subjectName=s.subject==='math'?'数学':'语文';const difficultyName={easy:'简单',normal:'普通',nightmare:'噩梦'}[s.difficulty];
 $('playerName').textContent=profile.name;$('subjectBadge').textContent=s.subject==='math'?'数':'文';$('questionMeta').textContent=`${gradeName} · ${s.semester==='1'?'上册':'下册'} · ${subjectName} · ${difficultyName}`;
 $('rewardLabel').textContent=`✦ 答对 +${REWARDS[s.difficulty]} 积分`;
 $('stageTitle').textContent=`第 ${String(sessionStage).padStart(2,'0')} 关 · ${sessionStage%3===0?'巨岩试炼':['晨光草原','溪谷前哨','星光营地'][(sessionStage-1)%3]}`;
 $('balance').textContent=profile.balance.toLocaleString();$('kingLevel').textContent=`Lv. ${profile.king}`;$('petName').textContent=profile.pet==='fox'?'小赤狐':profile.pet==='turtle'?'小青龟':'尚未携带';$('beans').firstChild.textContent=profile.beans+' ';$('bossProgress').textContent=`Boss ${profile.bosses%2}/2`;
 for(const id of ['grade','semester','subject','difficulty'])$(id).disabled=running;
 $('profileButton').disabled=running;
 $('ourHearts').textContent=hearts(battle.kings.player.lives);$('enemyHearts').textContent=hearts(battle.kings.enemy.lives);$('allyHearts').textContent='生命 '+hearts(battle.kings.ally.lives);
 $('armyCount').textContent=`我方兵力 ${battle.units.filter(u=>u.side==='player').length} · 敌方 ${battle.units.filter(u=>u.side==='enemy').length}`;
 $('mapClock').textContent=`${String(Math.floor(battle.time/60)).padStart(2,'0')}:${String(Math.floor(battle.time%60)).padStart(2,'0')}`;
 $('bossStatus').textContent=sessionStage%3===0?({alive:'◆ Boss 在战场上',defeated:'✦ 本关 Boss 已击败',escaped:'Boss 突破后撤退 · 未获充能进度'}[battle.bossOutcome]):'每 3 关 · Boss 来袭';
 $('battleStatus').textContent=paused?'已暂停':running?'● 正在守护':battle.ended?(battle.ended==='win'?'守护成功':'国王已撤退'):'准备出征';$('battleStatus').classList.toggle('live',running&&!paused);
 $('pauseButton').disabled=!running;$('pauseButton').textContent=paused?'继续':'暂停';
 const base=9+sessionStage;
 $('questionCount').textContent=!running&&!battle.ended?`本关基础题量 ${base} 题`:answered>=base?`追加题 ${Math.max(1,answered-base+(questionLocked?0:1))} · 已答 ${answered} 题`:`题目 ${Math.min(answered+(questionLocked?0:1),base)} / ${base}`;
 $('correctCount').textContent=`答对 ${correct}`;$('questionProgress').style.width=`${Math.min(100,answered/base*100)}%`;
 for(const [id,field,owned] of [['heal','healReady','heal'],['shield','shieldReady','shield']]){const cd=Math.ceil(Math.max(0,battle[field]-battle.time));$(id+'Button').disabled=!running||paused||!profile.owned.includes(owned)||cd>0;$(id+'Time').textContent=!profile.owned.includes(owned)?'未解锁':cd?`${cd} 秒`:'就绪';}
 $('ultimateButton').disabled=!running||paused||profile.beans<1||battle.time<battle.ultimateReady;$('beanLabel').textContent=`${profile.beans} 颗豆`;
 $('allianceButton').disabled=!!battle.ended||battle.kings.ally.lives<=0||paused;$('allianceButton').textContent=battle.alliance?'解除联盟':'缔结联盟';
 $('supportButton').disabled=!running||paused||!battle.alliance||!battle.units.some(u=>u.side==='player'&&u.target!=='ally');
 $('attackAllyButton').disabled=!running||paused||battle.alliance||battle.time<battle.truceUntil||battle.kings.ally.lives<=0;
 $('allianceText').textContent=battle.kings.ally.lives<=0?'蓝湾国王已撤退，本关无法结盟。':battle.alliance?'盟友互不攻击。支援小兵会驻守蓝湾国王身边。':battle.time<battle.truceUntil?`休战保护中 · 还剩 ${Math.ceil(battle.truceUntil-battle.time)} 秒`:battle.allyHostile?'正在与蓝湾交战，重新结盟可结束冲突。':'结为盟友，互不攻击，携手保护国王。';
 $('speakButton').disabled=!currentQuestion||paused;
 if(paused){$('mapBanner').hidden=false;$('mapBanner').textContent='已暂停 · 准备好了再继续';}else if(running&&battle.time<8){$('mapBanner').hidden=false;$('mapBanner').textContent=`准备时间 ${Math.ceil(8-battle.time)} 秒 · 可以先答题召兵`;}else if(running){$('mapBanner').hidden=true;}else{$('mapBanner').hidden=false;$('mapBanner').textContent=battle.ended?(battle.ended==='win'?'守护成功！向下一站出发':'休整一下，再来挑战'):'知识准备就绪，王国等你出发';}
}
function hearts(lives){return Array.from({length:5},(_,i)=>i<lives?'♥':'♡').join(' ');}
function start(){
 if(running)return;const ally=battle&&!battle.ended&&battle.alliance;
 sessionStage=stage();battle=new Battle({stage:sessionStage,king:profile.king,pet:profile.pet,archer:profile.owned.includes('archer')});if(ally)battle.setAlliance(true);
 deck=new QuestionDeck(profile.settings);running=true;paused=false;answered=0;correct=0;earned=0;resultShown=false;$('startButton').textContent='正在守护';$('startButton').disabled=true;nextQuestion();log('8 秒准备时间，先答题召兵吧！');updateUI();
}
$('startButton').onclick=start;
function nextQuestion(){if(!running||paused)return;globalThis.speechSynthesis?.cancel();currentQuestion=deck.next();questionLocked=false;$('questionText').textContent=currentQuestion.text;$('questionHint').textContent=currentQuestion.review?'这是刚才的错题，再试一次。':'选出正确答案，为国王召唤援军。';$('topic').textContent=currentQuestion.topic;$('feedback').textContent='';$('feedback').className='feedback';$('nextQuestion').hidden=true;$('answers').replaceChildren();currentQuestion.options.forEach((answer,index)=>{const b=document.createElement('button');b.className='answer';b.innerHTML=`<span class="letter">${'ABCD'[index]}</span><span>${esc(answer)}</span>`;b.onclick=()=>answerQuestion(answer);$('answers').append(b);});updateUI();}
function answerQuestion(answer){
 if(!running||paused||questionLocked)return;questionLocked=true;answered++;profile.answered++;const right=answer===currentQuestion.answer;
 [...$('answers').children].forEach((b,i)=>{b.disabled=true;const value=currentQuestion.options[i];if(value===currentQuestion.answer)b.classList.add('correct');else if(value===answer)b.classList.add('wrong');});
 if(right){correct++;profile.correct++;const reward=REWARDS[profile.settings.difficulty];profile.balance+=reward;profile.total+=reward;earned+=reward;battle.spawn('player',2);$('feedback').textContent=`答对啦！+2 小兵，+${reward} 积分。${currentQuestion.explanation}`;log('援军已出发！两名小兵加入你的队伍。');}
 else{deck.retry(currentQuestion);$('feedback').classList.add('error');$('feedback').textContent=`再记一记：正确答案是「${currentQuestion.answer}」。${currentQuestion.explanation}`;log('这次没有召兵，读完解析后继续加油。');if(!profile.mistakes.some(q=>q.text===currentQuestion.text&&q.course===courseKey(profile.settings))){profile.mistakes.push({...currentQuestion,course:courseKey(profile.settings),settings:{...profile.settings}});profile.mistakes=profile.mistakes.slice(-100);}}
 $('nextQuestion').hidden=false;save();updateUI();
}
$('nextQuestion').onclick=nextQuestion;
$('speakButton').onclick=()=>{if(!currentQuestion||paused)return;if(!('speechSynthesis'in window)){toast('当前浏览器暂不支持朗读，请尝试系统浏览器。');return;}speechSynthesis.cancel();const q=currentQuestion;const spoken=new SpeechSynthesisUtterance(q.text.replace(/÷/g,'除以').replace(/×/g,'乘以').replace(/−/g,'减').replace(/\+/g,'加')+'。'+q.options.map((v,i)=>`${'ABCD'[i]}，${v}`).join('。'));spoken.lang='zh-CN';spoken.rate=.8;spoken.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')toast('朗读暂不可用，请检查设备的中文语音设置。');};speechSynthesis.speak(spoken);};
function togglePause(force){if(!running)return;paused=typeof force==='boolean'?force:!paused;if(paused)globalThis.speechSynthesis?.cancel();[...$('answers').children].forEach(b=>b.disabled=paused||questionLocked);$('nextQuestion').disabled=paused;updateUI();}
$('pauseButton').onclick=()=>togglePause();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused){togglePause(true);log('离开页面时已自动暂停，回来后点击继续。');}});
function processEvents(){for(const event of battle.events.splice(0)){if(event.type==='boss'){const bean=bossReward(profile);save();log(bean?'击败两只 Boss，获得一颗充能豆！':'Boss 已击败！再击败一只就能获得充能豆。');toast(bean?'获得充能豆 ×1':'Boss 击败进度 +1');}else if(event.type==='life')log(`${{player:'你的',enemy:'赤岩',ally:'蓝湾'}[event.side]}国王${event.lives?`剩余 ${event.lives} 条命，获得一名补偿小兵`:'已撤退'}。`);else log(event.text);}}
$('allianceButton').onclick=()=>{if(paused)return;if(battle.setAlliance(!battle.alliance)){processEvents();updateUI();}};
$('supportButton').onclick=()=>{if(!running||paused)return;const count=battle.support();if(count)log(`已派出 ${count} 名小兵，前往蓝湾国王身边协防。`);updateUI();};
$('attackAllyButton').onclick=()=>{if(!running||paused)return;if(battle.attackAlly()){log('已向蓝湾发起进攻，蓝湾守卫会反击。');updateUI();}};
$('healButton').onclick=()=>{if(running&&!paused&&profile.owned.includes('heal')&&battle.heal()){log('春风治疗！我方小兵恢复生命。');updateUI();}};
$('shieldButton').onclick=()=>{if(running&&!paused&&profile.owned.includes('shield')&&battle.shield()){log('守护结界展开！国王获得 8 秒保护。');updateUI();}};
$('ultimateButton').onclick=()=>{if(running&&!paused&&profile.beans>0&&battle.ultimate()){profile.beans--;processEvents();save();log('星光降临！对所有敌军造成范围伤害。');updateUI();}};
function endBattle(){if(resultShown)return;resultShown=true;running=false;paused=false;globalThis.speechSynthesis?.cancel();const win=battle.ended==='win';if(win){const bonus=50+sessionStage*5;profile.balance+=bonus;profile.total+=bonus;earned+=bonus;profile.wins++;profile.stages[courseKey(profile.settings)]=sessionStage+1;}save();questionLocked=true;[...$('answers').children].forEach(b=>b.disabled=true);$('nextQuestion').hidden=true;$('startButton').disabled=false;$('startButton').textContent=win?'下一关 →':'再次挑战 →';updateUI();
 openModal(`<span class="result-symbol">${win?'🏰':'🌱'}</span><div class="eyebrow" style="text-align:center">${win?'KINGDOM PROTECTED':'A NEW TRY AWAITS'}</div><h2 style="text-align:center">${win?'守护成功，勇士！':'休整一下，再出发。'}</h2><p style="text-align:center">${win?'国王为你的勇气与智慧喝彩。下一关多一道题，继续成长吧！':'国王已经安全撤退。试试更早召兵，或邀请蓝湾一起守护。'}</p><div class="result-stats"><div><strong>${correct}/${answered}</strong><small>答对题数</small></div><div><strong>+${earned}</strong><small>本场积分${win?'（含通关奖）':''}</small></div><div><strong>${answered?Math.round(correct/answered*100):0}%</strong><small>正确率</small></div></div><div class="modal-buttons"><button class="primary-button" id="resultNext">${win?'下一关 →':'再试一次 →'}</button><button class="light-button" id="resultCamp">前往成长营地</button><button class="light-button" id="resultClose">返回战场</button></div>`);
 $('resultNext').onclick=()=>{closeModal();start();};$('resultCamp').onclick=()=>{closeModal();setPage('growth');};$('resultClose').onclick=closeModal;
}
function renderShop(){ $('shopBalance').textContent=`✦ ${profile.balance} 积分`;$('shop').innerHTML=ITEMS.map(item=>{const owned=profile.owned.includes(item.id),equipped=item.type==='pet'?profile.pet===item.id:item.type==='skin'?profile.skin===item.id:false;const price=item.type==='king'?item.price*profile.king:item.price;const max=item.type==='king'&&profile.king>=5;const done=item.type==='unlock'&&owned;const text=max?'已达最高等级':done?'已解锁':equipped?(item.type==='pet'?'已携带 · 点击休息':'正在使用'):owned?'立即装备':`✦ ${price} 积分 · ${item.type==='king'?'升级':'兑换'}`;return `<article class="shop-card card"><div class="shop-art">${item.icon}</div><h3>${item.title}${item.type==='king'?` · Lv.${profile.king}`:''}</h3><p>${item.desc}</p><button class="${owned?'light':'primary'}-button" data-buy="${item.id}" ${max||done||(equipped&&item.type==='skin')||(!owned&&profile.balance<price)?'disabled':''}>${text}</button></article>`;}).join('');$('shop').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(running)return;if(buy(profile,b.dataset.buy)){save();toast('已更新王国装备，下场战斗生效。');renderShop();preview();}});}
function renderRank(){const sorted=[...store.profiles].sort((a,b)=>b.total-a.total);$('rankTable').innerHTML='<div class="rank-row heading"><span>排名</span><span>本机勇士</span><span>累计积分</span><span>胜场</span></div>'+sorted.map((p,i)=>`<div class="rank-row ${p.id===profile.id?'me':''}"><strong>${['🥇','🥈','🥉'][i]||i+1}</strong><span>${esc(p.name)} ${p.id===profile.id?'· 当前':''}</span><strong>${p.total.toLocaleString()}</strong><span>${p.wins}</span></div>`).join('');}
function renderReview(){const list=profile.mistakes;$('reviewList').innerHTML=list.length?list.map((q,i)=>`<article class="review-card card"><span class="topic">${esc(q.topic)} · ${q.settings?.grade||''} 年级</span><h3>${esc(q.text)}</h3><p>独立想一想，再选一次。</p><div>${q.options.map(o=>`<button class="light-button" data-review="${i}" data-option="${esc(o)}">${esc(o)}</button>`).join('')}</div><p class="review-feedback" aria-live="polite"></p></article>`).join(''):'<div class="card empty" style="grid-column:1/-1"><span>♧</span>这里还没有错题。<br>每一次认真思考，都在让你变强。</div>';$('reviewList').querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{const q=list[Number(b.dataset.review)],card=b.closest('article');if(b.dataset.option===q.answer){card.querySelector('.review-feedback').textContent='答对了！'+q.explanation;card.querySelectorAll('button').forEach(btn=>btn.disabled=true);const remove=document.createElement('button');remove.className='light-button';remove.textContent='已掌握，移出错题本';remove.onclick=()=>{profile.mistakes=profile.mistakes.filter(x=>x!==q);save();renderReview();};card.append(remove);}else{card.querySelector('.review-feedback').textContent='再试一次。提示：'+q.explanation;b.disabled=true;}});}
function openModal(html){$('modalContent').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
function closeModal(){$('modal').close();}
$('helpButton').onclick=()=>{if(running)togglePause(true);openModal(`<span class="eyebrow">勇士出征手册</span><h2>用知识，守护你的国王。</h2><ul><li>选择年级、上下册、科目和题目难度。难度不改变敌人强度。</li><li>开局有 8 秒准备时间。之后全程自动战斗，答对召唤两只兵并获得积分；答错不扣分，查看解析后继续。</li><li>国王各有 5 条命，失去一条命给自己补一名兵，并短暂无敌。敌方国王归零即通关；自己归零则撤退。</li><li>第一关基础 10 题，每关加一题。未分胜负就追加题目，也可以提前取胜。</li><li>蓝湾是电脑国家。结盟后互不攻击，可派两名小兵协防；解除后支援兵返回，双方休战 10 秒。</li><li>每 3 关有 Boss；累计击败两只 Boss 获得一颗充能豆。大招消耗一颗豆，伤害所有敌军。</li><li>治疗与护盾用积分解锁，按冷却使用；宠物只携带一只。国王升级增加开局守卫，生命始终为 5。</li><li>离开页面自动暂停；关闭或刷新后需重新开始本关，已获得的积分、豆和错题仍保存。</li></ul><p>题库包含原创基础练习。当前按年级和学期划分，尚未完成最新版人教教材逐单元校核。语文题组会循环复习，数学题动态生成。</p><div class="modal-buttons"><button class="primary-button" id="helpClose">明白了，继续</button></div>`);$('helpClose').onclick=()=>{closeModal();if(running)togglePause(false);};};
function profileDialog(){if(running)return;openModal(`<span class="eyebrow">你的冒险身份</span><h2>选择本机勇士</h2><p>每位勇士都有独立的积分、装备和关卡进度。</p><div class="profile-list">${store.profiles.map(p=>`<button class="light-button" data-profile="${esc(p.id)}">${esc(p.name)} ${p.id===profile.id?'✓':''} <small>· ${p.total} 累计积分</small></button>`).join('')}</div><form id="profileForm"><label for="nameInput"><p style="margin-top:20px">创建一位新勇士（1–12 个字）</p></label><input id="nameInput" maxlength="12" placeholder="输入勇士昵称" required autocomplete="off"><div class="modal-buttons"><button class="primary-button" type="submit">创建并出发</button><button class="light-button" id="profileClose" type="button">返回</button></div></form>`);$('profileClose').onclick=closeModal;$('modalContent').querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{profile=store.profiles.find(p=>p.id===b.dataset.profile);store.active=profile.id;save();setSettings();preview();closeModal();setPage(currentTab);});$('profileForm').onsubmit=e=>{e.preventDefault();const name=$('nameInput').value.trim();if(!name){$('nameInput').setCustomValidity('请输入一个昵称');$('nameInput').reportValidity();return; }if(store.profiles.some(p=>p.name===name)){toast('这个昵称已存在，请直接选择或换一个。');return;}profile=newProfile(name);store.profiles.push(profile);store.active=profile.id;save();setSettings();preview();closeModal();setPage(currentTab);};$('nameInput').oninput=()=>$('nameInput').setCustomValidity('');}
$('profileButton').onclick=profileDialog;$('newPlayer').onclick=profileDialog;
window.addEventListener('beforeunload',e=>{if(running){e.preventDefault();e.returnValue='';}});
function frame(timestamp){const delta=lastFrame?Math.min((timestamp-lastFrame)/1000,.1):0;lastFrame=timestamp;if(running&&!paused){battle.tick(delta);processEvents();if(battle.ended)endBattle();}if(currentTab==='battle')renderer.draw(battle,paused?battle.time:timestamp/1000);if(timestamp-lastUI>180){if(currentTab==='battle')updateUI();lastUI=timestamp;}requestAnimationFrame(frame);}
setSettings();preview();save();requestAnimationFrame(frame);if(storageWarning)toast('本机存储读取失败，本次进度可能无法保留。');
