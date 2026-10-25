(() => {
  'use strict';
  const C = window.Classroom;
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  // Capture a clean shell once: exports never serialize live inputs, unlocked panels or transient UI.
  const cleanShell = document.documentElement.cloneNode(true);
  const prefix = 'tch-classroom-v4:';
  const pointerKey = prefix + 'active:' + location.pathname;
  let data, storageError = '', recoveryNotice = '';
  let admin = false, tab = 'lesson', hwView = 'single', pickerMode = 'slot', selectedHw = '';
  let editingRecords = false, conflicted = false, remoteData = null, exportedRevision = -1;
  let toastTimeout, fileHandle = null, writing = false, drawing = false, pickedResult = '', finalWheel = null;
  const tr = (zh,en) => data.lang === 'en' ? en : data.lang === 'bi' && zh !== en ? `${zh} / ${en}` : zh;
  const translate = s => {const [zh,en=zh] = s.split('|');return tr(zh,en);};
  function el(tag, text, className) {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
  function button(text, fn, className='') {const b=el('button',text,className);b.type='button';b.addEventListener('click',fn);return b;}
  function toast(message) {clearTimeout(toastTimeout);$('toast').textContent=message;$('toast').hidden=false;toastTimeout=setTimeout(()=>$('toast').hidden=true,4500);}
  function read(key) {try{return localStorage.getItem(key);}catch{storageError='unavailable';return null;}}
  try {
    const embedded = JSON.parse($('embedded-data').textContent);
    if (embedded) {
      data=C.validate(embedded);
      const cached=read(prefix+data.id);
      if(cached) {try {const candidate=C.validate(JSON.parse(cached));if(candidate.id===data.id && candidate.revision>data.revision)data=candidate;} catch {recoveryNotice='corrupt';}}
    } else {
      const id=read(pointerKey), cached=id?read(prefix+id):null;
      if(cached)data=C.validate(JSON.parse(cached));
      else data=C.createData();
    }
  } catch {
    // Keep unreadable original data untouched; use a new dataset until an explicit restore.
    data=C.createData();recoveryNotice='corrupt';
  }
  function persist() {
    try {localStorage.setItem(prefix+data.id,JSON.stringify(data));localStorage.setItem(pointerKey,data.id);storageError='';}
    catch {storageError='unavailable';}
    updateSaveStatus();
  }
  function canEdit() {return admin && !conflicted;}
  function change(fn) {
    if(conflicted)return false;
    fn(data);C.touch(data);persist();return true;
  }
  function updateSaveStatus() {
    if(!$('save-status'))return;
    $('save-status').textContent=storageError?tr('本機自動儲存失敗。請立即匯出備份，避免關閉後遺失。','Local autosave failed. Export a backup before closing.'):
      recoveryNotice?tr('偵測到無法讀取的舊資料，已保留原始儲存。請匯入有效備份復原。','Unreadable stored data was preserved. Import a valid backup to recover.'):
      tr('已自動儲存在此瀏覽器','Autosaved in this browser') + (data.updatedAt?` · ${new Date(data.updatedAt).toLocaleTimeString(data.lang==='en'?'en-GB':'zh-HK')}`:'');
    $('save-status').classList.toggle('warning',!!storageError||!!recoveryNotice);
  }
  function ask(title,message) {
    if($('confirm-dialog').open)return Promise.resolve(false);
    $('confirm-title').textContent=title;$('confirm-text').textContent=message;
    return new Promise(resolve=>{$('confirm-dialog').addEventListener('close',()=>resolve($('confirm-dialog').returnValue==='ok'),{once:true});$('confirm-dialog').showModal();});
  }
  function applyLanguage() {
    document.documentElement.lang=data.lang==='en'?'en':'zh-Hant';
    $$('[data-t]').forEach(n=>n.textContent=translate(n.dataset.t));
    $$('[data-ph]').forEach(n=>n.placeholder=translate(n.dataset.ph));
    $('language').textContent=data.lang==='zh'?'English':data.lang==='en'?'中英雙語':'繁體中文';
    renderLesson();renderPicker();renderHomework();updateTimer();updateSaveStatus();
    if(admin)renderAdminLists();
  }
  function switchTab(name) {
    if(!['lesson','picker','timer','homework','admin'].includes(name))return;
    tab=name;$$('.page').forEach(n=>n.hidden=n.id!==name);
    $$('[data-tab]').forEach(n=>{n.classList.toggle('active',n.dataset.tab===name);n.setAttribute('aria-current',n.dataset.tab===name?'page':'false');});
    if(name==='lesson')renderLesson();
    if(name==='homework')renderHomework();
    if(name==='picker')renderPicker();
    if(name==='admin') {renderAdmin();setTimeout(()=>{if(!admin)$('password').focus();},0);}
  }
  function renderFlow(container, flow) {
    container.replaceChildren();
    if(!flow.length) {container.append(el('p',tr('尚未加入流程步驟','No lesson steps yet'),'muted'));return;}
    flow.forEach((step,i)=>{const row=el('div',undefined,'flow-step');row.append(el('span',String(i+1).padStart(2,'0'),'step-number'));const body=el('div');body.append(el('span',step.time,'step-time'),el('h3',step.title||tr('未命名步驟','Untitled step')),el('p',step.detail,'prose'));row.append(body);container.append(row);});
  }
  function renderLesson() {
    const l=data.lesson;
    $('lesson-date').textContent=l.date || tr('新的一課','A NEW LESSON');
    $('lesson-title').textContent=l.title || tr('今天，我們學甚麼？','What are we learning today?');
    $('lesson-goals').textContent=l.objectives || tr('在後台加入這一課的學習目標。','Add your learning goals at the teacher desk.');
    $('lesson-materials').textContent=l.materials;$('materials-block').hidden=!l.showMaterials;
    $('lesson-announcement').textContent=l.announcement;$('announcement-block').hidden=!l.showAnnouncement;
    $('flow-count').textContent=tr(`${l.flow.length} 個步驟`,`${l.flow.length} steps`);
    renderFlow($('lesson-flow'),l.flow);
    const empty=!l.title&&!l.objectives&&!l.flow.length;
    $('lesson-empty').hidden=!empty;document.querySelector('.lesson-grid').hidden=empty;
    $('previous').disabled=!data.history.length;
    if(!$('previous-panel').hidden)renderPrevious();
  }
  function renderPrevious() {
    const panel=$('previous-panel');panel.replaceChildren();
    const l=data.history[0]?.lesson;if(!l)return;
    panel.append(el('p',tr('上一課','Previous lesson'),'eyebrow'),el('h2',l.title || tr('未命名課堂','Untitled lesson')),el('p',l.date,'muted'),el('p',l.objectives,'prose'));
    const flow=el('div');renderFlow(flow,l.flow);panel.append(flow);
    if(l.showAnnouncement)panel.append(el('p',l.announcement,'prose'));
    if(l.showMaterials)panel.append(el('p',l.materials,'prose'));
  }
  function renderAdmin() {
    $('login').hidden=admin;$('admin-panel').hidden=!admin;$('logout').hidden=!admin;
    if(!admin)return;
    $$('[data-lesson]').forEach(n=>{const value=data.lesson[n.dataset.lesson];if(n.type==='checkbox')n.checked=value;else n.value=value;});
    renderFlowEditor();renderAdminLists();updateSaveStatus();
    $('roster-input').value=data.students.map(s=>s.name).join('\n');
    $('file-status').textContent=fileHandle?tr(`已連接：${fileHandle.name}；尚未代表已寫入最新修改。`,`Connected: ${fileHandle.name}; this does not mean the latest edits have been written.`):
      tr('USB 寫入需支援檔案選擇器的瀏覽器並獲授權；不支援時請使用下載。','USB writing requires a supported browser and permission. Use Download otherwise.');
  }
  function renderFlowEditor() {
    const container=$('flow-editor');container.replaceChildren();
    data.lesson.flow.forEach((step,index)=>{
      const card=el('div',undefined,'flow-edit');card.dataset.stepId=step.id;
      const fields=el('div',undefined,'flow-edit-fields');
      for(const [key,label] of [['time',tr('時間','Time')],['title',tr('步驟標題','Step title')],['detail',tr('詳細說明','Details')]]) {
        const input=el(key==='detail'?'textarea':'input');input.value=step[key];input.setAttribute('aria-label',label);input.placeholder=label;input.dataset.field=key;
        if(key==='detail'){input.rows=2;card.append(input);}else fields.append(input);
        input.addEventListener('input',()=>{if(!canEdit())return;change(()=>{step[key]=input.value;});renderLesson();});
      }
      card.prepend(fields);
      const actions=el('div',undefined,'row');actions.append(el('span',`#${index+1}`,'muted'));
      const up=button(tr('↑ 上移','↑ Move up'),()=>moveStep(index,-1));up.disabled=index===0;
      const down=button(tr('↓ 下移','↓ Move down'),()=>moveStep(index,1));down.disabled=index===data.lesson.flow.length-1;
      actions.append(up,down,button(tr('刪除','Delete'),async()=>{
        if(!canEdit())return;
        if((step.time||step.title||step.detail) && !await ask(tr('刪除此步驟？','Delete this step?'),tr('其他步驟和已輸入文字會保留。','Other steps and their text will be kept.')))return;
        if(!canEdit())return;change(d=>{d.lesson.flow=d.lesson.flow.filter(s=>s.id!==step.id);});renderFlowEditor();renderLesson();
      }));card.append(actions);container.append(card);
    });
  }
  function moveStep(i,dir) {if(!canEdit())return;change(d=>{const [s]=d.lesson.flow.splice(i,1);d.lesson.flow.splice(i+dir,0,s);});renderFlowEditor();renderLesson();}
  function renderAdminLists() {
    $('roster-count').textContent=tr(`${data.students.length} 位學生`,`${data.students.length} students`);
    $('preset-list').replaceChildren();data.presets.forEach(p=>{
      const row=el('div',undefined,'list-item');row.append(el('span',p.name),button(tr('套用','Apply'),async()=>{
        if(!canEdit()||!await ask(tr('套用流程範本？','Apply flow template?'),tr('這會取代目前流程步驟，主題及目標會保留。','This replaces the current flow steps; the topic and goals stay.')))return;
        if(!canEdit())return;change(d=>{d.lesson.flow=C.clone(p.flow).map(s=>({...s,id:C.uid()}));});renderFlowEditor();renderLesson();
      }),button(tr('刪除','Delete'),async()=>{if(!canEdit()||!await ask(tr('刪除範本？','Delete template?'),p.name))return;if(!canEdit())return;change(d=>d.presets=d.presets.filter(x=>x.id!==p.id));renderAdminLists();}));$('preset-list').append(row);
    });
    if(!data.presets.length)$('preset-list').append(el('p',tr('把常用流程儲存為範本，下次一鍵套用。','Save a routine here to reuse it next time.'),'muted'));
    $('history-list').replaceChildren();data.history.forEach(h=>{
      const row=el('div',undefined,'list-item');row.append(el('span',`${h.lesson.date} · ${h.lesson.title || tr('未命名課堂','Untitled lesson')}`),button(tr('載入','Load'),async()=>{
        if(!canEdit()||!await ask(tr('載入歷史課堂？','Load archived lesson?'),tr('目前課堂會先自動封存，再載入此課。','The current lesson will be archived before loading this one.')))return;
        if(!canEdit())return;change(d=>{d.history.unshift({id:C.uid(),lesson:C.clone(d.lesson)});d.lesson=C.clone(h.lesson);});renderAdmin();renderLesson();
      }),button(tr('刪除','Delete'),async()=>{if(!canEdit()||!await ask(tr('刪除歷史課堂？','Delete archived lesson?'),h.lesson.title))return;if(!canEdit())return;change(d=>d.history=d.history.filter(x=>x.id!==h.id));renderAdminLists();renderLesson();}));$('history-list').append(row);
    });
    $('homework-list').replaceChildren();data.homework.forEach(h=>{
      const row=el('div',undefined,'list-item');row.append(el('span',h.name),button(tr('刪除','Delete'),async()=>{
        if(!canEdit()||!await ask(tr('刪除此習作？','Delete task?'),tr('這份習作的全班交收紀錄也會刪除。建議先匯出備份。','All submission records for this task will also be removed. Export a backup first.')))return;
        if(!canEdit())return;change(d=>{d.homework=d.homework.filter(x=>x.id!==h.id);delete d.records[h.id];});renderAdminLists();renderHomework();
      }));$('homework-list').append(row);
    });
  }
  const statusLabel = status => translate({missing:'○ 未交|○ Missing',submitted:'✓ 已交|✓ Submitted',late:'◷ 遲交|◷ Late',redo:'↺ 重作|↺ Redo'}[status]);
  function renderHomework() {
    if(!data.homework.some(h=>h.id===selectedHw))selectedHw=data.homework[0]?.id || '';
    $('hw-select').replaceChildren(...data.homework.map(h=>{const o=el('option',h.name);o.value=h.id;return o;}));$('hw-select').value=selectedHw;
    $$('[data-view]').forEach(n=>{n.classList.toggle('active',n.dataset.view===hwView);n.setAttribute('aria-pressed',n.dataset.view===hwView);});
    $('homework-selector').hidden=hwView==='matrix';$('missing-box').hidden=hwView==='matrix'||!selectedHw||!data.students.length;
    $('edit-records').checked=editingRecords;$('mark-all').hidden=!editingRecords||hwView==='matrix'||!selectedHw||!data.students.length;
    const table=$('hw-table');table.replaceChildren();
    const empty=!data.students.length||!data.homework.length;$('hw-empty').hidden=!empty;table.hidden=empty;
    const showRate=$('show-rate').checked;$('rate').hidden=!showRate||empty;
    const tasks=hwView==='matrix'?data.homework:data.homework.filter(h=>h.id===selectedHw);
    let received=0;for(const h of tasks)for(const s of data.students)if(['submitted','late'].includes(C.getStatus(data,h.id,s.id)))received++;
    const total=tasks.length*data.students.length;
    $('rate').textContent=tr(`繳交率（含遲交）：${total?Math.round(received/total*100):0}%`,`Submission rate (including late): ${total?Math.round(received/total*100):0}%`);
    const missing=data.students.filter(s=>C.getStatus(data,selectedHw,s.id)==='missing');
    $('missing-list').replaceChildren(...missing.map(s=>el('span',s.name,'chip')));
    if(!missing.length)$('missing-list').append(el('span',tr('沒有未交學生','No missing submissions'),'muted'));
    if(empty)return;
    const head=el('thead'),row=el('tr');row.append(el('th',tr('學生','Student')));tasks.forEach(h=>row.append(el('th',h.name)));head.append(row);table.append(head);
    const body=el('tbody'),query=$('student-search').value.trim().toLocaleLowerCase();
    data.students.forEach((s,i)=>{
      if(query&&!s.name.toLocaleLowerCase().includes(query))return;
      const row=el('tr');row.append(el('td',`${String(i+1).padStart(2,'0')}  ${s.name}`));
      for(const h of tasks) {
        const cell=el('td'),status=C.getStatus(data,h.id,s.id);
        const badge=editingRecords?button(statusLabel(status),()=>{
          if(!canEdit()||!editingRecords)return;
          change(d=>C.setStatus(d,h.id,s.id,C.statuses[(C.statuses.indexOf(status)+1)%4]));renderHomework();
        },`status ${status}`):el('span',statusLabel(status),`status ${status}`);
        if(editingRecords)badge.setAttribute('aria-label',`${s.name} · ${h.name} · ${statusLabel(status)}`);
        cell.append(badge);row.append(cell);
      }body.append(row);
    });
    if(!body.children.length){const row=el('tr'),cell=el('td',tr('沒有符合的學生','No matching students'));cell.colSpan=tasks.length+1;row.append(cell);body.append(row);}table.append(body);
  }
  function renderPicker() {
    $$('[data-picker]').forEach(n=>{n.disabled=drawing;n.classList.toggle('active',n.dataset.picker===pickerMode);n.setAttribute('aria-pressed',n.dataset.picker===pickerMode);});
    $('shuffle-name').hidden=pickerMode!=='slot';$('wheel-box').hidden=pickerMode!=='wheel';
    $('picked-name').textContent=pickedResult || '—';
    $('picker-count').textContent=tr(`已抽 ${data.picked.length} · 未抽 ${data.students.length-data.picked.length}`,`Picked ${data.picked.length} · Remaining ${data.students.length-data.picked.length}`);
    $('draw').disabled=drawing||!data.students.length||data.picked.length>=data.students.length||conflicted;
    $('reset-picker').disabled=drawing||!data.picked.length;
    $('picked-list').replaceChildren(...data.picked.map(id=>el('span',data.students.find(s=>s.id===id)?.name||'','chip')));
    if(!data.students.length)$('picker-count').textContent=tr('請先在後台加入學生名單','Add a roster at the teacher desk first');
    else if(data.picked.length===data.students.length)$('picker-count').textContent=tr('全班已抽完，開始新一輪吧。','Everyone has had a turn. Start a new round.');
    if(pickerMode==='wheel'&&!drawing)drawWheel(finalWheel?.angle || 0,finalWheel?.winner || null);
  }
  function drawWheel(rotation, winner=null) {
    const canvas=$('wheel'),ctx=canvas.getContext('2d');if(!ctx)return;
    const candidates=data.students.filter(s=>!data.picked.includes(s.id)||s.id===winner),count=candidates.length;
    ctx.clearRect(0,0,640,640);ctx.save();ctx.translate(320,320);ctx.rotate(rotation);
    if(!count){ctx.fillStyle='#e4e5fa';ctx.beginPath();ctx.arc(0,0,300,0,Math.PI*2);ctx.fill();}
    const colors=['#dadcf8','#eee7f8','#e0eee9','#f8edda','#e0eaf7'];
    candidates.forEach((s,i)=>{
      const a=i/count*Math.PI*2-Math.PI/2,b=(i+1)/count*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,300,a,b);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
      ctx.save();ctx.rotate((a+b)/2);ctx.textAlign='right';ctx.fillStyle='#37405a';ctx.font=`700 ${count>25?16:count>15?21:27}px sans-serif`;ctx.fillText(s.name.length>8?s.name.slice(0,8)+'…':s.name,272,8);ctx.restore();
    });ctx.restore();ctx.beginPath();ctx.arc(320,320,28,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  }
  function random() {const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]/4294967296;}
  async function pick() {
    if(drawing||conflicted)return;
    const student=C.choose(data,random);if(!student)return;
    const datasetId=data.id;finalWheel=null;drawing=true;pickedResult='';renderPicker();
    const candidates=data.students.filter(s=>!data.picked.includes(s.id)),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:2200;
    const index=candidates.findIndex(s=>s.id===student.id),target=Math.PI*8-(index+.5)/candidates.length*Math.PI*2;
    await new Promise(resolve=>{
      const start=performance.now();function frame(now){const p=duration?Math.min(1,(now-start)/duration):1,ease=1-Math.pow(1-p,3);
        if(pickerMode==='wheel')drawWheel(target*ease);
        else $('shuffle-name').textContent=candidates[Math.floor(random()*candidates.length)].name;
        if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);
    });
    if(!conflicted&&datasetId===data.id) {
      change(d=>d.picked.push(student.id));pickedResult=student.name;$('shuffle-name').textContent=student.name;
      if(pickerMode==='wheel'){finalWheel={angle:target,winner:student.id};drawWheel(target,student.id);}
    }
    drawing=false;
    renderPicker();
  }
  let timer={total:300,left:300,deadline:0,running:false,task:'',size:'28'};
  let audioContext;
  try {const saved=JSON.parse(sessionStorage.getItem(prefix+'timer')||'null');if(saved&&Number.isFinite(saved.total)&&saved.total>0&&saved.total<=10800&&Number.isFinite(saved.left)&&saved.left>=0&&Number.isFinite(saved.deadline))timer={...timer,...saved};}catch{}
  if(timer.running){timer.left=C.remaining(timer.deadline,Date.now());if(!timer.left)timer.running=false;}
  $('timer-task').value=timer.task;$('task-size').value=['28','40','56'].includes(timer.size)?timer.size:'28';$('timer-task').style.fontSize=$('task-size').value+'px';
  function saveTimer(){try{sessionStorage.setItem(prefix+'timer',JSON.stringify(timer));}catch{}}
  function updateTimer() {
    if(timer.running){timer.left=C.remaining(timer.deadline,Date.now());if(!timer.left){timer.running=false;saveTimer();if($('timer-sound').checked)alarm();}}
    $('timer-display').textContent=`${String(Math.floor(timer.left/60)).padStart(2,'0')}:${String(timer.left%60).padStart(2,'0')}`;
    const percent=Math.min(100,Math.max(0,Math.round(timer.left/timer.total*100)));
    $('timer-progress').style.width=percent+'%';$('timer-percent').textContent=percent+'%';
    document.querySelector('.progress').setAttribute('aria-valuenow',percent);document.querySelector('.progress').classList.toggle('ending',percent<=20);
    $('start-timer').disabled=timer.running||timer.left===0;$('pause-timer').disabled=!timer.running;
    $('timer-message').textContent=timer.left===0?tr('時間到，辛苦了！','Time is up. Well done!'):timer.running?tr('專注進行中','Focus time'):'';
  }
  function setTimer(seconds){timer.total=seconds;timer.left=seconds;timer.running=false;timer.deadline=0;saveTimer();updateTimer();}
  function alarm(){try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.frequency.value=660;g.gain.setValueAtTime(.15,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.7);o.start();o.stop(audioContext.currentTime+.7);}catch{}}
  setInterval(updateTimer,200);
  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function jsonBackup() {return JSON.stringify(data,null,2);}
  function htmlBackup(snapshot) {
    const shell=cleanShell.cloneNode(true);shell.querySelector('#embedded-data').textContent=C.safeJSON(snapshot);
    return '<!doctype html>\n'+shell.outerHTML;
  }
  function exportJSON(){download(jsonBackup(),`classroom-${C.date()}.json`,'application/json');exportedRevision=data.revision;toast(tr('已產生 JSON 下載；請確認檔案已存妥。','JSON download requested. Check that the file was saved.'));}
  function exportHTML(){download(htmlBackup(C.clone(data)),`classroom-${C.date()}.html`,'text/html;charset=utf-8');exportedRevision=data.revision;toast(tr('已產生離線 HTML 下載；原檔不會自動覆寫。','Offline HTML download requested; the original file is not overwritten.'));}
  async function writeUSB() {
    if(!canEdit()||writing)return;
    if(!window.showOpenFilePicker){toast(tr('此瀏覽器不支援直接寫入。請使用「下載離線 HTML」。','Direct writing is not supported. Use Download offline HTML.'));return;}
    writing=true;$('write-file').disabled=true;
    try {
      if(!fileHandle) {
        [fileHandle]=await window.showOpenFilePicker({multiple:false,types:[{description:'Classroom HTML',accept:{'text/html':['.html']}}]});
        const original=await fileHandle.getFile(),content=await original.text();
        if(!content.includes('id="embedded-data"')||!content.includes('tch-classroom-v4:')){fileHandle=null;throw new Error('wrong-file');}
      }
      if(!canEdit())return;
      const permission={mode:'readwrite'};
      if(await fileHandle.queryPermission(permission)!=='granted'&&await fileHandle.requestPermission(permission)!=='granted')throw new Error('permission');
      const snapshot=C.clone(data),revision=snapshot.revision;
      const stream=await fileHandle.createWritable();
      try{await stream.write(htmlBackup(snapshot));await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}
      exportedRevision=revision;
      $('file-status').textContent=tr(`已寫入：${fileHandle.name} · 版本 ${revision}`,`Written: ${fileHandle.name} · revision ${revision}`)+(data.revision!==revision?tr('；寫入期間另有修改，請再更新一次。','; more edits were made during writing. Update again.'):'');
      toast(tr('USB 檔案已完成寫入。','USB file written successfully.'));
    } catch(e) {
      $('file-status').textContent=tr('本次未完成寫入；請重試或下載備份。','This write did not complete. Retry or download a backup.');
      if(e.name==='AbortError')toast(tr('已取消；本機資料保留。','Cancelled; local data is unchanged.'));
      else {toast(e.message==='wrong-file'?tr('請選擇本系統匯出的 HTML，避免覆寫其他檔案。','Select an HTML exported by this system to avoid overwriting another file.'):tr('未能寫入檔案。請重新授權，或下載離線 HTML。','Could not write the file. Reauthorize or download offline HTML.'));fileHandle=null;}
    } finally {writing=false;$('write-file').disabled=false;}
  }
  async function importBackup(file) {
    if(!canEdit()||!file)return;
    try {
      if(file.size>10*1024*1024)throw new Error('too large');
      const raw=await file.text(),candidate=C.migrate(JSON.parse(raw));
      if(!await ask(tr('匯入並取代目前資料？','Import and replace current data?'),tr(`將載入 ${candidate.students.length} 位學生、${candidate.homework.length} 份習作。確認後會先下載目前資料的安全備份。`,`Load ${candidate.students.length} students and ${candidate.homework.length} tasks. A safety backup of current data will be downloaded first.`)))return;
      if(!canEdit())return;
      download(jsonBackup(),`classroom-before-import-${Date.now()}.json`,'application/json');
      // A restore becomes an independent dataset, so an old cache cannot silently supersede it.
      candidate.id=C.uid();data=candidate;C.touch(data);recoveryNotice='';persist();fileHandle=null;pickedResult='';selectedHw='';
      applyLanguage();renderAdmin();toast(tr('備份已匯入，請確認資料。','Backup imported. Check your data.'));
    }catch{toast(tr('匯入失敗：格式不正確或檔案過大。原資料未變更。','Import failed: invalid format or oversized file. Original data is unchanged.'));}
  }
  window.addEventListener('storage',e=>{
    if(e.key!==prefix+data.id||!e.newValue)return;
    try{const incoming=C.validate(JSON.parse(e.newValue));if(incoming.id===data.id&&JSON.stringify(incoming)!==JSON.stringify(data)) {
      remoteData=incoming;conflicted=true;$('conflict-dialog').showModal();
    }}catch{}
  });
  $('conflict-dialog').addEventListener('cancel',e=>e.preventDefault());
  $('conflict-backup').onclick=exportJSON;
  $('conflict-load').onclick=()=>{if(!remoteData)return;data=remoteData;remoteData=null;conflicted=false;$('conflict-dialog').close();pickedResult='';applyLanguage();renderAdmin();toast(tr('已載入另一視窗的資料。','Loaded data from the other window.'));};
  window.addEventListener('beforeunload',e=>{if(storageError && data.revision!==exportedRevision){e.preventDefault();e.returnValue='';}});
  $$('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $('edit-lesson').onclick=$('first-lesson').onclick=()=>switchTab('admin');
  $('language').onclick=()=>{if(change(d=>{d.lang=['zh','en','bi'][(['zh','en','bi'].indexOf(d.lang)+1)%3];})){applyLanguage();if(admin)renderAdmin();}};
  $('project').onclick=()=>{document.documentElement.classList.toggle('present');$('project').setAttribute('aria-pressed',document.documentElement.classList.contains('present'));};
  $('previous').onclick=()=>{$('previous-panel').hidden=!$('previous-panel').hidden;renderPrevious();};
  $('login').onsubmit=e=>{e.preventDefault();if($('password').value==='0926'){admin=true;$('password').value='';$('login-error').textContent='';renderAdmin();}else{$('login-error').textContent=tr('密碼不正確','Incorrect password');$('password').value='';}};
  $('logout').onclick=()=>{admin=false;editingRecords=false;renderAdmin();renderHomework();};
  $$('[data-lesson]').forEach(input=>input.addEventListener('input',()=>{if(!canEdit())return;change(d=>{d.lesson[input.dataset.lesson]=input.type==='checkbox'?input.checked:input.value;});renderLesson();}));
  $('add-step').onclick=()=>{if(!canEdit())return;change(d=>d.lesson.flow.push({id:C.uid(),time:'',title:'',detail:''}));renderFlowEditor();renderLesson();$('flow-editor').lastElementChild?.querySelector('input')?.focus();};
  $('save-local').onclick=()=>{if(!canEdit())return;persist();toast(storageError?tr('儲存失敗，請匯出備份。','Save failed. Export a backup.'):tr('課堂已存於此瀏覽器，前台已同步。USB 請另行更新。','Saved in this browser and reflected in lesson view. Update USB separately.'));};
  $('save-preset').onclick=()=>{if(!canEdit())return;const name=$('preset-name').value.trim();if(!name){toast(tr('請輸入範本名稱','Enter a template name'));return;}change(d=>d.presets.push({id:C.uid(),name,flow:C.clone(d.lesson.flow)}));$('preset-name').value='';renderAdminLists();};
  $('archive-lesson').onclick=()=>{if(!canEdit())return;change(d=>d.history.unshift({id:C.uid(),lesson:C.clone(d.lesson)}));renderAdminLists();renderLesson();toast(tr('目前課堂已封存。','Current lesson archived.'));};
  $('new-lesson').onclick=async()=>{if(!canEdit()||!await ask(tr('開始新的一課？','Start a new lesson?'),tr('目前課堂會先封存，然後建立空白課堂。','The current lesson will be archived before creating a blank lesson.')))return;if(!canEdit())return;change(d=>{d.history.unshift({id:C.uid(),lesson:C.clone(d.lesson)});d.lesson=C.emptyLesson();});renderAdmin();renderLesson();};
  $('import-roster').onclick=async()=>{if(!canEdit())return;try{const names=C.parseRoster($('roster-input').value);if(!names.length && !await ask(tr('清空學生名單？','Clear student roster?'),tr('所有學生的交收與抽點紀錄會移除。','All student submission and picking records will be removed.')))return;
    else if(names.length && data.students.length && !await ask(tr('更新學生名單？','Update student roster?'),tr('會保留仍在名單內學生的紀錄，移除學生的紀錄將刪除。','Records for matching students will be kept. Removed students’ records will be deleted.')))return;
    if(!canEdit())return;change(d=>C.replaceRoster(d,names));pickedResult='';renderAdminLists();renderHomework();renderPicker();toast(tr('學生名單已更新','Student roster updated'));
  }catch{toast(tr('名單格式不正確；每行一位學生，最多 1000 位。','Invalid roster: one student per line, up to 1000 students.'));}};
  $('roster-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!canEdit()||!file)return;if(file.size>1024*1024){toast(tr('名單檔案過大','Roster file is too large'));return;}try{$('roster-input').value=await file.text();toast(tr('已讀取，請檢查後按「更新學生名單」。','File read. Check the roster, then choose Update roster.'));}catch{toast(tr('未能讀取檔案','Could not read file'));}};
  $('add-homework').onclick=()=>{if(!canEdit())return;const name=$('new-homework').value.trim();if(!name)return;if(data.homework.some(h=>h.name===name)){toast(tr('已有相同名稱的習作','A task with that name already exists'));return;}change(d=>{const h={id:C.uid(),name};d.homework.push(h);d.records[h.id]={};});$('new-homework').value='';renderAdminLists();renderHomework();};
  $$('[data-view]').forEach(b=>b.onclick=()=>{hwView=b.dataset.view;renderHomework();});
  $('hw-select').onchange=()=>{selectedHw=$('hw-select').value;renderHomework();};
  $('student-search').oninput=renderHomework;$('show-rate').onchange=renderHomework;
  $('edit-records').onchange=()=>{if(!canEdit()){$('edit-records').checked=false;toast(tr('請先解鎖後台，再編輯紀錄。','Unlock the teacher desk to edit records.'));switchTab('admin');return;}editingRecords=$('edit-records').checked;renderHomework();};
  $('mark-all').onclick=async()=>{const hw=selectedHw;if(!canEdit()||!await ask(tr('全班標示為已交？','Mark all as submitted?'),tr('這會覆寫本習作的未交、遲交及重作狀態。','This replaces missing, late and redo statuses for this task.')))return;if(!canEdit()||!data.homework.some(h=>h.id===hw))return;change(d=>d.students.forEach(s=>C.setStatus(d,hw,s.id,'submitted')));renderHomework();};
  $('copy-missing').onclick=async()=>{const names=data.students.filter(s=>C.getStatus(data,selectedHw,s.id)==='missing').map(s=>s.name).join('\n');try{await navigator.clipboard.writeText(names);toast(tr('已複製未交名單','Missing names copied'));}catch{toast(tr('無法存取剪貼簿，請直接選取名單複製。','Clipboard unavailable. Select the names and copy manually.'));}};
  $$('[data-picker]').forEach(b=>b.onclick=()=>{if(drawing)return;pickerMode=b.dataset.picker;renderPicker();});$('draw').onclick=pick;
  $('reset-picker').onclick=async()=>{if(drawing||conflicted||!await ask(tr('開始新一輪？','Start a new round?'),tr('會清空本輪已抽名單。','The picked list for this round will be cleared.')))return;if(conflicted)return;change(d=>d.picked=[]);pickedResult='';finalWheel=null;$('shuffle-name').textContent=tr('準備好了嗎？','Ready to join in?');renderPicker();};
  $$('[data-minutes]').forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.minutes)*60));
  $('set-timer').onclick=()=>{const n=Number($('custom-minutes').value);if(!Number.isFinite(n)||n<1/60||n>180){toast(tr('請輸入 1 秒至 180 分鐘的時間','Enter a duration from 1 second to 180 minutes'));return;}setTimer(Math.round(n*60));};
  $('start-timer').onclick=()=>{if(timer.running||!timer.left)return;if($('timer-sound').checked){try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{}}timer.deadline=Date.now()+timer.left*1000;timer.running=true;saveTimer();updateTimer();};
  $('pause-timer').onclick=()=>{if(!timer.running)return;timer.left=C.remaining(timer.deadline,Date.now());timer.running=false;saveTimer();updateTimer();};
  $('reset-timer').onclick=()=>setTimer(timer.total);
  $('timer-task').oninput=()=>{timer.task=$('timer-task').value;saveTimer();};$('task-size').onchange=()=>{timer.size=$('task-size').value;$('timer-task').style.fontSize=timer.size+'px';saveTimer();};
  $('export-json').onclick=()=>{if(canEdit())exportJSON();};$('export-html').onclick=()=>{if(canEdit())exportHTML();};$('write-file').onclick=writeUSB;
  $('import-json').onchange=e=>{const file=e.target.files[0];e.target.value='';importBackup(file);};
  applyLanguage();switchTab('lesson');
  if(storageError||recoveryNotice)toast(tr('儲存需要注意，請到後台查看資料狀態。','Storage needs attention. Check the teacher desk.'));
})();
