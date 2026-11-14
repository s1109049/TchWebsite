import {icon,art,parkArt} from './illustrations.js';
import {parkStops,growthStages,plantConditions,partFacts,teacherScienceNotes} from './park-content.js';

const $=id=>document.getElementById(id);
const bins=[{key:'paper',name:'廢紙',color:'藍色'},{key:'metal',name:'金屬',color:'黃色'},{key:'plastic',name:'塑膠',color:'啡色'}];
const items=[{key:'newspaper',name:'報紙',bin:'paper'},{key:'can',name:'鋁罐',bin:'metal'},{key:'bottle',name:'膠樽',bin:'plastic'},{key:'box',name:'紙盒',bin:'paper'},{key:'tin',name:'金屬罐',bin:'metal'},{key:'container',name:'塑膠容器',bin:'plastic'}];
let stored={};
try{stored=JSON.parse(localStorage.getItem('green-garden-settings')||'{}')||{};}catch{}
const preferences={sound:stored.sound!==false,reducedMotion:stored.reducedMotion??window.matchMedia('(prefers-reduced-motion: reduce)').matches,largeText:!!stored.largeText,difficulty:stored.difficulty==='extended'?'extended':'basic'};
const tour={stop:'entrance',taskActive:false,answered:false,observed:null,feedback:null,hint:null,stamps:new Set(),growth:0,condition:null,conditionsSeen:new Set(),watered:false,traveling:false};
const recycling={index:0,answered:false,complete:false,picked:false,hint:null,feedback:null};
let mode='nature',park=null,garden=null,currentSpeech='',sceneZoom=1,lastSceneItem;
const engines={park:'loading',recycle:'idle'};
const currentStop=()=>parkStops.find(stop=>stop.key===tour.stop);
const currentItem=()=>items[recycling.index];
const itemCount=()=>preferences.difficulty==='extended'?6:3;
const save=()=>{try{localStorage.setItem('green-garden-settings',JSON.stringify(preferences));}catch{}};
const esc=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function paintIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function speak(text,force=false){
 if((!preferences.sound&&!force)||!('speechSynthesis' in window))return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text),voices=window.speechSynthesis.getVoices();
 const voice=voices.find(v=>/^zh[-_]HK$/i.test(v.lang))||voices.find(v=>/yue/i.test(v.lang))||voices.find(v=>/^zh[-_]TW$/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang));
 if(voice)utterance.voice=voice;utterance.lang=voice?.lang||'zh-HK';utterance.rate=.8;
 utterance.onerror=()=>{$('voice-note').textContent='此裝置暫時無法播放語音。可以繼續按文字及圖片學習。';};
 window.speechSynthesis.speak(utterance);
}
function applyPreferences(){
 document.body.classList.toggle('large-text',preferences.largeText);document.body.classList.toggle('reduce-motion',preferences.reducedMotion);
 $('sound-toggle').setAttribute('aria-pressed',String(preferences.sound));$('sound-toggle').setAttribute('aria-label',preferences.sound?'關閉語音':'開啟語音');
 $('sound-label').textContent=preferences.sound?'語音開啟':'語音關閉';$('sound-toggle').querySelector('[data-icon]').innerHTML=icon(preferences.sound?'volume':'muted');
 $('reduce-motion').checked=preferences.reducedMotion;$('large-text').checked=preferences.largeText;$('difficulty').value=preferences.difficulty;
 park?.setMotion(!preferences.reducedMotion);garden?.setMotion(!preferences.reducedMotion);
}
function keepFocus(callback){
 const active=document.activeElement;let marker;
 for(const key of ['choice','stop','growth','condition'])if(active?.dataset?.[key]){marker=[key,active.dataset[key]];break;}
 callback();
 if(marker)document.querySelector(`[data-${marker[0]}="${marker[1]}"]`)?.focus({preventScroll:true});
}
function renderFeedback(value){
 $('feedback').className=`feedback ${value.kind||''}`;$('feedback-text').textContent=value.text;
 $('feedback').querySelector('[data-icon]').innerHTML=icon(value.kind==='success'?'check':value.kind==='retry'?'leaf':'sparkle');
}
function renderLoading(){
 const key=mode==='nature'?'park':'recycle',status=engines[key];
 $('scene-loading').hidden=status==='ready';
 if(status==='failed'){
  $('scene-loading').classList.add('fallback');
  $('scene-loading').innerHTML=`<span class="fallback-garden">${art('tree')}${art('flower')}${art('grass')}</span><span>3D 暫時未能顯示。<br>按地點及下方大按鈕，仍可完成學習。</span>`;
 }else{
  $('scene-loading').classList.remove('fallback');
  $('scene-loading').innerHTML=`<span class="loading-leaf">${icon('sprout')}</span><span>${mode==='nature'?'科學小公園':'回收物品'}準備中…</span>`;
 }
}
function render(){
 keepFocus(()=>{
  const nature=mode==='nature';
  $('tab-nature').classList.toggle('active',nature);$('tab-recycle').classList.toggle('active',!nature);
  $('tab-nature').setAttribute('aria-pressed',String(nature));$('tab-recycle').setAttribute('aria-pressed',String(!nature));
  $('park-world').hidden=!nature;$('recycle-world').hidden=nature;$('park-route-wrap').hidden=!nature;$('park-walk').hidden=!nature;
  $('zoom-in').hidden=nature;$('zoom-out').hidden=nature;$('touch-prompt').hidden=true;
  $('park-care').hidden=!nature||!['flower','growth'].includes(tour.stop);
  $('growth-lab').hidden=!nature||tour.stop!=='growth';$('item-actions').hidden=nature||recycling.complete;
  $('view-reset').setAttribute('aria-label',nature?'回到這一站的觀察位置':'還原物件位置');$('view-reset').title=nature?'回到觀察位置':'還原物件位置';
  if(nature)renderPark();else renderRecycling();renderLoading();
 });
}
function renderPark(){
 const stop=currentStop(),task=stop.task,observation=tour.observed&&partFacts[tour.observed];
 const feedback=tour.feedback||{kind:'',text:tour.taskActive?task.prompt:stop.fact};
 $('scene-label').textContent=tour.traveling?`前往${stop.shortName}…`:stop.name;$('scene-caption').textContent='按路牌或上方地點遊覽；點植物近看部位。';
 $('garden').setAttribute('aria-label',`3D 科學小公園：${stop.name}。可使用下方大按鈕及地點按鈕完成學習。`);
 $('activity-label').textContent=tour.taskActive?'這一站的小任務':'植物小小觀察家';$('object-kicker').textContent=tour.traveling?'沿着小路，慢慢出發':stop.name;
 $('object-picture').innerHTML=parkArt(stop.key);$('activity-title').textContent=tour.taskActive?task.prompt:observation?`這是${observation.name}`:stop.title;
 $('activity-description').textContent=tour.taskActive?(tour.answered?'做到了！準備好再到下一站。':'點選 3D 物件，或按下面的選項。'):observation?observation.text:stop.description;
 $('interaction-help').hidden=false;$('interaction-help').textContent=stop.key==='growth'?'逐步切換生長階段，再認識陽光、水分和空氣。':stop.key==='entrance'?'按一個地點，開始遊公園。':stop.key==='recycle'?'愛護植物，也讓公園保持清潔。':'先看一看，再開始小任務。';
 $('progress').hidden=false;$('progress').className='progress tour-stamps';$('progress').setAttribute('aria-label',`完成 ${tour.stamps.size} 個小任務，共 5 個`);
 $('progress').innerHTML=parkStops.filter(s=>s.task).map((s,i)=>`<span class="tour-stamp ${tour.stamps.has(s.key)?'done':''}" title="${esc(s.name)}${tour.stamps.has(s.key)?'：已完成':''}" aria-hidden="true">${tour.stamps.has(s.key)?'✓':i+1}</span>`).join('');
 $('stamp-count').textContent=`完成 ${tour.stamps.size} / 5 個小任務`;
 $('park-route').innerHTML=parkStops.map((s,i)=>`<button class="route-stop ${s.key===tour.stop?'active':''} ${tour.stamps.has(s.key)?'done':''}" data-stop="${s.key}" aria-current="${s.key===tour.stop?'location':'false'}" aria-label="前往${esc(s.name)}${tour.stamps.has(s.key)?'，小任務已完成':''}"><span class="route-order">0${i+1}</span>${parkArt(s.key)}<span>${esc(s.shortName)}</span></button>`).join('');
 $('choice-buttons').setAttribute('aria-label',tour.taskActive?'小任務的選項':'選擇觀察對象');$('choice-buttons').hidden=false;
 if(task){
  $('choice-buttons').innerHTML=task.options.map(option=>`<button class="choice part-choice ${['paper','metal','plastic'].includes(option.key)?option.key:''} ${tour.observed===option.key?'active':''} ${tour.hint===option.key?'hint':''}" data-choice="${option.key}" ${tour.taskActive?(tour.answered?'aria-disabled="true"':''):`aria-pressed="${tour.observed===option.key}"`} ${tour.traveling?'disabled':''}><span class="choice-illustration">${parkArt(option.key)}</span><span class="choice-text"><strong>${esc(option.label)}</strong><small>${tour.taskActive?'點一下作答':'點一下觀察'}</small></span><span class="choice-check">${icon('check')}</span></button>`).join('');
 }else $('choice-buttons').innerHTML=['flower','tree','grass'].map(key=>`<button class="park-overview-choice" data-stop="${key}">${parkArt(key)}前往${esc(parkStops.find(s=>s.key===key).shortName)}</button>`).join('');
 renderFeedback(feedback);
 let primary='開始小任務';
 if(stop.key==='entrance')primary='出發去花圃';
 else if(tour.taskActive)primary=tour.answered?(stop.key==='recycle'?'開始回收挑戰':`到下一站：${parkStops[parkStops.indexOf(stop)+1].shortName}`):'提示我';
 $('primary-label').textContent=tour.traveling?'正在前往觀察點…':primary;$('primary-action').disabled=tour.traveling;
 $('secondary-action').hidden=stop.key==='entrance';$('secondary-action').textContent=tour.taskActive?'繼續觀察這一站':'回到公園入口';$('secondary-action').disabled=tour.traveling;
 $('view-reset').disabled=tour.traveling||engines.park!=='ready';
 $('scene-status').textContent=tour.traveling?`沿着小路，前往${stop.name}。`:tour.feedback?feedback.text:tour.taskActive?task.prompt:stop.intro;
 $('scene-status').className=`scene-status ${tour.traveling?'traveling':feedback.kind||''}`;
 $('park-walk').querySelectorAll('button').forEach(button=>button.disabled=tour.traveling||engines.park!=='ready');
 $('park-water').disabled=tour.traveling;$('water-note').textContent=tour.watered?'澆水不會讓植物立即長大。':'也可把 3D 水壺拖到植物旁。';
 $('gentle-note').textContent='沒有計時，隨時可以再觀察。';$('bottom-title').textContent='今天的科學發現';$('bottom-copy').textContent='認識花樹草，觀察生長，再找出生長需要的條件。';
 if(stop.key==='growth')renderGrowth();
 currentSpeech=tour.feedback?feedback.text:tour.taskActive?task.prompt:observation?observation.voice:stop.voice;
 park?.setInteractive(engines.park==='ready');garden?.setInteraction({enabled:false,completed:recycling.answered||recycling.complete});
}
function renderGrowth(){
 const stage=growthStages[tour.growth];
 $('growth-track').innerHTML=growthStages.map((s,i)=>`<button class="growth-step ${i===tour.growth?'active':''}" data-growth="${i}" aria-pressed="${i===tour.growth}"><span>${i+1}</span><span>${esc(s.name)}</span></button>`).join('');
 $('growth-stage-name').textContent=`${tour.growth+1}. ${stage.name}`;$('growth-stage-description').textContent=stage.description;
 $('growth-next').disabled=tour.growth===growthStages.length-1;$('growth-next').innerHTML=tour.growth===growthStages.length-1?'已看到開花，可選前面階段再觀察':`看看下一階段：${esc(growthStages[tour.growth+1].name)} ${icon('arrow')}`;
 $('condition-buttons').innerHTML=plantConditions.map(condition=>`<button class="condition-button ${tour.conditionsSeen.has(condition.key)?'seen':''} ${tour.condition===condition.key?'active':''}" data-condition="${condition.key}" aria-pressed="${tour.condition===condition.key}">${icon(condition.key)}<span>${esc(condition.name)}</span>${tour.conditionsSeen.has(condition.key)?'<span class="condition-check" aria-hidden="true">✓</span>':''}</button>`).join('');
 $('condition-description').textContent=tour.condition?plantConditions.find(c=>c.key===tour.condition).description:'陽光、水分和空氣，都是小苗的好幫手。';
}
function binChoice(bin){
 const active=recycling.answered&&recycling.hint===bin.key;
 return `<button class="choice ${bin.key} ${active?'active':''} ${!recycling.answered&&recycling.hint===bin.key?'hint':''}" data-choice="${bin.key}" aria-label="${bin.name}，${bin.color}回收箱" ${recycling.complete||recycling.answered?'aria-disabled="true"':''}><span class="choice-illustration">${art(bin.key)}</span><span class="choice-text"><strong>${bin.name}</strong><small>${bin.color}回收箱</small></span><span class="choice-check">${icon('check')}</span></button>`;
}
function renderRecycling(){
 const complete=recycling.complete,item=currentItem();
 const feedback=recycling.feedback||{kind:complete?'success':'',text:complete?'謝謝你一起愛護公園！':'也可先點物品，再點一個回收箱。'};
 $('scene-label').textContent='香港三色回收站';$('scene-caption').textContent='直接拖入箱內，或先點物品，再點回收箱。';$('garden').setAttribute('aria-label','把前方立體回收物拖進回收箱。也可使用下方大按鈕。');
 $('activity-label').textContent=complete?'完成回收挑戰':'回收小練習';$('object-kicker').textContent=complete?'愛護公園，從我做起':`第 ${recycling.index+1} 件，共 ${itemCount()} 件`;
 $('object-picture').innerHTML=art(complete?'trophy':item.key);$('activity-title').textContent=complete?'做到了！':`這是${item.name}`;$('activity-description').textContent=complete?'你認識了三色回收箱。':recycling.picked?'請點一個回收箱。':`把${item.name}拖進回收箱。`;
 $('interaction-help').hidden=complete;$('interaction-help').innerHTML='方法一：按住物品，拖進箱內。<br>方法二：點物品，再點回收箱。';
 $('progress').hidden=false;$('progress').className='progress';$('progress').setAttribute('aria-label',complete?`已完成全部 ${itemCount()} 件`:`第 ${recycling.index+1} 件，共 ${itemCount()} 件`);
 $('progress').innerHTML=Array.from({length:itemCount()},(_,i)=>`<span class="progress-dot ${complete||i<recycling.index?'done':i===recycling.index?'current':''}" aria-hidden="true"></span>`).join('');
 $('choice-buttons').hidden=false;$('choice-buttons').setAttribute('aria-label','選擇回收箱');$('choice-buttons').innerHTML=bins.map(binChoice).join('');
 $('pickup-label').textContent=recycling.answered?'已放入回收箱':recycling.picked?`已拿起${item.name}`:`拿起${item.name}`;$('pickup-action').disabled=recycling.answered;$('pickup-action').setAttribute('aria-pressed',String(recycling.picked));$('return-action').disabled=!recycling.picked||recycling.answered;
 $('view-reset').disabled=recycling.answered||complete;$('primary-action').disabled=false;$('primary-label').textContent=complete?'再練習一次':recycling.answered?(recycling.index===itemCount()-1?'看看成果':'下一個'):'提示我';
 $('secondary-action').hidden=false;$('secondary-action').disabled=false;$('secondary-action').textContent='返回公園回收站';
 $('scene-status').textContent=complete?'做到了！一起讓公園保持清潔。':recycling.feedback?feedback.text:`把${item.name}拖進回收箱。`;$('scene-status').className=`scene-status ${recycling.picked?'held':feedback.kind||''}`;renderFeedback(feedback);
 $('gentle-note').textContent='慢慢來，按錯了也可以再試。';$('bottom-title').textContent='回收前，做一做';$('bottom-copy').textContent='容器先倒清、洗淨、晾乾；廢紙保持乾爽。';
 currentSpeech=recycling.feedback?feedback.text:complete?'做到了！你認識了三色回收箱。':`這是${item.name}。${$('activity-description').textContent}`;park?.setInteractive(false);
 if(garden){const kind=complete?null:item.key;if(kind!==lastSceneItem){garden.showItem(kind);lastSceneItem=kind;}garden.focus(recycling.hint);garden.setInteraction({enabled:engines.recycle==='ready'&&!complete&&!recycling.answered,completed:complete||recycling.answered});}
}
function arrive(key){if(mode==='nature'&&tour.stop===key){tour.traveling=false;render();}}
function goToStop(key,announce=true){
 const stop=parkStops.find(s=>s.key===key);if(!stop)return;
 window.speechSynthesis?.cancel();mode='nature';Object.assign(tour,{stop:key,taskActive:false,answered:false,observed:null,feedback:null,hint:null,traveling:!!park});render();
 if(park){park.setInteractive(true);park.goTo(key);park.setGrowthStage(tour.growth);}else tour.traveling=false;
 if(announce)speak(stop.voice);
}
function selectPark(key){
 if(tour.traveling)return;const stop=currentStop();if(tour.taskActive){answerPark(key);return;}tour.observed=partFacts[key]?key:null;tour.hint=null;
 if(partFacts[key]){tour.feedback={kind:'',text:partFacts[key].text};park?.focusPart(key);render();speak(partFacts[key].voice);}
 else if(stop.key==='recycle'&&bins.some(b=>b.key===key)){const bin=bins.find(b=>b.key===key);tour.feedback={kind:'',text:`${bin.color}回收箱，回收${bin.name}。`};render();speak(tour.feedback.text);}
 else if(key==='water')waterPlant();
 else{tour.feedback={kind:'',text:key==='stone'?'這是石頭。石頭不是植物。':key==='bench'?'這是長椅，讓我們休息。':key==='toy'?'玩具給人玩，不能代替植物需要的水分。':'糖果不能代替植物需要的水分。'};render();speak(tour.feedback.text);}
}
function answerPark(key){
 const stop=currentStop(),task=stop.task;if(!task||tour.answered||tour.traveling||!task.options.some(o=>o.key===key))return;tour.observed=key;
 if(key===task.answer){tour.answered=true;tour.hint=null;tour.stamps.add(stop.key);tour.feedback={kind:'success',text:task.success};park?.focusPart(key);}
 else{tour.hint=task.answer;tour.feedback={kind:'retry',text:task.hint};park?.focusPart(task.answer);}
 render();speak(tour.feedback.text);
}
function primaryPark(){
 if(tour.traveling)return;const stop=currentStop();
 if(stop.key==='entrance'){goToStop('flower');return;}
 if(!tour.taskActive){tour.taskActive=true;tour.answered=false;tour.observed=null;tour.feedback=null;tour.hint=null;render();speak(stop.task.prompt);return;}
 if(tour.answered){if(stop.key==='recycle')switchMode('recycle');else goToStop(parkStops[parkStops.indexOf(stop)+1].key);return;}
 tour.hint=stop.task.answer;tour.feedback={kind:'',text:stop.task.hint};park?.focusPart(tour.hint);render();speak(tour.feedback.text);
}
function setGrowth(index){
 if(mode!=='nature'||tour.stop!=='growth'||tour.traveling||!Number.isInteger(index)||index<0||index>=growthStages.length)return;tour.growth=index;park?.setGrowthStage(index);
 tour.feedback={kind:'',text:`現在看到：${growthStages[index].name}。${growthStages[index].description}`};render();speak(growthStages[index].voice);
}
function seeCondition(key){
 if(mode!=='nature'||tour.stop!=='growth'||tour.traveling)return;const condition=plantConditions.find(c=>c.key===key);if(!condition)return;
 tour.condition=key;tour.conditionsSeen.add(key);park?.setConditions({[key]:true});if(key==='water'){waterPlant();return;}
 tour.feedback={kind:'',text:condition.description};render();speak(condition.voice);
}
function waterPlant(fromScene=false){
 if(mode!=='nature'||tour.traveling||!['flower','growth'].includes(tour.stop))return;if(!fromScene)park?.water();tour.watered=true;
 if(tour.stop==='growth'){tour.condition='water';tour.conditionsSeen.add('water');}
 if(tour.taskActive&&currentStop().task.answer==='water'&&!tour.answered){answerPark('water');return;}
 tour.feedback={kind:'',text:'幫植物澆水了。適量就好，長大需要時間。'};render();speak(tour.feedback.text);
}
function parkAction(action){
 if(mode!=='nature')return;if(action==='water')waterPlant(true);
 else if(action==='water-miss'){tour.feedback={kind:'',text:'水壺放回原位了。可以再拖到植物旁。'};render();speak(tour.feedback.text);}
 else if(action==='sun'||action==='air')seeCondition(action);
}
function resetRecycling(){Object.assign(recycling,{index:0,answered:false,complete:false,picked:false,hint:null,feedback:null});lastSceneItem=undefined;garden?.returnItem();render();}
function selectRecycle(key){
 if(mode!=='recycle'||recycling.complete||recycling.answered)return;if(key==='item'){pickUp();return;}const bin=bins.find(b=>b.key===key);if(!bin)return;recycling.picked=false;
 if(key===currentItem().bin){recycling.answered=true;recycling.hint=key;recycling.feedback={kind:'success',text:`做到了！${currentItem().name}放入${bin.color}回收箱，回收${bin.name}。`};render();garden?.putItem(key);garden?.celebrate(key);}
 else{recycling.hint=currentItem().bin;const correct=bins.find(b=>b.key===currentItem().bin);recycling.feedback={kind:'retry',text:`再試一次。找找${correct.color}的「${correct.name}」回收箱。`};render();garden?.returnItem();}speak(recycling.feedback.text);
}
function pickUp(){if(mode!=='recycle'||recycling.answered||recycling.complete)return;recycling.picked=true;recycling.hint=null;recycling.feedback={kind:'',text:`已拿起${currentItem().name}。請點一個回收箱。`};render();garden?.takeItem();speak(currentSpeech);}
function putBack(){if(mode!=='recycle'||recycling.answered||recycling.complete)return;recycling.picked=false;recycling.feedback={kind:'',text:'放回原位了。可以再試。'};garden?.returnItem();render();speak(currentSpeech);}
function primaryRecycle(){
 if(recycling.complete){resetRecycling();speak(currentSpeech);return;}
 if(!recycling.answered){const bin=bins.find(b=>b.key===currentItem().bin);recycling.hint=bin.key;recycling.feedback={kind:'',text:`${currentItem().name}是${bin.name}，放入${bin.color}回收箱。`};render();speak(currentSpeech);return;}
 if(recycling.index+1===itemCount()){recycling.complete=true;recycling.feedback=null;}else Object.assign(recycling,{index:recycling.index+1,answered:false,picked:false,hint:null,feedback:null});render();speak(currentSpeech);
}
function updateZoom(){$('zoom-out').disabled=sceneZoom<=1;$('zoom-in').disabled=sceneZoom>=1.25;garden?.setZoom(sceneZoom);}
function switchMode(next){
 if(mode===next)return;window.speechSynthesis?.cancel();mode=next;
 if(next==='nature'){render();if(park){tour.traveling=true;render();park.setInteractive(true);park.goTo(tour.stop);}speak(currentSpeech);}else{render();ensureRecycling();speak(currentSpeech);}
}
function engineError(key){
 engines[key]='failed';if(key==='park'){tour.traveling=false;try{park?.dispose();}catch{}park=null;}else{try{garden?.dispose();}catch{}garden=null;}
 $(key==='park'?'park-world':'recycle-world').style.visibility='hidden';render();
}
async function ensureRecycling(){
 if(engines.recycle!=='idle')return;engines.recycle='loading';renderLoading();
 try{
  const {createGarden}=await import('./scene.js');
  garden=createGarden($('recycle-world'),{reducedMotion:preferences.reducedMotion,onSelect:selectRecycle,onDrop:key=>key?selectRecycle(key):putBack(),onReady:()=>{if(engines.recycle!=='failed'){engines.recycle='ready';render();}},onError:()=>engineError('recycle')});
  engines.recycle='ready';garden.setMode('recycle');lastSceneItem=undefined;render();updateZoom();
 }catch{engineError('recycle');}
}
paintIcons();applyPreferences();render();updateZoom();$('science-notes').innerHTML=teacherScienceNotes.map(note=>`<li>${esc(note)}</li>`).join('');
$('tab-nature').addEventListener('click',()=>switchMode('nature'));$('tab-recycle').addEventListener('click',()=>switchMode('recycle'));
$('park-route').addEventListener('click',event=>{const target=event.target.closest('[data-stop]');if(target)goToStop(target.dataset.stop);});
$('choice-buttons').addEventListener('click',event=>{const stop=event.target.closest('[data-stop]');if(stop){goToStop(stop.dataset.stop);return;}const choice=event.target.closest('[data-choice]');if(choice)(mode==='nature'?selectPark:selectRecycle)(choice.dataset.choice);});
$('primary-action').addEventListener('click',()=>mode==='nature'?primaryPark():primaryRecycle());
$('secondary-action').addEventListener('click',()=>{if(mode==='recycle'){goToStop('recycle');return;}if(tour.taskActive){tour.taskActive=false;tour.answered=false;tour.feedback=null;tour.hint=null;tour.observed=null;render();speak(currentSpeech);}else goToStop('entrance');});
$('park-walk').addEventListener('click',event=>{const target=event.target.closest('[data-walk]');if(target&&mode==='nature'&&!tour.traveling)park?.move(target.dataset.walk);});
$('park-water').addEventListener('click',()=>waterPlant());$('growth-track').addEventListener('click',event=>{const target=event.target.closest('[data-growth]');if(target)setGrowth(Number(target.dataset.growth));});$('growth-next').addEventListener('click',()=>setGrowth(tour.growth+1));
$('condition-buttons').addEventListener('click',event=>{const target=event.target.closest('[data-condition]');if(target)seeCondition(target.dataset.condition);});
$('pickup-action').addEventListener('click',pickUp);$('return-action').addEventListener('click',putBack);
$('zoom-in').addEventListener('click',()=>{sceneZoom=Math.min(1.25,sceneZoom+.125);updateZoom();});$('zoom-out').addEventListener('click',()=>{sceneZoom=Math.max(1,sceneZoom-.125);updateZoom();});
$('view-reset').addEventListener('click',()=>{if(mode==='nature'){park?.resetView();tour.feedback={kind:'',text:'回到這一站的觀察位置了。'};render();speak(currentSpeech);}else if(!recycling.answered&&!recycling.complete){recycling.picked=false;recycling.feedback={kind:'',text:'位置已還原。可以繼續學習。'};garden?.resetLayout();sceneZoom=1;updateZoom();render();speak(currentSpeech);}});
$('listen').addEventListener('click',()=>speak(currentSpeech,true));$('sound-toggle').addEventListener('click',()=>{preferences.sound=!preferences.sound;save();applyPreferences();if(preferences.sound)speak(currentSpeech);else window.speechSynthesis?.cancel();});
$('settings-open').addEventListener('click',()=>$('settings').showModal());$('settings').addEventListener('click',event=>{if(event.target===$('settings')){const r=$('settings').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('settings').close();}});
$('reduce-motion').addEventListener('change',event=>{preferences.reducedMotion=event.target.checked;save();applyPreferences();});$('large-text').addEventListener('change',event=>{preferences.largeText=event.target.checked;save();applyPreferences();});$('difficulty').addEventListener('change',event=>{preferences.difficulty=event.target.value;save();resetRecycling();});
if(!('speechSynthesis' in window)){$('listen').hidden=true;$('sound-toggle').hidden=true;$('voice-note').textContent='此瀏覽器未支援語音。所有指示均有文字及圖片，可以繼續學習。';}
try{
 const {createPark}=await import('./park-scene.js');
 park=createPark($('park-world'),{reducedMotion:preferences.reducedMotion,onNavigate:key=>{if(mode==='nature')goToStop(key);},onSelect:selection=>{if(mode==='nature'&&selection?.key)selectPark(selection.key);},onAction:parkAction,onArrive:arrive,onReady:()=>{if(engines.park!=='failed'){engines.park='ready';render();}},onError:()=>engineError('park')});
 engines.park='ready';park.goTo(tour.stop);park.setGrowthStage(tour.growth);park.setConditions({sun:true,water:true,air:true});render();
}catch{engineError('park');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.speechSynthesis?.cancel();});window.addEventListener('pagehide',()=>{window.speechSynthesis?.cancel();park?.dispose();garden?.dispose();},{once:true});
