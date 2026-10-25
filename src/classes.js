function validateClassBook(raw) {
    if(!raw||raw.workspaceVersion!==1||typeof raw.id!=='string'||!Number.isSafeInteger(raw.revision)||raw.revision<0||!raw.classes)throw Error('workspace');
    const copy=JSON.parse(JSON.stringify(raw));
    if(Object.keys(copy.classes).length!==classDefinitions.length)throw Error('classes');
    for(const def of classDefinitions){
        const data=validateOriginalData(copy.classes[def.key]);
        data._storage={id:typeof data._storage?.id==='string'?data._storage.id:newStorageId(),revision:Number.isSafeInteger(data._storage?.revision)?data._storage.revision:0,updatedAt:Number.isFinite(data._storage?.updatedAt)?data._storage.updatedAt:0};
        if(data._pickerRemaining!==undefined){
            if(!Array.isArray(data._pickerRemaining))throw Error('picker');
            const counts=new Map();data.students.forEach(s=>counts.set(s,(counts.get(s)||0)+1));
            for(const name of data._pickerRemaining){if(!counts.get(name))throw Error('picker');counts.set(name,counts.get(name)-1);}
        }
        if(data._timerState&&(!Number.isSafeInteger(data._timerState.total)||data._timerState.total<=0||!Number.isSafeInteger(data._timerState.left)||data._timerState.left<0||data._timerState.left>data._timerState.total))throw Error('timer');
        copy.classes[def.key]=data;
    }
    return copy;
}
function loadClassBook(raw) {
    const embedded=validateClassBook(raw);
    storageRootKey=storagePrefix+'book-active:'+embedded.id+':'+location.pathname;
    try {
        const id=localStorage.getItem(storageRootKey)||embedded.id;
        const text=localStorage.getItem(storagePrefix+id+':'+location.pathname);
        if(text){const cached=validateClassBook(JSON.parse(text));if(cached.id===id&&(id!==embedded.id||cached.revision>embedded.revision)){classBook=cached;isDirty=true;}}
    }catch{localRecoveryWarning=true;}
    if(!classBook){classBook=embedded;if(classBook.id==='class-book-template-v1')classBook.id=newStorageId();}
    currentClassKey=null;
    return classBook.classes[classDefinitions[0].key];
}
function captureAllData() {
    if(classBook&&currentClassKey){appData._timerState={total:timerTotalSeconds,left:timerRemainingSeconds};classBook.classes[currentClassKey]=appData;}
    return JSON.parse(JSON.stringify(classBook||appData));
}
function persistClassBook() {
    if(currentClassKey)classBook.classes[currentClassKey]=appData;
    classBook.revision++;
    try{localStorage.setItem(dataStorageKey(),JSON.stringify(classBook));localStorage.setItem(storageRootKey,classBook.id);localSaveFailed=false;}
    catch{localSaveFailed=true;setFileStatus(L('本機儲存失敗，請立即匯出全班別備份。','Local save failed. Export a full backup now.'),true);}
}
function initializeClassHome() {
    if(!classBook)return;
    const home=document.getElementById('class-home');home.replaceChildren();
    const title=document.createElement('h1');title.textContent='課堂管理系統 · 選擇班別';home.appendChild(title);
    const note=document.createElement('p');note.textContent='按科目及班別進入；同班不同科的資料分開保存。';home.appendChild(note);
    for(const subject of [...new Set(classDefinitions.map(d=>d.subject))]){
        const group=document.createElement('div');group.className='class-subject card';
        const h=document.createElement('h2');h.textContent=subject;group.appendChild(h);
        const grid=document.createElement('div');grid.className='class-grid';
        for(const def of classDefinitions.filter(d=>d.subject===subject)){
            const b=document.createElement('button');b.className='class-choice';b.dataset.classKey=def.key;
            const strong=document.createElement('strong');strong.textContent=def.className;
            const detail=document.createElement('span');const d=classBook.classes[def.key];detail.textContent=`${subject} · ${d.students.length} 位學生 · ${d.lesson.flow.length} 個流程步驟`;
            b.append(strong,detail);b.onclick=()=>selectClass(def.key);grid.appendChild(b);
        }group.appendChild(grid);home.appendChild(group);
    }
    showClassHome();
    document.getElementById('class-home-button').onclick=()=>showClassHome();
    document.getElementById('timer-task-input').addEventListener('input',()=>{if(currentClassKey){appData._timerTask=document.getElementById('timer-task-input').value;markDirty();}});
}
function showClassHome() {
    if(!classBook||isPicking||fileWriteBusy)return;
    if(currentClassKey){syncAllInputsToData();classBook.classes[currentClassKey]=appData;}
    if(currentClassKey){appData._timerState={total:timerTotalSeconds,left:timerRemainingSeconds};persistClassBook();}
    pauseTimer();
    document.getElementById('class-home').hidden=false;
    document.querySelector('header').hidden=true;document.querySelector('main').hidden=true;
    document.getElementById('unsaved-banner').style.display='none';
    // Refresh counts without duplicating event listeners.
    document.querySelectorAll('[data-class-key]').forEach(b=>{const d=classBook.classes[b.dataset.classKey];const def=classDefinitions.find(c=>c.key===b.dataset.classKey);b.querySelector('span').textContent=`${def.subject} · ${d.students.length} 位學生 · ${d.lesson.flow.length} 個流程步驟`;});
}
function selectClass(key) {
    if(!classBook||!classBook.classes[key]||isPicking||fileWriteBusy)return;
    if(currentClassKey){syncAllInputsToData();appData._timerState={total:timerTotalSeconds,left:timerRemainingSeconds};classBook.classes[currentClassKey]=appData;}
    currentClassKey=key;appData=classBook.classes[key];
    isAdminLoggedIn=false;lessonEditorReady=false;
    document.getElementById('admin-panel').style.display='none';document.getElementById('admin-login-card').style.display='block';
    document.getElementById('admin-password-input').value='';document.getElementById('login-error').style.display='none';
    document.getElementById('batch-flow-text').value='';
    document.getElementById('import-students-text').value='';document.getElementById('new-hw-name').value='';document.getElementById('preset-name-input').value='';
    document.getElementById('prev-lesson-card').style.display='none';
    pauseTimer();timerTotalSeconds=appData._timerState?.total||300;timerRemainingSeconds=appData._timerState?.left??timerTotalSeconds;updateTimerDisplay();document.getElementById('timer-task-input').value=appData._timerTask||'';
    resetPickerHistory(false);currentHwViewMode='single';switchHwViewMode('single');
    document.getElementById('chk-show-rate').checked=false;
    applyLanguageUI();renderLessonTab();renderHomeworkTab();switchTab('lesson');
    const def=classDefinitions.find(d=>d.key===key);document.getElementById('current-class').textContent=def.className+' · '+def.subject;
    document.getElementById('class-home').hidden=true;document.querySelector('header').hidden=false;document.querySelector('main').hidden=false;
    document.getElementById('class-home-button').hidden=false;
}
function importWholeBook(raw) {
    const candidate=validateClassBook(raw);
    if(!confirm('這會取代全部 11 個班科的資料。確認後先下載目前的完整備份，是否繼續？'))return;
    downloadFile(JSON.stringify(captureAllData(),null,2),'before-import-all-classes.json','application/json');
    const previous=currentClassKey||classDefinitions[0].key;
    candidate.id=newStorageId();candidate.revision=classBook?classBook.revision:0;
    classBook=candidate;currentClassKey=previous;appData=classBook.classes[previous];persistClassBook();isDirty=true;
    originalFileHandle=null;initializeClassHome();
}
function moveFlowStep(index,direction) {
    if(!isAdminLoggedIn)return;const target=index+direction;if(target<0||target>=appData.lesson.flow.length)return;
    [appData.lesson.flow[index],appData.lesson.flow[target]]=[appData.lesson.flow[target],appData.lesson.flow[index]];
    markDirty();renderFlowEditList();renderLessonTab();document.querySelectorAll('.flow-title-input')[target]?.focus();
}
function duplicateFlowStep(index) {
    if(!isAdminLoggedIn)return;
    if(appData.lesson.flow.length>=500){alert('流程最多 500 個步驟。');return;}
    appData.lesson.flow.splice(index+1,0,JSON.parse(JSON.stringify(appData.lesson.flow[index])));
    markDirty();renderFlowEditList();renderLessonTab();document.querySelectorAll('.flow-title-input')[index+1]?.focus();
}
function addQuickFlow(title,minutes) {
    if(!isAdminLoggedIn)return;if(appData.lesson.flow.length>=500){alert('流程最多 500 個步驟。');return;}appData.lesson.flow.push({time:minutes+' 分鐘',title,detail:''});
    markDirty();renderFlowEditList();renderLessonTab();document.querySelectorAll('.flow-detail-input')[appData.lesson.flow.length-1]?.focus();
}
function batchAddFlow() {
    if(!isAdminLoggedIn)return;
    const text=document.getElementById('batch-flow-text').value.trim();if(!text)return;
    const rows=text.split(/\r?\n/).filter(s=>s.trim()).map(line=>{
        const parts=line.split(/\t|\|/).map(s=>s.trim());
        return parts.length===1?{time:'',title:parts[0],detail:''}:{time:parts[0],title:parts[1],detail:parts.slice(2).join(' | ')};
    });
    if(appData.lesson.flow.length+rows.length>500){alert('流程最多 500 個步驟。');return;}
    appData.lesson.flow.push(...rows);document.getElementById('batch-flow-text').value='';markDirty();renderFlowEditList();renderLessonTab();
}
