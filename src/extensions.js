// Repairs are deliberately scoped to the uploaded layout and its existing data format.
function newStorageId() {
    if(crypto.randomUUID)return crypto.randomUUID();
    return 'document-'+[...crypto.getRandomValues(new Uint32Array(4))].map(n=>n.toString(16).padStart(8,'0')).join('');
}
function L(zh,en) { return appData.lang==='en'?en:appData.lang==='bi'?zh+' / '+en:zh; }
function escapeOriginalHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function safeOriginalJSON(value) {return JSON.stringify(value,null,2).replace(/</g,'\\u003c');}
function dataFingerprint(text) {
    let hash=2166136261;
    for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
    return 'legacy-'+(hash>>>0).toString(16);
}
function validateOriginalData(raw) {
    if(!raw||typeof raw!=='object'||!raw.lesson||!Array.isArray(raw.lesson.flow)||!Array.isArray(raw.students)||!Array.isArray(raw.homeworks))throw new Error('format');
    const data=JSON.parse(JSON.stringify(raw));
    if(data.students.length>2000||data.homeworks.length>1000||data.lesson.flow.length>500)throw new Error('size');
    if(!data.students.every(s=>typeof s==='string')||!data.homeworks.every(s=>typeof s==='string'))throw new Error('names');
    for(const k of ['title','date','objectives','announcement','materials'])if(typeof data.lesson[k]!=='string')data.lesson[k]='';
    data.lesson.flow=data.lesson.flow.map(step=>{
        if(!step||typeof step!=='object')throw new Error('flow');
        return {time:typeof step.time==='string'?step.time:'',title:typeof step.title==='string'?step.title:'',detail:typeof step.detail==='string'?step.detail:''};
    });
    if(!['zh','en','bi'].includes(data.lang))data.lang='zh';
    data.lesson.showAnnouncement=data.lesson.showAnnouncement!==false;
    data.lesson.showMaterials=data.lesson.showMaterials!==false;
    for(const k of ['historyLessons','flowPresets']) {
        if(data[k]===undefined)data[k]=[];
        if(!Array.isArray(data[k])||data[k].length>2000)throw new Error('archive');
    }
    if(!data.historyLessons.every(h=>h&&typeof h==='object'&&Array.isArray(h.flow)))throw new Error('history');
    if(!data.flowPresets.every(p=>p&&typeof p.name==='string'&&Array.isArray(p.flow)))throw new Error('preset');
    if(data.submissions===undefined)data.submissions={};
    if(!data.submissions||typeof data.submissions!=='object'||Array.isArray(data.submissions))throw new Error('records');
    if([...data.students,...data.homeworks].some(n=>['__proto__','constructor','prototype'].includes(n)))throw new Error('name');
    for(const hw of data.homeworks) {
        const records=data.submissions[hw];
        if(records!==undefined&&(!records||typeof records!=='object'||Array.isArray(records)))throw new Error('records');
        for(const status of Object.values(records||{}))if(!['submitted','missing','late','redo'].includes(status))throw new Error('status');
    }
    if(data._pickerRemaining!==undefined){
        if(!Array.isArray(data._pickerRemaining))throw Error('picker');
        const counts=new Map();data.students.forEach(s=>counts.set(s,(counts.get(s)||0)+1));
        for(const name of data._pickerRemaining){if(!counts.get(name))throw Error('picker');counts.set(name,counts.get(name)-1);}
    }
    if(data._timerState&&(!Number.isSafeInteger(data._timerState.total)||data._timerState.total<=0||!Number.isSafeInteger(data._timerState.left)||data._timerState.left<0||data._timerState.left>data._timerState.total))throw Error('timer');
    return data;
}
function dataStorageKey(data=appData) {return storagePrefix+(classBook?classBook.id:data._storage.id)+':'+location.pathname;}
function loadInitialData() {
    const raw=document.getElementById('embedded-data').textContent;
    const decoded=JSON.parse(raw);if(decoded.workspaceVersion===1)return loadClassBook(decoded);
    let embedded;
    try {embedded=validateOriginalData(JSON.parse(raw));}
    catch {localRecoveryWarning=true;embedded={lang:'zh',lesson:{title:'',date:'',objectives:'',announcement:'',materials:'',flow:[]},historyLessons:[],flowPresets:[],students:[],homeworks:[],submissions:{}};}
    const meta=embedded._storage;
    templateDocument=meta?.id==='original-layout-template-v1';
    const sourceId=typeof meta?.id==='string'?meta.id:dataFingerprint(raw);
    storageRootKey=storagePrefix+'active:'+sourceId+':'+location.pathname;
    embedded._storage={id:sourceId,revision:Number.isSafeInteger(meta?.revision)?meta.revision:0,updatedAt:Number.isFinite(meta?.updatedAt)?meta.updatedAt:0};
    try {
        // This pointer is scoped to the HTML's original identity AND its path.
        // It also remembers an explicit import into a non-template HTML.
        const activeId=localStorage.getItem(storageRootKey);
        if(activeId&&activeId!==sourceId){
            try {
                const active=validateOriginalData(JSON.parse(localStorage.getItem(storagePrefix+activeId+':'+location.pathname)));
                if(active._storage?.id===activeId){isDirty=true;return active;}
            }catch{localRecoveryWarning=true;}
        }
        const rawCache=localStorage.getItem(dataStorageKey(embedded));
        if(rawCache){
            try {
                const cached=validateOriginalData(JSON.parse(rawCache));
                if(cached._storage?.id===sourceId&&cached._storage.revision>embedded._storage.revision){isDirty=true;return cached;}
            }catch{localRecoveryWarning=true;}
        }
    }catch{localSaveFailed=true;}
    if(templateDocument)embedded._storage.id=newStorageId();
    return embedded;
}
function persistLocalData() {
    if(classBook){persistClassBook();return;}
    try {localStorage.setItem(dataStorageKey(),JSON.stringify(appData));localStorage.setItem(storageRootKey,appData._storage.id);localSaveFailed=false;}
    catch {localSaveFailed=true;setFileStatus(L('本機備份失敗，請先儲存原檔或下載副本，避免關閉後遺失。','Local backup failed. Save the original file or download a copy before closing.'),true);}
}
function syncLessonFields() {
    if(!isAdminLoggedIn||!lessonEditorReady)return;
    const fields={title:'edit-title',date:'edit-date',objectives:'edit-objectives',announcement:'edit-announcement',materials:'edit-materials'};
    for(const [key,id] of Object.entries(fields))appData.lesson[key]=document.getElementById(id).value;
    appData.lesson.showAnnouncement=document.getElementById('edit-show-ann').checked;
    appData.lesson.showMaterials=document.getElementById('edit-show-mat').checked;
}
function wireLessonFields() {
    for(const id of ['edit-title','edit-date','edit-objectives','edit-announcement','edit-materials','edit-show-ann','edit-show-mat']) {
        const input=document.getElementById(id);
        input.oninput=()=>{if(!isAdminLoggedIn)return;syncLessonFields();markDirty();renderLessonTab();};
        if(input.type==='checkbox')input.onchange=input.oninput;
    }
}
function setFileStatus(message,error=false) {
    const node=document.getElementById('file-save-status');
    node.textContent=message;node.style.color=error?'#b45309':'#0c4a6e';
}
function applyExtensionLabels() {
    const labels={
        'btn-save-html':L('💾 儲存並更新原檔','💾 Save & update original'),
        'btn-export-json':classBook?L('📄 匯出全部班科備份','📄 Back up all classes'):L('📄 匯出 JSON','📄 Export JSON'),
        'btn-download-copy':L('📥 下載副本','📥 Download copy'),
        'btn-reconnect':L('📂 重新選擇原檔','📂 Reconnect original'),
        'btn-import-json':L('📂 匯入 Excel / HTML / JSON','📂 Import Excel / HTML / JSON'),
        'btn-save-lesson-content':L('💾 儲存並更新課堂 HTML','💾 Save & update lesson HTML'),
        'txt-save-banner-desc':L('首次儲存請選取原本的 HTML 並授權；之後會直接更新同一檔案。更換瀏覽器或權限到期時可能需要再次授權。','Select and authorize the original HTML on first save. Later saves update that file. A different browser or expired permission may require authorization again.'),
        'unsaved-banner':L('⚠️ 內容已變更，已嘗試備份到此瀏覽器。請在後台儲存原檔，才會更新 USB 的 HTML。','⚠️ Content changed. Local backup attempted. Save the original file in Admin to update the USB HTML.'),
        'claw-title':L('幸運夾公仔機','Lucky claw machine')
    };
    for(const [id,text] of Object.entries(labels))document.getElementById(id).textContent=text;
    for(const button of document.querySelectorAll('[data-picker-mode]'))button.textContent=({slot:L('🎰 跑馬燈','🎰 Shuffle'),wheel:L('🎡 輪盤','🎡 Wheel'),claw:L('🧸 夾公仔','🧸 Claw machine')})[button.dataset.pickerMode];
}
function setSaveButtonsDisabled(value) {
    document.getElementById('class-home-button').disabled=value||isPicking;
    for(const id of ['btn-save-html','btn-save-lesson-content','btn-download-copy','btn-reconnect'])document.getElementById(id).disabled=value;
}
function buildHTMLSnapshot(snapshot) {
    if(classBook&&snapshot.workspaceVersion!==1)snapshot=captureAllData();
    const shell=pristineHTML.cloneNode(true);
    shell.querySelector('#embedded-data').textContent='\n'+safeOriginalJSON(snapshot)+'\n';
    shell.querySelector('#admin-panel').style.display='none';
    shell.querySelector('#admin-login-card').style.display='block';
    shell.querySelector('#admin-password-input').value='';
    shell.querySelector('#admin-password-input').removeAttribute('value');
    shell.querySelector('#unsaved-banner').style.display='none';
    shell.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-lesson'));
    shell.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.id==='btn-lesson'));
    return '<!DOCTYPE html>\n'+shell.outerHTML;
}
function downloadFile(text,name,type) {
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function downloadHTMLCopy() {
    if(!isAdminLoggedIn||fileWriteBusy)return;
    syncAllInputsToData();downloadFile(buildHTMLSnapshot(appData),'index.html','text/html;charset=utf-8');
    setFileStatus(L('已產生副本下載；請確認下載成功。原 HTML 不會因此自動覆寫。','Copy download requested. Check that it saved. The original HTML has not been overwritten.'));
}
function openHandleDB() {
    return new Promise((resolve,reject)=>{
        const request=indexedDB.open('tch-original-file-handles',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('files');
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('blocked'));
    });
}
async function rememberFileHandle(handle) {
    try {
        const db=await openHandleDB();
        await new Promise((resolve,reject)=>{
            const transaction=db.transaction('files','readwrite');transaction.objectStore('files').put(handle,dataStorageKey());
            transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);
        });db.close();
    }catch{/* A handle can be used for this session even when persistence is unavailable. */}
}
async function restoreFileHandle() {
    try {
        const db=await openHandleDB();
        originalFileHandle=await new Promise((resolve,reject)=>{
            const request=db.transaction('files','readonly').objectStore('files').get(dataStorageKey());
            request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);
        });db.close();
        if(originalFileHandle)setFileStatus(L('已恢復原檔連線，按儲存時會檢查寫入權限：','Original file connection restored. Permission is checked when saving: ')+originalFileHandle.name);
    }catch{}
}
async function chooseOriginalFile() {
    if(!window.showOpenFilePicker)throw new Error('unsupported');
    const [handle]=await window.showOpenFilePicker({multiple:false,types:[{description:'Classroom HTML',accept:{'text/html':['.html','.htm']}}]});
    const file=await handle.getFile();
    if(file.size>20*1024*1024)throw new Error('size');
    const dom=new DOMParser().parseFromString(await file.text(),'text/html');
    const script=dom.getElementById('embedded-data');
    if(!script)throw new Error('wrong-file');
    const candidate=JSON.parse(script.textContent);if(candidate.workspaceVersion===1)validateClassBook(candidate);else validateOriginalData(candidate);
    if(!confirm(L('將用目前課堂及紀錄更新「'+handle.name+'」。請確認已匯入要保留的舊資料。是否連接此檔案？',
        'Current data will update "'+handle.name+'". Import any old data you want to keep first. Connect this file?'))){setFileStatus(L('已取消連接，沒有覆寫檔案。','Connection cancelled. No file was overwritten.'));return null;}
    await rememberFileHandle(handle);
    setFileStatus(L('已連接原檔：','Original file connected: ')+handle.name);
    return handle;
}
async function reconnectOriginalFile() {
    if(!isAdminLoggedIn||fileWriteBusy)return;
    if(!window.showOpenFilePicker){setFileStatus(L('此瀏覽器不支援選取原檔；請使用下載副本。','File selection is unsupported. Download a copy instead.'),true);return;}
    try {await fileHandleReady;const handle=await chooseOriginalFile();if(handle)originalFileHandle=handle;}
    catch {setFileStatus(L('未能連接原檔；未覆寫任何檔案。','Could not connect. No file was overwritten.'),true);}
}
window.addEventListener('beforeunload',event=>{
    if(fileWriteBusy||(localSaveFailed&&isDirty)){event.preventDefault();event.returnValue='';}
});

// All three presentations share a single selection pool and select the winner
// before animating. The animation cannot change the random outcome.
function secureRandomIndex(length) {
    const limit=Math.floor(4294967296/length)*length,values=new Uint32Array(1);
    do{crypto.getRandomValues(values);}while(values[0]>=limit);
    return values[0]%length;
}
function setPickerControlsDisabled(disabled) {
    document.querySelectorAll('[data-picker-mode]').forEach(b=>b.disabled=disabled);
    document.getElementById('btn-reset-picker').disabled=disabled;
    document.getElementById('class-home-button').disabled=disabled||fileWriteBusy;
}
function switchPickerMode(mode) {
    if(isPicking||!['slot','wheel','claw'].includes(mode))return;
    pickerMode=mode;renderPickerMode();
}
function renderPickerMode() {
    const game=document.getElementById('picker-game');game.style.display=pickerMode==='slot'?'none':'block';
    document.getElementById('picker-play-area').dataset.mode=pickerMode;
    document.getElementById('wheel-stage').hidden=pickerMode!=='wheel';document.getElementById('claw-stage').hidden=pickerMode!=='claw';
    for(const b of document.querySelectorAll('[data-picker-mode]')){const active=b.dataset.pickerMode===pickerMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);}
    if(!isPicking&&pickerMode==='wheel')drawStudentWheel(wheelFinish?.candidates||uncalledStudents,wheelFinish?.angle||0);
    if(!isPicking&&pickerMode==='claw')prepareClawToys(uncalledStudents);
}
function animatePicker(duration,draw) {
    return new Promise(resolve=>{
        const start=performance.now();function frame(now){const p=duration?Math.min(1,(now-start)/duration):1;draw(p);if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);
    });
}
function drawStudentWheel(candidates,angle=0) {
    const canvas=document.getElementById('student-wheel'),ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,720,720);ctx.save();ctx.translate(360,360);ctx.rotate(angle);
    const colors=['#e0e7ff','#fce7f3','#d1fae5','#fef3c7','#dbeafe','#ede9fe'];
    if(!candidates.length){ctx.beginPath();ctx.arc(0,0,340,0,2*Math.PI);ctx.fillStyle='#e0e7ff';ctx.fill();}
    candidates.forEach((name,i)=>{
        const a=i/candidates.length*Math.PI*2-Math.PI/2,b=(i+1)/candidates.length*Math.PI*2-Math.PI/2;
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,340,a,b);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
        ctx.save();ctx.rotate((a+b)/2);ctx.textAlign='right';ctx.fillStyle='#312e81';ctx.font=`bold ${candidates.length>25?18:candidates.length>15?22:30}px 'M PLUS Rounded 1c',sans-serif`;
        const label=name.replace(/\s+/g,' ');ctx.fillText(label,315,8,245);ctx.restore();
    });ctx.restore();ctx.beginPath();ctx.arc(360,360,28,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
}
function prepareClawToys(candidates) {
    const container=document.getElementById('claw-toys');container.replaceChildren();
    const columns=Math.min(7,Math.max(3,Math.ceil(Math.sqrt(candidates.length)))) ;
    const rows=Math.max(1,Math.ceil(candidates.length/columns));
    container.style.setProperty('--toy-cols',columns);container.style.height=(rows*68+36)+'px';
    candidates.forEach((name,i)=>{
        const toy=document.createElement('div');toy.className='claw-toy';toy.style.left=((i%columns+.5)/columns*100)+'%';toy.style.top=(48+Math.floor(i/columns)*68)+'px';toy.style.width=(100/columns)+'%';
        const emoji=document.createElement('span');emoji.textContent=String(i+1).padStart(2,'0');emoji.style.backgroundColor=['#fbcfe8','#fde68a','#a7f3d0','#bfdbfe','#ddd6fe','#fed7aa'][i%6];
        const label=document.createElement('small');label.textContent=name;toy.append(emoji,label);container.appendChild(toy);
    });
    const arm=document.getElementById('claw-arm');arm.style.left='50%';arm.style.setProperty('--depth','15px');arm.classList.remove('closed');document.getElementById('claw-prize').style.visibility='hidden';
}
async function animateClaw(selected,index,candidates,reduced) {
    const shown=[...candidates];let target=index;
    if(target<0){shown[shown.length-1]=selected;target=shown.length-1;}
    prepareClawToys(shown);
    const toy=document.getElementById('claw-toys').children[target],arm=document.getElementById('claw-arm'),prize=document.getElementById('claw-prize');
    prize.textContent=toy.querySelector('span').textContent;
    const columns=Math.min(7,Math.max(3,Math.ceil(Math.sqrt(shown.length)))) ;
    const x=(target%columns+.5)/columns*100,depth=25+Math.floor(target/columns)*68;
    toy.scrollIntoView({block:'nearest',inline:'nearest'});
    await animatePicker(reduced?0:4200,p=>{
        let left=x,d=15;
        if(p<.22){const t=p/.22;left=50+(x-50)*(1-Math.pow(1-t,3));}
        else if(p<.48)d=15+(depth-15)*(p-.22)/.26;
        else if(p<.70)d=depth-(depth-15)*(p-.48)/.22;
        else if(p<.92)left=x+(88-x)*(p-.70)/.22;
        else{left=88;d=15+45*(p-.92)/.08;}
        arm.style.left=left+'%';arm.style.setProperty('--depth',d+'px');
        if(p>=.48){arm.classList.add('closed');prize.style.visibility='visible';toy.style.opacity='0';}
    });
}
