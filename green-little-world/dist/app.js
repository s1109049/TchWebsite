import {icon,art,parkArt} from './illustrations.js?v=3';
import {parkStops,growthStages,plantConditions,partFacts,teacherScienceNotes} from './park-content.js?v=3';

const $=id=>document.getElementById(id);
const bins=[{key:'paper',name:'廢紙',color:'藍色'},{key:'metal',name:'金屬',color:'黃色'},{key:'plastic',name:'塑膠',color:'啡色'}];
const items=[{key:'newspaper',name:'報紙',bin:'paper'},{key:'can',name:'鋁罐',bin:'metal'},{key:'bottle',name:'膠樽',bin:'plastic'},{key:'box',name:'紙盒',bin:'paper'},{key:'tin',name:'金屬罐',bin:'metal'},{key:'container',name:'塑膠容器',bin:'plastic'}];
let stored={};
try{stored=JSON.parse(localStorage.getItem('green-garden-settings')||'{}')||{};}catch{}
const preferences={sound:stored.sound!==false,reducedMotion:stored.reducedMotion??window.matchMedia('(prefers-reduced-motion: reduce)').matches,largeText:!!stored.largeText,difficulty:stored.difficulty==='extended'?'extended':'basic'};
const tour={complete:false,stop:'entrance',taskActive:false,answered:false,observed:null,feedback:null,hint:null,stamps:new Set(),growth:0,condition:null,conditionsSeen:new Set(),watered:false,traveling:false};
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
  $('scene-loading').innerHTML=`<span class="fallback-garden">${art('tree')}${art('flower')}${art('grass')}</span><span>3D 暫時未能顯示。<br>按「上一站／下一站」及觀察按鈕，仍可完成學習。</span>`;
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
  $('park-world').hidden=!nature;$('recycle-world').hidden=nature;$('park-route-wrap').hidden=!nature;
  $('zoom-in').hidden=nature;$('zoom-out').hidden=nature;$('view-reset').hidden=nature;
  $('prev-action').hidden=!nature;$('object-picture').hidden=nature;
  $('park-care').hidden=!nature||tour.complete||!['flower','conditions'].includes(tour.stop);
  $('growth-lab').hidden=!nature||tour.complete||tour.stop!=='growth';
  $('conditions-lab').hidden=!nature||tour.complete||tour.stop!=='conditions';
  $('item-actions').hidden=nature||recycling.complete;$('task-action').hidden=!nature||tour.complete||tour.stop==='entrance';
  if(nature)renderPark();else renderRecycling();renderLoading();
 });
}
function renderPark(){
 const stop=currentStop(),index=parkStops.indexOf(stop),complete=tour.complete,task=stop.task,observation=tour.observed&&partFacts[tour.observed];
 const feedback=complete?{kind:'success',text:'今天看過花、樹、草，也觀察了植物長大和生長的需要。'}:tour.feedback||{kind:'',text:tour.taskActive?task.prompt:stop.fact};
 $('scene-label').textContent=complete?'遊覽完成':tour.traveling?`前往${stop.shortName}…`:stop.name;
 $('scene-caption').textContent=complete?'可以再遊覽一次，也可以休息一下。':'點一下 3D 植物，也可按大按鈕觀察。';
 $('garden').setAttribute('aria-label',complete?'科學公園旅程完成。':`固定觀察畫面：${stop.name}。可按上一站或下一站繼續。`);
 $('activity-label').textContent=complete?'今天的發現':tour.taskActive?'想一想':'一起觀察';
 $('object-kicker').textContent=complete?'按照自己的步伐':index===0?'今天的旅程':`第 ${index} 站，共 5 站`;
 $('activity-title').textContent=complete?'公園遊覽完成了':tour.taskActive?task.prompt:observation?`這是${observation.name}`:stop.title;
 $('activity-description').textContent=complete?'認識小植物，發現大秘密。':tour.taskActive?(tour.answered?'做到了！可以繼續觀察，或到下一站。':'點選物件，或按下面的選項。'):observation?observation.text:stop.description;
 $('interaction-help').hidden=false;
 $('interaction-help').textContent=complete?'按「再遊覽一次」，重新出發。':index===0?'按「開始遊覽」，我帶你逐站看看。':'準備好，就按「下一站」。題目可以跳過。';
 $('progress').hidden=true;
 $('stamp-count').textContent=complete?'旅程完成':index===0?'一起出發':`第 ${index} 站 · 共 5 站`;
 const labels=['開始','花','樹','草','生長','需要'];
 $('park-route').innerHTML=parkStops.map((item,i)=>`<li class="route-step ${!complete&&item.key===tour.stop?'active':''} ${complete||i<index?'done':''}" ${!complete&&item.key===tour.stop?'aria-current="step"':''}><span class="route-dot" aria-hidden="true">${complete||i<index?'✓':i===0?icon('leaf'):i}</span><span>${labels[i]}</span></li>`).join('');
 $('choice-buttons').hidden=complete||index===0||(!tour.taskActive&&['growth','conditions'].includes(tour.stop));
 $('choice-buttons').setAttribute('aria-label',tour.taskActive?'可選小題目的選項':'選擇觀察部位');
 if(task)$('choice-buttons').innerHTML=task.options.map(option=>`<button class="choice part-choice ${tour.observed===option.key?'active':''} ${tour.hint===option.key?'hint':''}" data-choice="${option.key}" ${tour.taskActive?(tour.answered?'aria-disabled="true"':''):`aria-pressed="${tour.observed===option.key}"`} ${tour.traveling?'disabled':''}><span class="choice-illustration">${parkArt(option.key)}</span><span class="choice-text"><strong>${esc(option.label)}</strong><small>${tour.taskActive?'點一下作答':'點一下觀察'}</small></span><span class="choice-check">${icon('check')}</span></button>`).join('');
 else $('choice-buttons').innerHTML='';
 renderFeedback(feedback);
 $('primary-label').textContent=complete?'再遊覽一次':tour.traveling?'正在前往下一站…':index===0?'開始遊覽':index===parkStops.length-1?'完成遊覽':`下一站：${parkStops[index+1].shortName}`;
 $('primary-action').disabled=tour.traveling;$('prev-action').disabled=tour.traveling||(!complete&&index===0);
 $('task-action').disabled=tour.traveling;$('task-action').setAttribute('aria-pressed',String(tour.taskActive));$('task-label').textContent=tour.taskActive?'繼續觀察':'試一題';
 $('secondary-action').hidden=true;$('view-reset').disabled=true;
 $('scene-status').textContent=complete?'旅程完成，謝謝你一起觀察。':tour.traveling?`慢慢前往${stop.name}。`:tour.feedback?feedback.text:tour.taskActive?task.prompt:stop.description;
 $('scene-status').className=`scene-status ${tour.traveling?'traveling':feedback.kind||''}`;
 $('park-water').disabled=tour.traveling;$('water-note').textContent='適量就好。長大需要時間。';
 $('gentle-note').textContent='可以重聽、再看，不用急。';$('bottom-title').textContent='每次觀察一樣';$('bottom-copy').textContent='準備好才繼續，題目不必答對也可以前進。';
 if(!complete&&stop.key==='growth')renderGrowth();if(!complete&&stop.key==='conditions')renderConditions();
 currentSpeech=complete?'公園遊覽完成了。我們認識了花、樹、草，觀察了植物長大，也認識陽光、水分和空氣。':tour.feedback?feedback.text:tour.taskActive?task.prompt:observation?observation.voice:stop.voice;
 park?.setInteractive(engines.park==='ready'&&!complete);garden?.setInteraction({enabled:false,completed:recycling.answered||recycling.complete});
}
function renderGrowth(){
 const stage=growthStages[tour.growth];
 $('growth-track').innerHTML=growthStages.map((item,i)=>`<button class="growth-step ${i===tour.growth?'active':''}" data-growth="${i}" aria-pressed="${i===tour.growth}"><span>${i+1}</span><span>${esc(item.name)}</span></button>`).join('');
 $('growth-stage-name').textContent=`${tour.growth+1}. ${stage.name}`;$('growth-stage-description').textContent=stage.description;
 $('growth-next').disabled=tour.growth===growthStages.length-1;$('growth-next').innerHTML=tour.growth===growthStages.length-1?'已看到開花，可以再選一個階段':`下一個生長階段：${esc(growthStages[tour.growth+1].name)} ${icon('arrow')}`;
}
function renderConditions(){
 $('condition-buttons').innerHTML=plantConditions.map(condition=>`<button class="condition-button ${tour.condition===condition.key?'active':''}" data-condition="${condition.key}" aria-pressed="${tour.condition===condition.key}">${icon(condition.key)}<span>${esc(condition.name)}</span></button>`).join('');
 $('condition-description').textContent=tour.condition?plantConditions.find(item=>item.key===tour.condition).description:'按一個圖示，聽聽它的作用。';
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
 $('secondary-action').hidden=false;$('secondary-action').disabled=false;$('secondary-action').textContent='返回科學公園';
 $('scene-status').textContent=complete?'做到了！一起讓公園保持清潔。':recycling.feedback?feedback.text:`把${item.name}拖進回收箱。`;$('scene-status').className=`scene-status ${recycling.picked?'held':feedback.kind||''}`;renderFeedback(feedback);
 $('gentle-note').textContent='慢慢來，按錯了也可以再試。';$('bottom-title').textContent='回收前，做一做';$('bottom-copy').textContent='容器先倒清、洗淨、晾乾；廢紙保持乾爽。';
 currentSpeech=recycling.feedback?feedback.text:complete?'做到了！你認識了三色回收箱。':`這是${item.name}。${$('activity-description').textContent}`;park?.setInteractive(false);
 if(garden){const kind=complete?null:item.key;if(kind!==lastSceneItem){garden.showItem(kind);lastSceneItem=kind;}garden.focus(recycling.hint);garden.setInteraction({enabled:engines.recycle==='ready'&&!complete&&!recycling.answered,completed:complete||recycling.answered});}
}
function arrive(key){if(mode==='nature'&&tour.stop===key){tour.traveling=false;render();}}
function goToStop(key,announce=true){
 const stop=parkStops.find(item=>item.key===key);if(!stop)return;
 window.speechSynthesis?.cancel();mode='nature';
 Object.assign(tour,{complete:false,stop:key,taskActive:false,answered:false,observed:null,feedback:null,hint:null,traveling:!!park});
 if(key==='growth')tour.growth=0;
 render();document.querySelector('.garden-card')?.scrollIntoView({block:'start',behavior:'auto'});
 if(park){park.setInteractive(true);park.goTo(key);park.setGrowthStage(tour.growth);}else tour.traveling=false;
 if(announce)speak(stop.voice);
}
function selectPark(key){
 if(tour.traveling)return;const stop=currentStop();if(tour.taskActive){answerPark(key);return;}tour.observed=partFacts[key]?key:null;tour.hint=null;
 if(partFacts[key]){tour.feedback={kind:'',text:partFacts[key].text};park?.focusPart(key);render();speak(partFacts[key].voice);}
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
 if(tour.traveling)return;
 if(tour.complete){tour.growth=0;tour.condition=null;tour.conditionsSeen.clear();goToStop('entrance');return;}
 const index=parkStops.indexOf(currentStop());
 if(index<parkStops.length-1){goToStop(parkStops[index+1].key);return;}
 tour.complete=true;tour.taskActive=false;tour.answered=false;tour.feedback=null;tour.traveling=false;
 park?.setInteractive(false);park?.goTo('entrance');render();speak(currentSpeech);
}
function previousPark(){
 if(tour.traveling)return;
 if(tour.complete){goToStop(parkStops.at(-1).key);return;}
 const index=parkStops.indexOf(currentStop());if(index>0)goToStop(parkStops[index-1].key);
}
function toggleTask(){
 if(mode!=='nature'||tour.complete||tour.traveling||!currentStop().task)return;
 tour.taskActive=!tour.taskActive;tour.answered=false;tour.observed=null;tour.feedback=null;tour.hint=null;
 park?.focusPart(null);render();speak(currentSpeech);
}
function setGrowth(index){
 if(mode!=='nature'||tour.stop!=='growth'||tour.traveling||!Number.isInteger(index)||index<0||index>=growthStages.length)return;tour.growth=index;park?.setGrowthStage(index);
 tour.feedback={kind:'',text:`現在看到：${growthStages[index].name}。${growthStages[index].description}`};render();speak(growthStages[index].voice);
}
function seeCondition(key){
 if(mode!=='nature'||tour.stop!=='conditions'||tour.traveling)return;const condition=plantConditions.find(c=>c.key===key);if(!condition)return;
 tour.condition=key;tour.conditionsSeen.add(key);park?.setConditions({[key]:true});if(key==='water'){waterPlant();return;}
 tour.feedback={kind:'',text:condition.description};render();speak(condition.voice);
}
function waterPlant(fromScene=false){
 if(mode!=='nature'||tour.traveling||!['flower','conditions'].includes(tour.stop))return;if(!fromScene)park?.water();tour.watered=true;
 if(tour.stop==='conditions'){tour.condition='water';tour.conditionsSeen.add('water');}
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
 if(next==='nature'){
  tour.traveling=!!park&&!tour.complete;render();
  if(park){park.setInteractive(!tour.complete);park.goTo(tour.complete?'entrance':tour.stop);}
  speak(currentSpeech);
 }else{render();ensureRecycling();speak(currentSpeech);}
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
$('prev-action').addEventListener('click',previousPark);$('task-action').addEventListener('click',toggleTask);
$('choice-buttons').addEventListener('click',event=>{const choice=event.target.closest('[data-choice]');if(choice)(mode==='nature'?selectPark:selectRecycle)(choice.dataset.choice);});
$('primary-action').addEventListener('click',()=>mode==='nature'?primaryPark():primaryRecycle());
$('secondary-action').addEventListener('click',()=>switchMode('nature'));
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
 const {createPark}=await import('./park-scene.js?v=3');
 park=createPark($('park-world'),{reducedMotion:preferences.reducedMotion,onSelect:selection=>{if(mode==='nature'&&selection?.key)selectPark(selection.key);},onAction:parkAction,onArrive:arrive,onReady:()=>{if(engines.park!=='failed'){engines.park='ready';render();}},onError:()=>engineError('park')});
 engines.park='ready';park.goTo(tour.stop);park.setGrowthStage(tour.growth);park.setConditions({sun:true,water:true,air:true});render();
}catch{engineError('park');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.speechSynthesis?.cancel();});window.addEventListener('pagehide',()=>{window.speechSynthesis?.cancel();park?.dispose();garden?.dispose();},{once:true});
