const $ = id => document.getElementById(id);
const paths = {
 volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6"/>',
 sliders:'<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4m0-15.6-1.4 1.4M5.6 18.4l-1.4 1.4"/>',
 sprout:'<path d="M12 21v-9M12 15C5 15 3 11 3 6c6 0 9 3 9 9Zm0-3c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',
 recycle:'<path d="m8 6 2-3a2 2 0 0 1 3.5 0l3 5m-1-4 1 4-4 .3M18 11l3 5a2 2 0 0 1-1.7 3H14m3-3-3 3 3 3M10 19H4.7A2 2 0 0 1 3 16l3-5m-4 1 4-1 1 4"/>',
 rotate:'<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
 hand:'<path d="M8 13V5a2 2 0 0 1 4 0v6-1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v6c0 4-3 5-6 5h-2c-2 0-3-1-4-3l-3-5a2 2 0 0 1 3-2l2 2"/>',
 sparkle:'<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 leaf:'<path d="M20 3C6 2 1 9 6 16s17 4 14-13ZM4 22 17 7"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1 3 7 3 8 0M8 9h.01M16 9h.01"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
};
const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.sparkle}</svg>`;
const art = key => {
 const flower = '<path d="M50 86V44" stroke="#6b9251" stroke-width="5" stroke-linecap="round"/><path d="M48 72C27 74 26 59 27 59c17-2 21 13 21 13M52 63c19-2 22-15 22-15-18-1-22 15-22 15" fill="#91ad67"/><g fill="#e8a1a7"><ellipse cx="50" cy="25" rx="10" ry="17"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(60 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(120 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(180 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(240 50 40)"/><ellipse cx="50" cy="25" rx="10" ry="17" transform="rotate(300 50 40)"/></g><circle cx="50" cy="40" r="12" fill="#edbf57"/><ellipse cx="50" cy="89" rx="19" ry="4" fill="#aebd8c" opacity=".35"/>';
 const tree = '<ellipse cx="50" cy="90" rx="27" ry="5" fill="#b4c499" opacity=".4"/><path d="M44 88V39h12v49z" fill="#a67c54"/><path d="m50 64-14-14m15 6 13-15" stroke="#a67c54" stroke-width="7" stroke-linecap="round"/><circle cx="31" cy="40" r="20" fill="#76995e"/><circle cx="67" cy="39" r="22" fill="#6c9056"/><circle cx="49" cy="25" r="24" fill="#89aa6c"/><circle cx="41" cy="39" r="20" fill="#85a567"/>';
 const grass = '<ellipse cx="50" cy="87" rx="36" ry="6" fill="#b4c499" opacity=".4"/><path d="M19 86c0-14-4-31-9-40 17 5 22 20 23 35-1-24-5-39-10-50 19 9 23 28 22 50 1-40 7-55 16-62-4 28-6 43-5 64 5-31 15-45 28-51-8 17-14 34-15 52 8-17 17-25 23-27-7 11-9 22-10 29Z" fill="#7a9e55"/><path d="M34 86c-1-17-5-28-7-34 14 8 17 19 17 31 2-21 6-32 10-42 3 17 3 29 2 44 8-18 14-27 19-31-1 13-4 22-7 32Z" fill="#91b46d"/>';
 const newspaper = '<g transform="rotate(-9 50 50)"><rect x="15" y="18" width="70" height="67" rx="5" fill="#dedbc7"/><rect x="12" y="14" width="70" height="67" rx="4" fill="#fff9df" stroke="#b4b79b" stroke-width="1.7"/><path d="M22 27h49" stroke="#506951" stroke-width="6"/><rect x="22" y="38" width="22" height="20" rx="1" fill="#a2ba8d"/><path d="M51 40h20m-20 8h20m-20 8h20M22 65h49m-49 7h49" stroke="#a3ad95" stroke-width="3"/></g>';
 const can = '<ellipse cx="50" cy="86" rx="22" ry="5" fill="#9cae9b" opacity=".3"/><path d="M31 22h38v57c0 10-38 10-38 0z" fill="#bdcdd0" stroke="#8da4a5" stroke-width="1.3"/><path d="M31 36h38v33H31z" fill="#e5bc59"/><path d="m46 42 12 9-12 12" stroke="#fff3c9" stroke-width="3" fill="none"/><ellipse cx="50" cy="22" rx="19" ry="7" fill="#e5e7dd" stroke="#8da4a5" stroke-width="1.5"/><ellipse cx="50" cy="22" rx="6" ry="2" fill="none" stroke="#93a6a4" stroke-width="2"/>';
 const bottle = '<ellipse cx="50" cy="89" rx="20" ry="5" fill="#9cae9b" opacity=".3"/><path d="M42 22v9c0 6-10 10-10 19v30c0 11 36 11 36 0V50c0-9-10-13-10-19v-9" fill="#a5cfc4" stroke="#83b0a5" stroke-width="1.5"/><rect x="40" y="13" width="20" height="12" rx="3" fill="#e6bd57"/><path d="M33 51h34v22H33z" fill="#fff6db"/><path d="m45 58 5-3 5 3v6l-5 3-5-3z" fill="none" stroke="#84a779" stroke-width="2"/><path d="M39 39v8m0 29v4" stroke="#d5e9dc" stroke-width="3" stroke-linecap="round"/>';
 const box = '<path d="m17 33 30-17 36 18-32 18Z" fill="#d9bc86"/><path d="m17 33 34 19v36L17 68Z" fill="#c5a172"/><path d="m51 52 32-18v36L51 88Z" fill="#e3c995"/><path d="m31 25 36 19v15l-10 5V49L23 30" fill="#f1d9a4"/><path d="m60 67 7-4 7 4m-7-4v12" fill="none" stroke="#8e8e5f" stroke-width="3"/>';
 const tin = '<path d="M26 27h48v49c0 12-48 12-48 0z" fill="#b7c5b9" stroke="#8e9f94" stroke-width="1.5"/><ellipse cx="50" cy="27" rx="24" ry="8" fill="#dde2d4" stroke="#8e9f94" stroke-width="1.5"/><path d="M27 42q23 10 46 0M27 52q23 10 46 0M27 62q23 10 46 0M27 72q23 10 46 0" stroke="#8e9f94" fill="none" stroke-width="2"/>';
 const container = '<path d="m18 39 5 39c2 11 52 11 54 0l5-39" fill="#b8d1c2" stroke="#8aab96" stroke-width="1.5"/><ellipse cx="50" cy="39" rx="33" ry="12" fill="#7da48b"/><ellipse cx="50" cy="35" rx="33" ry="12" fill="#95b49c" stroke="#6f957f" stroke-width="1.5"/><path d="M31 53v23" stroke="#d8e8d9" stroke-width="3" stroke-linecap="round"/>';
 const trophy = '<circle cx="50" cy="46" r="31" fill="#e5e9bb"/><path d="m50 23 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z" fill="#d7b85a"/><path d="m35 70-5 20 20-9 20 9-5-20" fill="#8ba36b"/>';
 const map={flower,tree,grass,newspaper,can,bottle,box,tin,container,trophy};
 if (['paper','metal','plastic'].includes(key)) {
   const color={paper:'#5c92c2',metal:'#e7bd55',plastic:'#a47a58'}[key];
   return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 24h52v59c0 5-52 5-52 0z" fill="${color}"/><rect x="21" y="18" width="58" height="12" rx="4" fill="${color}"/><path d="M38 35h24" stroke="#415447" stroke-width="5" stroke-linecap="round"/><rect x="32" y="45" width="36" height="29" rx="3" fill="#fffbed"/><path d="m44 54 6-4 6 4m-6-4v12m-6 1-3-6 3-6m-3 6h13m5-3 3 6-3 6m3-6H49" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="32" cy="88" r="4" fill="#637162"/><circle cx="68" cy="88" r="4" fill="#637162"/></svg>`;
 }
 return `<svg viewBox="0 0 100 100" aria-hidden="true">${map[key] || flower}</svg>`;
};
const plants = [
 {key:'flower',name:'花',en:'FLOWER',description:'花有美麗的花瓣。',voice:'這是花。花有美麗的花瓣。'},
 {key:'tree',name:'樹',en:'TREE',description:'樹有樹幹和樹葉。',voice:'這是樹。樹有樹幹和樹葉。'},
 {key:'grass',name:'草',en:'GRASS',description:'草長在地上。',voice:'這是草。草長在地上。'}
];
const bins = [
 {key:'paper',name:'廢紙',en:'藍色回收箱',color:'藍色',example:'報紙、紙盒'},
 {key:'metal',name:'金屬',en:'黃色回收箱',color:'黃色',example:'鋁罐、金屬罐'},
 {key:'plastic',name:'塑膠',en:'啡色回收箱',color:'啡色',example:'膠樽、塑膠容器'}
];
const items = [
 {key:'newspaper',name:'報紙',bin:'paper',category:'紙製品'},
 {key:'can',name:'鋁罐',bin:'metal',category:'金屬製品'},
 {key:'bottle',name:'膠樽',bin:'plastic',category:'塑膠製品'},
 {key:'box',name:'紙盒',bin:'paper',category:'紙製品'},
 {key:'tin',name:'金屬罐',bin:'metal',category:'金屬製品'},
 {key:'container',name:'塑膠容器',bin:'plastic',category:'塑膠製品'}
];
let stored = {};
try {stored=JSON.parse(localStorage.getItem('green-garden-settings') || '{}') || {};} catch {}
const preferences = {sound:stored.sound !== false,reducedMotion:stored.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches,largeText:!!stored.largeText,difficulty:stored.difficulty==='extended'?'extended':'basic'};
const state = {mode:'nature',stage:'explore',index:0,selected:'flower',answered:false,hint:null,feedback:null,picked:false};
let garden = null;
let currentSpeech = '';
let lastSceneItem = undefined;
let sceneZoom = 1;
const count = () => state.mode==='nature'?3:preferences.difficulty==='extended'?6:3;
const currentPlant = () => plants[state.index];
const currentItem = () => items[state.index];
const save = () => {try {localStorage.setItem('green-garden-settings',JSON.stringify(preferences));} catch {}};
function paintIcons(root=document) {root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function speak(text,force=false) {
 if ((!preferences.sound && !force) || !('speechSynthesis' in window)) return;
 window.speechSynthesis.cancel();
 const utterance = new SpeechSynthesisUtterance(text);
 const voices = window.speechSynthesis.getVoices();
 const voice = voices.find(v=>/^zh[-_]HK$/i.test(v.lang)) || voices.find(v=>/yue/i.test(v.lang)) || voices.find(v=>/^zh[-_]TW$/i.test(v.lang)) || voices.find(v=>/^zh/i.test(v.lang));
 if(voice) utterance.voice=voice;
 utterance.lang=voice?.lang || 'zh-HK';utterance.rate=.8;utterance.pitch=1;
 utterance.onerror=()=>{$('voice-note').textContent='此裝置暫時無法播放語音。可以繼續按畫面文字及圖片學習。';};
 window.speechSynthesis.speak(utterance);
}
function applyPreferences() {
 document.body.classList.toggle('large-text',preferences.largeText);
 document.body.classList.toggle('reduce-motion',preferences.reducedMotion);
 $('sound-toggle').setAttribute('aria-pressed',String(preferences.sound));
 $('sound-toggle').setAttribute('aria-label',preferences.sound?'關閉語音':'開啟語音');
 $('sound-label').textContent=preferences.sound?'語音開啟':'語音關閉';
 $('sound-toggle').querySelector('[data-icon]').innerHTML=icon(preferences.sound?'volume':'muted');
 $('reduce-motion').checked=preferences.reducedMotion;$('large-text').checked=preferences.largeText;$('difficulty').value=preferences.difficulty;
 garden?.setMotion(!preferences.reducedMotion);
}
function choiceMarkup(option) {
 const isQuiz=state.stage==='practice' || state.mode==='recycle';
 const active=option.key===state.selected && (!isQuiz || state.answered);
 const locked=state.stage==='complete' || (isQuiz && state.answered);
 return `<button class="choice ${option.key} ${active?'active':''} ${state.hint===option.key?'hint':''}" data-choice="${option.key}" aria-label="${option.name}${option.color?'，'+option.en:''}" ${!isQuiz?`aria-pressed="${active}"`:''} ${locked?'aria-disabled="true"':''}><span class="choice-illustration">${art(option.key)}</span><span class="choice-text"><strong>${option.name}</strong><small>${option.en}</small></span><span class="choice-check">${icon('check')}</span></button>`;
}
function render() {
 const focusedChoice=document.activeElement?.dataset?.choice;
 const nature=state.mode==='nature',complete=state.stage==='complete',quiz=state.stage==='practice';
 $('tab-nature').classList.toggle('active',nature);$('tab-recycle').classList.toggle('active',!nature);
 $('tab-nature').setAttribute('aria-pressed',String(nature));$('tab-recycle').setAttribute('aria-pressed',String(!nature));
 $('scene-label').textContent=nature?'我的小花園':'香港三色回收站';
 $('scene-caption').textContent=nature?'直接點選 3D 植物聽介紹，按住也可以拖動。':'直接拖入箱內，或先點物品，再點回收箱。';
 $('garden').setAttribute('aria-label',nature?'可點選或拖動的立體花、樹、草。也可使用下方大按鈕。':'把前方立體回收物拖進回收箱，或先點物品再點回收箱。也可使用下方大按鈕。');
 $('choice-buttons').setAttribute('aria-label',nature?'選擇植物':'選擇回收箱');
 $('choice-buttons').innerHTML=(nature?plants:bins).map(choiceMarkup).join('');
 if(focusedChoice) $('choice-buttons').querySelector(`[data-choice="${focusedChoice}"]`)?.focus({preventScroll:true});
 $('activity-label').textContent=complete?'完成練習':nature?(quiz?'找一找遊戲':'認識植物'):'回收小練習';
 $('progress').hidden=nature&&!quiz&&!complete;
 if(!$('progress').hidden) {
  $('progress').setAttribute('aria-label',complete?`已完成全部 ${count()} 個`:`第 ${state.index+1} 個，共 ${count()} 個`);
  $('progress').innerHTML=Array.from({length:count()},(_,i)=>`<span class="progress-dot ${complete||i<state.index?'done':i===state.index?'current':''}" aria-hidden="true"></span>`).join('');
 }
 let picture,title,description,kicker,feedback,button;
 if(complete) {
  picture='trophy';kicker='每一小步，都是進步';title='做到了！';description=nature?'你認識了花、樹、草。':'你認識了三色回收箱。';
  feedback={kind:'success',text:nature?'謝謝你愛護大自然！':'謝謝你一起做環保！'};button='再練習一次';
 } else if(nature) {
  const plant=quiz?currentPlant():plants.find(p=>p.key===state.selected);
  picture=plant.key;kicker=quiz?`第 ${state.index+1} 個・找一找`:'大自然的朋友';title=quiz?`請按「${plant.name}」`:`這是${plant.name}`;description=quiz?'點選 3D 植物，也可拖動它。':plant.description;
  feedback=state.feedback || {kind:'',text:quiz?'看一看，再點一下或拖一拖。':'點一點、拖一拖，認識花、樹、草。'};
  button=quiz?(state.answered?(state.index===2?'看看成果':'下一個'):'提示我'):'開始找一找';
 } else {
  const item=currentItem();picture=item.key;kicker=`第 ${state.index+1} 件・${item.category}`;title=`這是${item.name}`;description=state.picked?'請點一個回收箱。':`把${item.name}拖進回收箱。`;
  feedback=state.feedback || {kind:'',text:'也可先點物品，再點一個回收箱。'};
  button=state.answered?(state.index===count()-1?'看看成果':'下一個'):'提示我';
 }
 $('object-picture').innerHTML=art(picture);$('object-kicker').textContent=kicker;$('activity-title').textContent=title;$('activity-description').textContent=description;
 $('touch-prompt').innerHTML=`<span class="touch-picture">${art(picture)}</span><span><strong>${!nature&&!complete?`${currentItem().name}放在哪個回收箱？`:title}</strong><small>${state.feedback?feedback.text:complete?description:nature?(quiz?'請按下面的按鈕。':description):'請按下面的回收箱。'}</small></span>`;
 $('interaction-help').hidden=complete;
 $('interaction-help').innerHTML=nature?'點一下 3D 植物聽介紹。<br>按住植物，也可以拖動它。':'方法一：按住物品，拖進箱內。<br>方法二：點物品，再點回收箱。';
 $('item-actions').hidden=nature||complete;
 $('pickup-action').disabled=state.answered;
 $('pickup-action').setAttribute('aria-pressed',String(state.picked));
 $('pickup-label').textContent=nature?'拿起物品':state.answered?'已放入回收箱':state.picked?`已拿起${currentItem().name}`:`拿起${currentItem().name}`;
 $('return-action').disabled=!state.picked||state.answered||complete;
 $('view-reset').disabled=state.answered||complete;
 const sceneMessage=complete?'做到了！可以再練習一次。':state.feedback?feedback.text:nature?(quiz?`請點「${currentPlant().name}」，也可以拖動它。`:'點一下花、樹或草，也可按住拖動。'):`把${currentItem().name}拖進回收箱。`;
 $('scene-status').textContent=sceneMessage;
 $('scene-status').className=`scene-status ${state.picked?'held':feedback.kind}`;
 $('feedback').className=`feedback ${feedback.kind}`;$('feedback-text').textContent=feedback.text;
 $('feedback').querySelector('[data-icon]').innerHTML=icon(feedback.kind==='success'?'check':feedback.kind==='retry'?'leaf':'sparkle');
 $('primary-label').textContent=button;
 $('secondary-action').hidden=nature&&state.stage==='explore';$('secondary-action').textContent=nature?'返回認識植物':'重新開始這一輪';
 $('bottom-title').textContent=nature?'愛護花草，從認識開始':'回收前，做一做';
 $('bottom-copy').textContent=nature?'花、樹、草，都是我們的好朋友。':'倒清、洗淨、晾乾，再放進合適的回收箱。';
 $('gentle-note').textContent='慢慢來，按錯了也可以再試。';
 currentSpeech=complete?`${title}${description}${feedback.text}`:state.feedback?feedback.text:`${title}。${description}`;
 if(garden) {
  garden.focus(state.hint || state.selected);
  const nextItem=nature||complete?null:currentItem().key;
  if(lastSceneItem!==nextItem){garden.showItem(nextItem);lastSceneItem=nextItem;}
  garden.setInteraction({enabled:!complete&&!state.answered,completed:complete||state.answered});
 }
}
function reset(mode) {
 window.speechSynthesis?.cancel();
 Object.assign(state,{mode,stage:mode==='nature'?'explore':'practice',index:0,selected:mode==='nature'?'flower':null,answered:false,hint:null,feedback:null,picked:false});
 garden?.setMode(mode);lastSceneItem=undefined;render();
}
function select(key) {
 if(state.stage==='complete')return;
 if(key==='item'){pickUp();return;}
 const valid=state.mode==='nature'?plants:bins;
 if(!valid.some(o=>o.key===key))return;
 if(state.mode==='nature'&&state.stage==='explore') {
  state.selected=key;state.feedback=null;render();speak(plants.find(p=>p.key===key).voice);return;
 }
 if(state.answered)return;
 const expected=state.mode==='nature'?currentPlant().key:currentItem().bin;
 if(key===expected) {
  state.answered=true;state.selected=key;state.hint=null;state.picked=false;
  const bin=bins.find(b=>b.key===key);
  const text=state.mode==='nature'?`做到了！這是${currentPlant().name}。`:`做到了！${currentItem().name}放入${bin.color}回收箱，回收${bin.name}。`;
  state.feedback={kind:'success',text};render();if(state.mode==='recycle')garden?.putItem(key);garden?.celebrate(key);speak(text);
 } else {
  state.hint=expected;state.picked=false;
  const text=state.mode==='nature'?`再試一次。找找「${currentPlant().name}」。`:`再試一次。找找${bins.find(b=>b.key===expected).color}的「${bins.find(b=>b.key===expected).name}」回收箱。`;
  state.feedback={kind:'retry',text};render();if(state.mode==='recycle')garden?.returnItem();speak(text);
 }
}
function pickUp() {
 if(state.mode!=='recycle'||state.stage==='complete'||state.answered)return;
 state.picked=true;state.hint=null;
 state.feedback={kind:'',text:`已拿起${currentItem().name}。請點一個回收箱。`};
 render();garden?.takeItem();speak(currentSpeech);
}
function putBack() {
 if(state.mode!=='recycle'||state.stage==='complete'||state.answered)return;
 state.picked=false;state.feedback={kind:'',text:'放回原位了。可以再試。'};
 garden?.returnItem();render();speak(currentSpeech);
}
function drop(target) {
 if(state.mode!=='recycle'||state.stage==='complete'||state.answered)return;
 if(target)select(target);else putBack();
}
function updateZoom() {
 $('zoom-out').disabled=sceneZoom<=1;
 $('zoom-in').disabled=sceneZoom>=1.25;
 garden?.setZoom(sceneZoom);
}
function hint() {
 if(state.mode==='nature') {state.hint=currentPlant().key;state.feedback={kind:'',text:`找找「${currentPlant().name}」。它的按鈕有外框提示。`};}
 else {const bin=bins.find(b=>b.key===currentItem().bin);state.hint=bin.key;state.feedback={kind:'',text:`${currentItem().name}是${bin.name}，放入${bin.color}回收箱。`};}
 render();speak(currentSpeech);
}
function primary() {
 if(state.stage==='complete') {
  const mode=state.mode;reset(mode);if(mode==='nature'){state.stage='practice';state.selected=null;render();}
 } else if(state.mode==='nature'&&state.stage==='explore') {
  Object.assign(state,{stage:'practice',index:0,selected:null,answered:false,hint:null,feedback:null,picked:false});render();
 } else if(!state.answered) {hint();return;}
 else {
  if(state.index+1===count()){state.stage='complete';state.hint=null;state.selected=null;state.feedback=null;render();}
  else{Object.assign(state,{index:state.index+1,selected:null,answered:false,hint:null,feedback:null,picked:false});render();}
 }
 speak(currentSpeech);
}
paintIcons();applyPreferences();render();updateZoom();
$('tab-nature').addEventListener('click',()=>{if(state.mode!=='nature'){reset('nature');speak('一起認識花、樹、草。按一按，認識新朋友。');}});
$('tab-recycle').addEventListener('click',()=>{if(state.mode!=='recycle'){reset('recycle');speak(currentSpeech);}});
$('choice-buttons').addEventListener('click',event=>{const choice=event.target.closest('[data-choice]');if(choice)select(choice.dataset.choice);});
$('primary-action').addEventListener('click',primary);
$('secondary-action').addEventListener('click',()=>{reset(state.mode);speak(currentSpeech);});
$('pickup-action').addEventListener('click',pickUp);
$('return-action').addEventListener('click',putBack);
$('zoom-in').addEventListener('click',()=>{sceneZoom=Math.min(1.25,Math.round((sceneZoom+.125)*1000)/1000);updateZoom();});
$('zoom-out').addEventListener('click',()=>{sceneZoom=Math.max(1,Math.round((sceneZoom-.125)*1000)/1000);updateZoom();});
$('listen').addEventListener('click',()=>speak(currentSpeech,true));
$('sound-toggle').addEventListener('click',()=>{preferences.sound=!preferences.sound;save();applyPreferences();if(preferences.sound)speak(currentSpeech);else window.speechSynthesis?.cancel();});
$('settings-open').addEventListener('click',()=>{$('settings').showModal();});
$('settings').addEventListener('click',event=>{if(event.target===$('settings')){const r=$('settings').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('settings').close();}});
$('reduce-motion').addEventListener('change',event=>{preferences.reducedMotion=event.target.checked;save();applyPreferences();});
$('large-text').addEventListener('change',event=>{preferences.largeText=event.target.checked;save();applyPreferences();});
$('difficulty').addEventListener('change',event=>{preferences.difficulty=event.target.value;save();if(state.mode==='recycle')reset('recycle');});
$('view-reset').addEventListener('click',()=>{if(state.answered||state.stage==='complete')return;state.picked=false;state.feedback={kind:'',text:'位置已還原。可以繼續學習。'};garden?.resetLayout();sceneZoom=1;updateZoom();render();speak(currentSpeech);});
if(!('speechSynthesis' in window)) {
 $('voice-note').textContent='此瀏覽器未支援語音。所有指示均有文字及圖片，可以繼續學習。';
 $('listen').hidden=true;$('sound-toggle').hidden=true;
}
function sceneError(){
 const canvas=$('garden').querySelector('canvas');if(canvas)canvas.style.visibility='hidden';
 $('scene-loading').hidden=false;
 $('scene-loading').innerHTML=`<span class="fallback-garden">${art('tree')}${art('flower')}${art('grass')}</span><span>3D 暫時未能顯示<br>仍可按下方大按鈕繼續學習。</span>`;
 $('scene-loading').classList.add('fallback');
 $('garden').setAttribute('aria-label','3D 未能顯示。請使用下方大按鈕完成全部學習活動。');
}
try {
 const {createGarden}=await import('./scene.js');
 garden=createGarden($('garden'),{onSelect:select,onDrop:drop,reducedMotion:preferences.reducedMotion,onReady:()=>{$('scene-loading').hidden=true;},onError:sceneError});
 garden.setMode(state.mode);lastSceneItem=undefined;render();updateZoom();
} catch {sceneError();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.speechSynthesis?.cancel();});
window.addEventListener('pagehide',()=>{window.speechSynthesis?.cancel();garden?.dispose();},{once:true});
