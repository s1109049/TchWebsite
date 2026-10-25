const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const C=require('../src/core.js');
async function login(page){await page.locator('[data-tab="admin"]').click();await page.locator('#password').fill('0926');await page.locator('#login button').click();await expect(page.locator('#admin-panel')).toBeVisible();}
async function desk(page,name){await page.locator(`[data-admin-section="${name}"]`).click();}
async function confirm(page){await page.locator('#confirm-dialog button[value="ok"]').click();}
async function roster(page,names='小明\n陳同學\n陳同學'){await desk(page,'class');await page.locator('#roster-input').fill(names);await page.locator('#import-roster').click();}
async function homework(page,name='工作紙 A'){await desk(page,'class');await page.locator('#new-homework').fill(name);await page.locator('#add-homework').click();}
test('instant edits survive adding, reordering, switching, reloading and deleting the last step',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await login(page);
 await page.locator('#edit-title').fill('科學探索');await page.locator('#add-step').click();
 await page.locator('[data-field="time"]').fill('5 分鐘');await page.locator('[data-field="detail"]').fill('只填詳情也保留');
 await page.locator('#add-step').click();await page.locator('[data-field="title"]').nth(1).fill('實驗');
 await page.locator('.flow-edit').nth(1).getByRole('button',{name:'↑ 上移',exact:true}).click();
 await page.locator('[data-tab="lesson"]').click();await expect(page.locator('#lesson-title')).toHaveText('科學探索');await expect(page.locator('#lesson-flow')).toContainText('只填詳情也保留');
 await page.reload();await expect(page.locator('#lesson-flow .flow-step')).toHaveCount(2);await login(page);
 for(let i=0;i<2;i++){await page.locator('.flow-edit').first().getByRole('button',{name:'刪除',exact:true}).click();await confirm(page);}
 await page.locator('#save-local').click();await page.reload();await login(page);await expect(page.locator('.flow-edit')).toHaveCount(0);expect(errors).toEqual([]);
});
test('history, new lesson and templates keep typed content',async({page})=>{
 await page.goto('/');await login(page);await page.locator('#edit-title').fill('第一課');await page.locator('#add-step').click();await page.locator('[data-field="title"]').fill('熱身');
 await desk(page,'library');await page.locator('#preset-name').fill('我的流程');await page.locator('#save-preset').click();await desk(page,'plan');await page.locator('#new-lesson').click();await confirm(page);
 await expect(page.locator('#edit-title')).toHaveValue('');await desk(page,'library');await page.locator('#preset-list').getByRole('button',{name:'套用',exact:true}).click();await confirm(page);await expect(page.locator('[data-field="title"]')).toHaveValue('熱身');
 await page.locator('[data-tab="lesson"]').click();await page.locator('#previous').click();await expect(page.locator('#previous-panel')).toContainText('第一課');
 await page.locator('[data-tab="admin"]').click();await desk(page,'library');await page.locator('#history-list').getByRole('button',{name:'載入',exact:true}).first().click();await confirm(page);await expect(page.locator('#edit-title')).toHaveValue('第一課');
});
test('duplicate students, quoted task names, matrix and totals retain independent records',async({page})=>{
 await page.goto('/');await login(page);await roster(page);await homework(page,"O'Brien <b>工作紙</b>");
 await page.locator('[data-tab="homework"]').click();await expect(page.locator('#rate')).toBeHidden();await expect(page.locator('#hw-table tbody tr')).toHaveCount(3);
 await page.locator('#edit-records').check();await page.locator('#hw-table tbody tr').nth(1).getByRole('button').click();
 await expect(page.locator('#hw-table tbody tr').nth(1)).toContainText('已交');await expect(page.locator('#hw-table tbody tr').nth(2)).toContainText('未交');
 await expect(page.locator('#missing-list .chip')).toHaveCount(2);await page.locator('[data-view="matrix"]').click();await expect(page.locator('#hw-table thead')).toContainText("O'Brien <b>工作紙</b>");expect(await page.locator('#hw-table thead b').count()).toBe(0);
 await page.locator('#show-rate').check();await expect(page.locator('#rate')).toContainText('33%');await page.reload();await login(page);await page.locator('[data-tab="homework"]').click();await expect(page.locator('#hw-table tbody tr').nth(1)).toContainText('已交');
});
test('downloaded standalone HTML reopens with isolated storage and all network disabled',async({page,browser},testInfo)=>{
 await page.goto('/');await login(page);await page.locator('#edit-title').fill('離線 </script> 測試');await page.locator('#add-step').click();await page.locator('[data-field="detail"]').fill('帶到另一台電腦');await roster(page,'Alex\n小明');await homework(page);
 const wait=page.waitForEvent('download');await page.locator('#export-html').click();const download=await wait;const filename=testInfo.outputPath('portable.html');await download.saveAs(filename);
 const context=await browser.newContext({offline:true});const fresh=await context.newPage();const errors=[];fresh.on('pageerror',e=>errors.push(e.message));await context.route('http://offline.classroom.test/**',async route=>route.fulfill({contentType:'text/html',body:await fs.readFile(filename,'utf8')}));await fresh.goto('http://offline.classroom.test/portable.html');
 await fresh.evaluate(()=>document.fonts.ready);expect(await fresh.evaluate(()=>[...document.fonts].filter(f=>f.family==='M PLUS Rounded 1c'&&f.status==='loaded').length)).toBe(2);
 await expect(fresh.locator('#lesson-title')).toHaveText('離線 </script> 測試');await expect(fresh.locator('#lesson-flow')).toContainText('帶到另一台電腦');await login(fresh);await expect(fresh.locator('#roster-count')).toContainText('2');await expect(fresh.locator('#password')).toBeHidden();
 await fresh.locator('#edit-title').fill('重開後仍能編輯');await fresh.locator('#add-step').click();await fresh.reload();await expect(fresh.locator('#lesson-title')).toHaveText('重開後仍能編輯');expect(errors).toEqual([]);await context.close();
});
test('valid legacy JSON imports, malformed input preserves current data',async({page},testInfo)=>{
 await page.goto('/');await login(page);await page.locator('#edit-title').fill('原本資料');
 await page.locator('#import-json').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"students":[]}')});await expect(page.locator('#toast')).toContainText('匯入失敗');await expect(page.locator('#edit-title')).toHaveValue('原本資料');
 const raw={lesson:{title:'舊版課堂',date:'2026/10/20',flow:[{time:'5',title:'熱身',detail:''}]},students:['Mary'],homeworks:['HW'],submissions:{HW:{Mary:'late'}},historyLessons:[],flowPresets:[]};
 await page.locator('#import-json').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))});const wait=page.waitForEvent('download');await confirm(page);await wait;await expect(page.locator('#edit-title')).toHaveValue('舊版課堂');await page.locator('[data-tab="homework"]').click();await expect(page.locator('#hw-table')).toContainText('遲交');
});
test('picker supports both modes, clear result and no duplicates',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await login(page);await roster(page,'Alex\nMary');await page.locator('[data-tab="picker"]').click();
 await page.locator('#draw').click();await expect(page.locator('#picker-count')).toContainText('已抽 1');const first=await page.locator('#picked-name').textContent();
 await page.locator('[data-picker="wheel"]').click();await page.locator('#draw').click();await expect(page.locator('#picker-count')).toContainText('全班已抽完');expect(await page.locator('#picked-name').textContent()).not.toBe(first);await expect(page.locator('#draw')).toBeDisabled();await expect(page.locator('#wheel')).toBeVisible();
 await page.reload();await page.locator('[data-tab="picker"]').click();await expect(page.locator('#draw')).toBeDisabled();await page.locator('#reset-picker').click();await confirm(page);await expect(page.locator('#draw')).toBeEnabled();
});
test('timer task size, pause, resume and deadline survive reload',async({page})=>{
 await page.goto('/');await page.locator('[data-tab="timer"]').click();await expect(page.locator('#timer-task')).toHaveValue('');await expect(page.locator('#timer-task')).not.toHaveAttribute('placeholder');
 await page.locator('#timer-task').fill('完成課堂練習');await page.locator('#task-size').selectOption('56');await expect(page.locator('#timer-task')).toHaveCSS('font-size','56px');
 await page.locator('#custom-minutes').fill('0.1');await page.locator('#set-timer').click();await page.locator('#start-timer').click();await expect(page.locator('#timer-display')).not.toHaveText('00:06');await page.locator('#pause-timer').click();const paused=await page.locator('#timer-display').textContent();await page.waitForTimeout(1100);await expect(page.locator('#timer-display')).toHaveText(paused);
 await page.locator('#start-timer').click();await page.reload();await page.locator('[data-tab="timer"]').click();await expect(page.locator('#timer-task')).toHaveValue('完成課堂練習');await expect(page.locator('#timer-display')).toHaveText('00:00',{timeout:9000});await expect(page.locator('#timer-message')).toContainText('時間到');
});
test('two windows detect competing changes without silently overwriting them',async({page,context})=>{
 await page.goto('/');await login(page);await page.locator('#edit-title').fill('共用課堂');
 const other=await context.newPage();await other.goto('/');await login(other);await page.locator('#edit-title').fill('第一視窗更新');
 await expect(other.locator('#conflict-dialog')).toBeVisible();await other.locator('#conflict-load').click();await expect(other.locator('#edit-title')).toHaveValue('第一視窗更新');await expect(other.locator('#conflict-dialog')).toBeHidden();
});
test('storage quota failures are visible and editing remains exportable',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};});await page.goto('/');await login(page);await page.locator('#edit-title').fill('記憶體仍保留');await expect(page.locator('#save-status')).toContainText('自動儲存失敗');
 await desk(page,'backup');const wait=page.waitForEvent('download');await page.locator('#export-json').click();const download=await wait;const content=JSON.parse(await fs.readFile(await download.path(),'utf8'));expect(content.lesson.title).toBe('記憶體仍保留');
});
test('trilingual controls, teacher lock and mobile layout',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#language').click();await expect(page.locator('[data-tab="lesson"]')).toContainText('Lesson');await page.locator('#language').click();await expect(page.locator('[data-tab="lesson"]')).toContainText('課堂內容 / Lesson');await page.locator('#language').click();
 await page.locator('[data-tab="homework"]').click();await page.locator('#edit-records').click();await expect(page.locator('#login')).toBeVisible();await expect(page.locator('#admin-panel')).toBeHidden();
 await expect(page.locator('body')).not.toContainText('0926');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#password').fill('wrong');await page.locator('#login button').click();await expect(page.locator('#login-error')).toContainText('不正確');
});
test('USB writer reports success only after closing and preserves edits on denied permission',async({page})=>{
 await page.addInitScript(()=>{
  window.writtenHTML='';window.usbAllowed=true;
  window.showOpenFilePicker=async()=>[{name:'classroom.html',getFile:async()=>({text:async()=>'id="embedded-data" tch-classroom-v4:'}),queryPermission:async()=>window.usbAllowed?'granted':'prompt',requestPermission:async()=> 'denied',createWritable:async()=>({write:async s=>window.writtenHTML=s,close:async()=>{},abort:async()=>{}})}];
 });await page.goto('/');await login(page);await page.locator('#edit-title').fill('USB 內容');await desk(page,'backup');await page.locator('#write-file').click();await expect(page.locator('#file-status')).toContainText('已寫入');const written=await page.evaluate(()=>window.writtenHTML);expect(written).toContain('USB 內容');
 await page.evaluate(()=>window.usbAllowed=false);await desk(page,'plan');await page.locator('#edit-title').fill('權限拒絕仍保留');await desk(page,'backup');await page.locator('#write-file').click();await expect(page.locator('#toast')).toContainText('未能寫入');await expect(page.locator('#edit-title')).toHaveValue('權限拒絕仍保留');
});
test('HTML has no external asset requests and functions with the network offline',async({page})=>{
 const requests=[];await page.context().route('http://offline.classroom.test/**',async r=>r.fulfill({contentType:'text/html',body:await fs.readFile('index.html','utf8')}));await page.context().setOffline(true);page.on('request',r=>requests.push(r.url()));await page.goto('http://offline.classroom.test/');await login(page);await page.locator('#edit-title').fill('真正離線');await page.locator('[data-tab="lesson"]').click();await expect(page.locator('#lesson-title')).toHaveText('真正離線');expect(requests).toEqual(['http://offline.classroom.test/']);
});

test('a corrupt local cache never discards the valid embedded portable lesson',async({page})=>{
 const embedded=C.createData();embedded.lesson.title='有效的 USB 課堂';embedded.revision=12;
 const html=(await fs.readFile('index.html','utf8')).replace('<script id="embedded-data" type="application/json">null',()=>'<script id="embedded-data" type="application/json">'+C.safeJSON(embedded));
 await page.addInitScript(id=>localStorage.setItem('tch-classroom-v4:'+id,'{broken'),embedded.id);
 await page.route('http://portable.test/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('http://portable.test/');await expect(page.locator('#lesson-title')).toHaveText('有效的 USB 課堂');await login(page);await expect(page.locator('#save-status')).toContainText('無法讀取');
});
test('USB cancellation and stream failure never report a successful write',async({page})=>{
 await page.addInitScript(()=>{
  window.failStream=false;window.showOpenFilePicker=async()=>{if(!window.failStream)throw new DOMException('cancelled','AbortError');return [{name:'classroom.html',getFile:async()=>({text:async()=>'id="embedded-data" tch-classroom-v4:'}),queryPermission:async()=>'granted',createWritable:async()=>({write:async()=>{throw new Error('disk full');},close:async()=>{},abort:async()=>{}})}];};
 });await page.goto('/');await login(page);await page.locator('#edit-title').fill('不可遺失');await desk(page,'backup');await page.locator('#write-file').click();await expect(page.locator('#toast')).toContainText('已取消');await expect(page.locator('#file-status')).toContainText('未完成寫入');await page.evaluate(()=>window.failStream=true);await desk(page,'backup');await page.locator('#write-file').click();await expect(page.locator('#toast')).toContainText('未能寫入');await expect(page.locator('#edit-title')).toHaveValue('不可遺失');
});

async function seedClass(page,count=35) {
 const data=C.createData();data.lesson.title='測試課堂';
 C.replaceRoster(data,Array.from({length:count},(_,i)=>`學生${String(i+1).padStart(2,'0')}`));
 data.homework=['工作紙一','工作紙二','閱讀報告'].map(name=>({id:C.uid(),name}));
 await page.addInitScript(d=>{localStorage.setItem('tch-classroom-v4:'+d.id,JSON.stringify(d));localStorage.setItem('tch-classroom-v4:active:/',d.id);},data);
}
test('original rounded fonts load offline and 35 students use multiple columns at desktop size',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await seedClass(page);await page.goto('/');
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>[...document.fonts].filter(f=>f.family==='M PLUS Rounded 1c'&&f.status==='loaded').length)).toBe(2);
 await expect(page.locator('body')).toHaveCSS('font-family',/M PLUS Rounded 1c/);
 await page.locator('[data-tab="homework"]').click();await expect(page.locator('#hw-table tbody tr')).toHaveCount(35);
 const bounds=await page.locator('#hw-table tbody tr').evaluateAll(rows=>rows.map(r=>{const b=r.getBoundingClientRect();return {x:b.x,bottom:b.bottom};}));
 expect(new Set(bounds.map(b=>Math.round(b.x))).size).toBeGreaterThanOrEqual(3);
 const area=await page.locator('.table-scroll').boundingBox();expect(bounds[34].bottom).toBeLessThanOrEqual(area.y+area.height+1);
 await page.locator('[data-view="matrix"]').click();await expect(page.locator('#missing-box')).toBeVisible();await page.locator('#hw-select').selectOption({label:'工作紙二'});await expect(page.locator('#missing-task')).toHaveText('工作紙二');
});
test('undo restores individual and bulk record edits while matrix focus and scroll stay in place',async({page})=>{
 await seedClass(page,35);await page.goto('/');await login(page);await page.locator('[data-tab="homework"]').click();await page.locator('#edit-records').check();
 await page.locator('#hw-table tbody tr').first().getByRole('button').click();await expect(page.locator('#hw-table tbody tr').first()).toContainText('已交');await page.locator('#undo-record').click();await expect(page.locator('#hw-table tbody tr').first()).toContainText('未交');
 await page.locator('#mark-all').click();await confirm(page);await expect(page.locator('#missing-count')).toHaveText('0');await page.locator('#undo-record').click();await expect(page.locator('#missing-count')).toHaveText('35');
 await page.locator('[data-view="matrix"]').click();const target=page.locator('#hw-table tbody tr').nth(24).getByRole('button').nth(1);await target.scrollIntoViewIfNeeded();const before=await page.locator('.table-scroll').evaluate(e=>e.scrollTop);await target.click();
 expect(await page.locator('.table-scroll').evaluate(e=>e.scrollTop)).toBeCloseTo(before,0);await expect(page.locator('#hw-table tbody tr').nth(24).getByRole('button').nth(1)).toBeFocused();
});
test('teacher sections preserve pasted drafts, optional fields and preview changes',async({page})=>{
 await page.goto('/');await login(page);await desk(page,'class');await page.locator('#roster-input').fill('尚未匯入的名單\nAlex');
 await page.locator('[data-tab="lesson"]').click();await page.locator('[data-tab="admin"]').click();await expect(page.locator('#roster-input')).toHaveValue('尚未匯入的名單\nAlex');
 await desk(page,'plan');await expect(page.locator('[data-lesson="announcement"]')).toBeHidden();await page.locator('[data-lesson="showAnnouncement"]').check();await page.locator('[data-lesson="announcement"]').fill('明天交工作紙');
 await page.locator('#edit-title').fill('即時預覽');await page.locator('#add-step-top').click();await page.locator('[data-field="title"]').fill('課堂活動');await page.locator('#preview-lesson').click();await expect(page.locator('#lesson-title')).toHaveText('即時預覽');await expect(page.locator('#announcement-block')).toContainText('明天交工作紙');
 await page.locator('#project').click();await expect(page.locator('#project')).toContainText('一般模式');await expect(page.locator('[data-tab="admin"]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#project')).toContainText('投影模式');
});
test('changing a running timer asks before losing the current countdown',async({page})=>{
 await page.goto('/');await page.locator('[data-tab="timer"]').click();await page.locator('#start-timer').click();await page.locator('[data-minutes="1"]').click();await expect(page.locator('#confirm-dialog')).toBeVisible();await page.locator('#confirm-dialog button[value="cancel"]').click();await expect(page.locator('#start-timer')).toBeDisabled();
 await page.locator('[data-minutes="1"]').click();await confirm(page);await expect(page.locator('#timer-display')).toHaveText('01:00');await expect(page.locator('#start-timer')).toBeEnabled();
});
test('five pages fit phone and laptop widths in Chinese, English and bilingual modes',async({page})=>{
 await seedClass(page);await page.goto('/');await login(page);
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:900});
  for(let language=0;language<3;language++){
   for(const name of ['lesson','picker','timer','homework','admin']){
    await page.locator(`[data-tab="${name}"]`).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}, ${language}, ${name}`).toBe(true);
   }
   await page.locator('#language').click();
  }
 }
});
