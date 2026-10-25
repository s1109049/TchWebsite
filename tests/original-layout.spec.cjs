const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
async function enter(page){if(await page.locator('#class-home').isVisible())await page.locator('[data-class-key="中國歷史:S1D"]').click();}
async function login(page){await enter(page);await page.locator('#btn-admin').click();await expect(page.locator('#admin-login-card')).toBeVisible();await page.locator('#admin-password-input').fill('0926');await page.locator('#btn-login-unlock').click();await expect(page.locator('#admin-panel')).toBeVisible();}
async function open(page){await page.route('https://fonts.**',r=>r.abort());await page.goto('/');await enter(page);}
async function addStep(page,title='課堂活動',detail='說明'){
 await page.locator('#btn-add-step').click();await page.locator('.flow-title-input').last().fill(title);await page.locator('.flow-detail-input').last().fill(detail);
}
async function roster(page,names='Alex\nMary\n小明'){
 await page.locator('#import-students-text').fill(names);await page.locator('#btn-import-students').click();
}
async function setupMemoryFile(page,{permission='granted',fail=false}={}){
 const html=await fs.readFile('index.html','utf8');
 await page.addInitScript(({html,permission,fail})=>{
  window.pickerCalls=0;window.writeCalls=0;window.closeCalls=0;window.lastHTML='';window.failWrite=fail;window.allowWrite=permission;
  window.showOpenFilePicker=async()=>{window.pickerCalls++;return [{name:'index (2).html',getFile:async()=>({size:html.length,text:async()=>html}),queryPermission:async()=>window.allowWrite,requestPermission:async()=>window.allowWrite,
   createWritable:async()=>({write:async value=>{if(window.failWrite)throw Error('disk full');window.lastHTML=value;window.writeCalls++;},close:async()=>{window.closeCalls++;},abort:async()=>{}})}];};
 },{html,permission,fail});
}
test.beforeEach(async({page})=>{page.on('dialog',d=>d.accept());});
test('reopen, log in, edit partial steps, add/remove and save without losing input',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await login(page);await addStep(page,'流程 "A"','只有詳情也可保留');
 await page.locator('#edit-title').fill('測試課堂');await page.locator('#btn-add-step').click();await expect(page.locator('.flow-title-input').first()).toHaveValue('流程 "A"');
 await page.locator('.flow-detail-input').last().fill('只填詳細說明');await page.locator('#btn-lesson').click();await expect(page.locator('#display-flow-list')).toContainText('只填詳細說明');
 await page.reload();await login(page);await expect(page.locator('.flow-title-input').first()).toHaveValue('流程 "A"');await expect(page.locator('.flow-detail-input').last()).toHaveValue('只填詳細說明');
 await page.locator('.flow-title-input').first().fill('重開後修改成功');await page.locator('#btn-lesson').click();await expect(page.locator('#display-flow-list')).toContainText('重開後修改成功');await page.locator('#btn-admin').click();
 await page.getByRole('button',{name:'刪除步驟',exact:true}).last().click();await page.getByRole('button',{name:'刪除步驟',exact:true}).last().click();await page.reload();await login(page);await expect(page.locator('.flow-title-input')).toHaveCount(0);expect(errors).toEqual([]);
});
test('an exported HTML opens locked and can still edit/save in a fresh storage context',async({page,browser})=>{
 await open(page);await login(page);await addStep(page,'開啟後仍可編輯','</script><b>不是程式</b>');
 const download=page.waitForEvent('download');await page.locator('#btn-download-copy').click();const text=await fs.readFile(await (await download).path(),'utf8');
 const context=await browser.newContext(),fresh=await context.newPage();fresh.on('dialog',d=>d.accept());await context.route('https://**',r=>r.abort());await context.route('http://fresh.test/**',r=>r.fulfill({contentType:'text/html',body:text}));await fresh.goto('http://fresh.test/');
 await enter(fresh);await fresh.locator('#btn-admin').click();await expect(fresh.locator('#admin-login-card')).toBeVisible();await expect(fresh.locator('#admin-panel')).toBeHidden();await fresh.locator('#admin-password-input').fill('0926');await fresh.locator('#btn-login-unlock').click();await expect(fresh.locator('.flow-title-input')).toHaveValue('開啟後仍可編輯');await fresh.locator('.flow-title-input').fill('再次修改');await fresh.locator('#btn-lesson').click();await expect(fresh.locator('#display-flow-list')).toContainText('再次修改');await expect(fresh.locator('#display-flow-list')).toContainText('</script><b>不是程式</b>');await context.close();
});
test('both save buttons overwrite the same file, select only once and never download another HTML',async({page})=>{
 await setupMemoryFile(page);let downloads=0;page.on('download',()=>downloads++);await open(page);await login(page);await addStep(page,'第一次');await page.locator('#btn-save-lesson-content').click();await expect(page.locator('#file-save-status')).toContainText('已更新原檔');
 await page.locator('.flow-title-input').fill('第二次');await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('已更新原檔');
 const result=await page.evaluate(()=>({picker:pickerCalls,writes:writeCalls,closes:closeCalls,text:lastHTML}));expect(result.picker).toBe(1);expect(result.writes).toBe(2);expect(result.closes).toBe(2);expect(result.text).toContain('第二次');expect(downloads).toBe(0);
});
test('native FileSystemFileHandle is remembered in IndexedDB and restored after reload',async({page})=>{
 let dialogs=0;await page.addInitScript(()=>{window.pickerCalls=0;});await open(page);await login(page);await addStep(page,'真實檔案 API');
 const template=await fs.readFile('index.html','utf8');await page.evaluate(async text=>{
  const root=await navigator.storage.getDirectory(),handle=await root.getFileHandle('original.html',{create:true});const stream=await handle.createWritable();await stream.write(text);await stream.close();
  window.showOpenFilePicker=async()=>{window.pickerCalls++;return [handle];};
 },template);
 await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('已更新原檔');await page.reload();await login(page);await expect(page.locator('#file-save-status')).toContainText('已恢復原檔連線');await page.locator('.flow-title-input').fill('重開後覆寫同檔');await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('已更新原檔');
 expect(await page.evaluate(()=>pickerCalls)).toBe(0);expect(await page.evaluate(async()=>await (await (await navigator.storage.getDirectory()).getFileHandle('original.html')).getFile().then(f=>f.text()))).toContain('重開後覆寫同檔');
});
test('denied permission, cancelled picker and write failure retain dirty content',async({page})=>{
 await setupMemoryFile(page,{permission:'denied'});await open(page);await login(page);await addStep(page,'必須保留');await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('未能更新');await expect(page.locator('#unsaved-banner')).toBeVisible();expect(await page.evaluate(()=>writeCalls)).toBe(0);
 await page.evaluate(()=>{window.allowWrite='granted';window.failWrite=true;});await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('未能更新');expect(await page.evaluate(()=>closeCalls)).toBe(0);await expect(page.locator('.flow-title-input')).toHaveValue('必須保留');
 await page.evaluate(()=>{originalFileHandle=null;window.showOpenFilePicker=async()=>{throw new DOMException('cancelled','AbortError');};});await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('已取消');await expect(page.locator('.flow-title-input')).toHaveValue('必須保留');
});
test('import old HTML reads embedded data without executing its scripts and survives reload',async({page})=>{
 await open(page);await login(page);
 const data={lang:'zh',lesson:{title:'舊課堂',date:'2026/10/25',flow:[{time:'5',title:'原流程',detail:''}]},students:["O'Brien",'小明'],homeworks:["HW 'A'"],submissions:{"HW 'A'":{"O'Brien":'late'}},historyLessons:[],flowPresets:[]};
 const old='<html><script>window.importedScriptExecuted=true</script><script id="embedded-data" type="application/json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script></html>';
 await page.locator('input[type=file]').setInputFiles({name:'old.html',mimeType:'text/html',buffer:Buffer.from(old)});await expect(page.locator('#edit-title')).toHaveValue('舊課堂');expect(await page.evaluate(()=>window.importedScriptExecuted)).toBeUndefined();
 await page.locator('#btn-homework').click();await expect(page.locator('#hw-table-body')).toContainText("O'Brien");await expect(page.locator('#hw-table-body')).toContainText('遲交');await page.locator('#hw-table-body button').first().click();await expect(page.locator('#hw-table-body')).toContainText('重作');await page.reload();await login(page);await expect(page.locator('.flow-title-input')).toHaveValue('原流程');
});
test('three picker modes share one no-repeat round and never pop up the result',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await login(page);await roster(page);await page.locator('#btn-picker').click();
 const names=[];let resultDialogs=0;page.on('dialog',()=>resultDialogs++);
 for(const mode of ['slot','wheel','claw']){await page.locator(`[data-picker-mode="${mode}"]`).click();await page.locator('#btn-pick-student').click();await expect(page.locator('#picker-display')).toHaveClass(/winner-celebrate/);names.push(await page.locator('#picker-display').evaluate(e=>e.firstChild.nodeValue));}
 expect(new Set(names).size).toBe(3);expect([...names].sort()).toEqual(['Alex','Mary','小明'].sort());expect(resultDialogs).toBe(0);await expect(page.locator('#picker-remaining')).toHaveText('0');await expect(page.locator('#btn-pick-student')).toBeDisabled();await page.locator('#btn-reset-picker').click();await expect(page.locator('#picker-remaining')).toHaveText('3');await expect(page.locator('#btn-pick-student')).toBeEnabled();
});
test('wheel and claw animations disable re-entry and mode switches until a clear result appears',async({page})=>{
 await open(page);await login(page);await roster(page);await page.locator('#btn-picker').click();
 for(const mode of ['wheel','claw']){await page.locator(`[data-picker-mode="${mode}"]`).click();await page.locator('#btn-pick-student').click();await expect(page.locator('[data-picker-mode="slot"]')).toBeDisabled();await expect(page.locator('#btn-reset-picker')).toBeDisabled();await expect(page.locator('#picker-display')).toHaveClass(/winner-celebrate/,{timeout:7000});await expect(page.locator('[data-picker-mode="slot"]')).toBeEnabled();}
 await expect(page.locator('#picker-remaining')).toHaveText('1');await expect(page.locator('#claw-prize')).toBeVisible();
});
test('language, timer, history and templates remain available in the original five tabs',async({page})=>{
 await open(page);await login(page);await addStep(page,'範本步驟');await page.locator('#preset-name-input').fill('教學範本');await page.locator('#btn-save-preset').click();await expect(page.locator('#preset-list-container')).toContainText('教學範本');await page.locator('#edit-title').fill('歷史課堂');await page.locator('#btn-archive-lesson').click();await page.locator('#btn-lesson').click();await page.locator('#btn-view-prev-lesson').click();await expect(page.locator('#prev-lesson-details')).toContainText('歷史課堂');
 await page.locator('#btn-timer').click();await page.locator('button[onclick="setTimerPreset(1)"]').click();await expect(page.locator('#timer-display')).toHaveText('01:00');await page.locator('#btn-timer-start').click();await expect(page.locator('#timer-display')).not.toHaveText('01:00');await page.locator('#btn-timer-pause').click();await page.locator('button[onclick="toggleLanguage()"]').click();await expect(page.locator('#txt-tab-lesson')).toContainText('Lesson');await page.locator('button[onclick="toggleLanguage()"]').click();await page.locator('#btn-picker').click();await expect(page.locator('[data-picker-mode="claw"]')).toContainText('夾公仔 /');
 await expect(page.locator('main > section')).toHaveCount(5);
});
test('invalid imports preserve current content and the download fallback never pretends to overwrite',async({page})=>{
 await open(page);await login(page);await addStep(page,'保留原內容');
 await page.locator('input[type=file]').setInputFiles({name:'bad.html',mimeType:'text/html',buffer:Buffer.from('<html>not a classroom</html>')});await expect(page.locator('#file-save-status')).toContainText('匯入失敗');await expect(page.locator('.flow-title-input')).toHaveValue('保留原內容');
 await page.evaluate(()=>window.showOpenFilePicker=undefined);let downloads=0;page.on('download',()=>downloads++);await page.locator('#btn-save-html').click();await expect(page.locator('#file-save-status')).toContainText('不支援更新原檔');expect(downloads).toBe(0);await expect(page.locator('#unsaved-banner')).toBeVisible();
 const wait=page.waitForEvent('download');await page.locator('#btn-download-copy').click();await wait;await expect(page.locator('#file-save-status')).toContainText('原 HTML 不會');
});
test('changes made while writing remain dirty and require another explicit save',async({page})=>{
 await setupMemoryFile(page);await open(page);await login(page);await addStep(page,'寫入中的舊內容');
 await page.evaluate(()=>{
  const picker=window.showOpenFilePicker;window.blockWrite=true;
  window.showOpenFilePicker=async()=>{const [handle]=await picker();handle.createWritable=async()=>({write:async value=>{window.lastHTML=value;if(window.blockWrite)await new Promise(resolve=>window.finishWrite=resolve);},close:async()=>{},abort:async()=>{}});return [handle];};
 });
 await page.locator('#btn-save-html').click();await expect.poll(()=>page.evaluate(()=>typeof window.finishWrite)).toBe('function');await page.locator('.flow-title-input').fill('寫入期間的新內容');await page.evaluate(()=>{window.blockWrite=false;window.finishWrite();});await expect(page.locator('#file-save-status')).toContainText('寫入期間有新修改');await expect(page.locator('#unsaved-banner')).toBeVisible();
 await page.locator('#btn-save-html').click();await expect(page.locator('#unsaved-banner')).toBeHidden();expect(await page.evaluate(()=>window.lastHTML)).toContain('寫入期間的新內容');
});
test('imports into both blank templates and personalized HTML receive separate identities and survive reload',async({page})=>{
 await open(page);await login(page);await addStep(page,'舊資料集');const previousId=await page.evaluate(()=>appData._storage.id);
 const imported={lang:'zh',lesson:{title:'另一班',flow:[{time:'5',title:'另一班流程',detail:''}]},students:['Student B'],homeworks:[],submissions:{},historyLessons:[],flowPresets:[]};
 await page.locator('input[type=file]').setInputFiles({name:'class-b.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await expect(page.locator('#edit-title')).toHaveValue('另一班');expect(await page.evaluate(()=>appData._storage.id)).not.toBe(previousId);await page.reload();await login(page);await expect(page.locator('.flow-title-input')).toHaveValue('另一班流程');
 const personalized=await page.evaluate(()=>buildHTMLSnapshot(appData));await page.route('http://personalized.test/**',r=>r.fulfill({contentType:'text/html',body:personalized}));await page.goto('http://personalized.test/');await login(page);
 imported.lesson.flow[0].title='第三班流程';await page.locator('input[type=file]').setInputFiles({name:'class-c.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await expect(page.locator('.flow-title-input')).toHaveValue('第三班流程');await page.reload();await login(page);await expect(page.locator('.flow-title-input')).toHaveValue('第三班流程');
});
async function choose(page,key){if(!await page.locator('#class-home').isVisible())await page.locator('#class-home-button').click();await page.locator(`[data-class-key="${key}"]`).click();}
test('all eleven class-subject combinations keep lessons, students and homework separate after reload',async({page})=>{
 await page.route('https://**',r=>r.abort());await page.goto('/');await expect(page.locator('[data-class-key]')).toHaveCount(11);
 const keys=await page.locator('[data-class-key]').evaluateAll(nodes=>nodes.map(n=>n.dataset.classKey));
 expect(keys).toContain('中國歷史:S1D');expect(keys).toContain('CL:S1D');expect(keys).toContain('公經社:S3B');expect(keys).toContain('CL:S3B');
 for(let i=0;i<keys.length;i++){
  await choose(page,keys[i]);await page.locator('#btn-admin').click();await expect(page.locator('#admin-panel')).toBeHidden();await login(page);
  await page.locator('#edit-title').fill('課堂-'+i);await addStep(page,'步驟-'+i);await roster(page,'學生-'+i);await page.locator('#new-hw-name').fill('功課-'+i);await page.locator('#btn-add-hw').click();
 }
 await page.reload();
 for(let i=0;i<keys.length;i++){
  await choose(page,keys[i]);await expect(page.locator('#display-title')).toHaveText('課堂-'+i);await expect(page.locator('#display-flow-list')).toContainText('步驟-'+i);
  await page.locator('#btn-homework').click();await expect(page.locator('#hw-table-body')).toContainText('學生-'+i);await expect(page.locator('#hw-select')).toContainText('功課-'+i);
  expect(await page.evaluate(()=>appData.students.length)).toBe(1);
 }
});
test('the claw machine shows every remaining student and keeps the round when returning to a class',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await login(page);const names=Array.from({length:35},(_,i)=>'學生'+String(i+1).padStart(2,'0'));await roster(page,names.join('\n'));await page.locator('#btn-picker').click();await page.locator('[data-picker-mode="claw"]').click();await expect(page.locator('.claw-toy')).toHaveCount(35);expect(await page.locator('.claw-toy > span').allTextContents()).toEqual(Array.from({length:35},(_,i)=>String(i+1).padStart(2,'0')));
 expect((await page.locator('.claw-toy small').allTextContents()).sort()).toEqual([...names].sort());
 await page.locator('#btn-pick-student').click();await expect(page.locator('#picker-remaining')).toHaveText('34');const winner=await page.locator('#picker-display').evaluate(e=>e.firstChild.nodeValue);
 await choose(page,'CL:S1D');await expect(page.locator('#picker-remaining')).toHaveText('0');await choose(page,'中國歷史:S1D');await page.locator('#btn-picker').click();await page.locator('[data-picker-mode="claw"]').click();await expect(page.locator('.claw-toy')).toHaveCount(34);expect(await page.locator('.claw-toy small').allTextContents()).not.toContain(winner);
 await page.reload();await enter(page);await page.locator('#btn-picker').click();await expect(page.locator('#picker-remaining')).toHaveText('34');
});
test('quick flow steps, duplication, reordering and pasted spreadsheet rows remain editable',async({page})=>{
 await open(page);await login(page);await page.getByRole('button',{name:'回顧 5 分鐘',exact:true}).click();await expect(page.locator('.flow-title-input')).toHaveValue('課前回顧');await page.getByRole('button',{name:'複製步驟',exact:true}).click();await page.locator('.flow-title-input').last().fill('複製後修改');await page.getByRole('button',{name:'上移步驟',exact:true}).last().click();await expect(page.locator('.flow-title-input').first()).toHaveValue('複製後修改');
 await page.locator('.flow-batch summary').click();await page.locator('#batch-flow-text').fill('10 分鐘\t活動一\t分組討論\n5 分鐘 | 總結 | 重點\n只填標題');await page.getByRole('button',{name:'加入以上步驟',exact:true}).click();await expect(page.locator('.flow-title-input')).toHaveCount(5);await page.locator('.flow-detail-input').nth(2).fill('即時修改');await page.locator('#btn-lesson').click();await expect(page.locator('#display-flow-list')).toContainText('即時修改');await page.reload();await login(page);await expect(page.locator('.flow-title-input').last()).toHaveValue('只填標題');
});
test('a complete HTML export restores multiple classes in a fresh browser',async({page,browser})=>{
 await open(page);await login(page);await page.locator('#edit-title').fill('中史課');await choose(page,'CL:S1D');await login(page);await page.locator('#edit-title').fill('CL課');const pending=page.waitForEvent('download');await page.locator('#btn-download-copy').click();const content=await fs.readFile(await (await pending).path(),'utf8');
 const context=await browser.newContext();await context.route('https://**',r=>r.abort());await context.route('http://book.test/**',r=>r.fulfill({contentType:'text/html',body:content}));const fresh=await context.newPage();await fresh.goto('http://book.test/');await expect(fresh.locator('[data-class-key]')).toHaveCount(11);await choose(fresh,'中國歷史:S1D');await expect(fresh.locator('#display-title')).toHaveText('中史課');await choose(fresh,'CL:S1D');await expect(fresh.locator('#display-title')).toHaveText('CL課');await context.close();
});
test('whole-book JSON imports restore all classes and malformed books do not change data',async({page})=>{
 await open(page);await login(page);await page.locator('#edit-title').fill('必須保留');const book=await page.evaluate(()=>captureAllData());const bad=JSON.parse(JSON.stringify(book));delete bad.classes['CL:S1D'];await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await expect(page.locator('#edit-title')).toHaveValue('必須保留');await expect(page.locator('#file-save-status')).toContainText('匯入失敗');
 book.classes['CL:S1D'].lesson.title='整本復原';await page.locator('input[type=file]').setInputFiles({name:'all.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(book))});await expect(page.locator('#class-home')).toBeVisible();await choose(page,'CL:S1D');await expect(page.locator('#display-title')).toHaveText('整本復原');await page.reload();await choose(page,'CL:S1D');await expect(page.locator('#display-title')).toHaveText('整本復原');
});
test('replacing a roster after drawing resets its pool and exported data stays valid',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await login(page);await roster(page,'Old A\nOld B');await page.locator('#btn-picker').click();await page.locator('#btn-pick-student').click();await expect(page.locator('#picker-remaining')).toHaveText('1');await page.locator('#btn-admin').click();await roster(page,'New A\nNew B\nNew C');expect(await page.evaluate(()=>validateClassBook(captureAllData()).classes[currentClassKey]._pickerRemaining)).toEqual(['New A','New B','New C']);await page.reload();await enter(page);await page.locator('#btn-picker').click();await expect(page.locator('#picker-remaining')).toHaveText('3');
});
test('roster-only import maps the same class to both subjects without replacing lesson or homework data',async({page})=>{
 await open(page);await login(page);await page.locator('#edit-title').fill('保留課堂');await roster(page,'1\t學生甲');await page.locator('#new-hw-name').fill('保留習作');await page.locator('#btn-add-hw').click();await page.locator('#btn-homework').click();await page.locator('#hw-table-body button').first().click();await page.locator('#btn-admin').click();
 const payload={rosterImportVersion:1,rosters:{S1D:['1 學生甲','2 學生乙'],S3B:['1 學生丙']}};
 await page.locator('input[type=file]').setInputFiles({name:'rosters.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await expect(page.locator('#file-save-status')).toContainText('已更新 4 個班科');await expect(page.locator('#edit-title')).toHaveValue('保留課堂');
 expect(await page.evaluate(()=>appData.submissions['保留習作']['1 學生甲'])).toBe('submitted');await choose(page,'CL:S1D');expect(await page.evaluate(()=>appData.students)).toEqual(['1 學生甲','2 學生乙']);await choose(page,'公經社:S3B');expect(await page.evaluate(()=>appData.students)).toEqual(['1 學生丙']);
 await page.reload();await choose(page,'中國歷史:S1D');await expect(page.locator('#display-title')).toHaveText('保留課堂');
});
test('local Excel imports class numbers and names into all matching subjects and keeps lessons',async({page})=>{
 await open(page);await login(page);await page.locator('#edit-title').fill('原課堂不變');
 await page.locator('input[type=file]').setInputFiles('tests/fixtures/example-class-list.xlsx');await expect(page.locator('#file-save-status')).toContainText('已更新 4 個班科');await expect(page.locator('#edit-title')).toHaveValue('原課堂不變');
 expect(await page.evaluate(()=>appData.students)).toEqual(['1 學生甲','2 學生乙']);await choose(page,'CL:S1D');expect(await page.evaluate(()=>appData.students)).toEqual(['1 學生甲','2 學生乙']);await choose(page,'公經社:S3B');expect(await page.evaluate(()=>appData.students)).toEqual(['1 EXAMPLE THREE']);
 await login(page);await page.locator('input[type=file]').setInputFiles({name:'broken.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('invalid zip')});await expect(page.locator('#file-save-status')).toContainText('匯入失敗');expect(await page.evaluate(()=>appData.students)).toEqual(['1 EXAMPLE THREE']);
});
