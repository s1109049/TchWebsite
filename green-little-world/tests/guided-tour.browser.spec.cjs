const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');

const profiles=[
  {name:'desktop',viewport:{width:1440,height:1000}},
  {name:'tablet',viewport:{width:820,height:1100}},
  {name:'mobile',viewport:{width:390,height:844}}
];

async function capture(page,testInfo,profile,station){
  const directory=process.env.PARK_SCREENSHOTS;
  if(directory)await fs.mkdir(directory,{recursive:true});
  const imagePath=directory?path.join(directory,`${profile}-${station}.png`):testInfo.outputPath(`${profile}-${station}.png`);
  await page.locator('#garden').screenshot({path:imagePath});
  await testInfo.attach(`${profile} ${station} rendered 3D view`,{path:imagePath,contentType:'image/png'});
  const viewportPath=directory?path.join(directory,`${profile}-${station}-viewport.png`):testInfo.outputPath(`${profile}-${station}-viewport.png`);
  await page.screenshot({path:viewportPath,fullPage:false});
  if(['entrance','flower','conditions'].includes(station)){
    const fullPath=directory?path.join(directory,`${profile}-${station}-page.png`):testInfo.outputPath(`${profile}-${station}-page.png`);
    await page.screenshot({path:fullPath,fullPage:true});
  }
}

async function arrived(page,label){
  await expect(page.locator('#scene-label')).toContainText(label);
  await expect(page.locator('#primary-action')).toBeEnabled();
  await expect(page.locator('#scene-status')).not.toContainText('前往');
}

async function checkLayout(page,profile,requireSceneVisible=false){
  const metrics=await page.evaluate(()=>{
    const garden=document.getElementById('garden').getBoundingClientRect();
    return {viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,gardenWidth:garden.width};
  });
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  if(profile==='mobile')expect(metrics.gardenWidth).toBeGreaterThan(metrics.viewport*.85);
  for(const id of ['primary-action','prev-action']){
    const box=await page.locator(`#${id}`).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(80);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y+box.height).toBeLessThanOrEqual(profiles.find(item=>item.name===profile).viewport.height+1);
  }
  if(requireSceneVisible){
    const scene=await page.locator('#garden').boundingBox(),navigation=await page.locator('#tour-nav').boundingBox();
    expect(scene.y).toBeGreaterThanOrEqual(0);
    expect(scene.y+scene.height).toBeLessThanOrEqual(navigation.y+1);
  }
}

for(const profile of profiles){
  test(`${profile.name}: real WebGL park stays clear and follows the simple guided sequence`,async({browser},testInfo)=>{
    const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:1,isMobile:profile.name==='mobile',hasTouch:profile.name!=='desktop'});
    const page=await context.newPage(),errors=[];
    const press=selector=>profile.name==='desktop'?page.locator(selector).click():page.locator(selector).tap();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto('http://127.0.0.1:4173/green-little-world/dist/',{waitUntil:'networkidle'});
    await expect(page.locator('#scene-loading')).toBeHidden();
    await expect(page.locator('#park-world canvas')).toBeVisible();
    const glVersion=await page.locator('#park-world canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');return gl&&gl.getParameter(gl.VERSION);});
    expect(glVersion).toMatch(/WebGL/);
    await expect(page.locator('#settings-open')).toHaveAccessibleName('學習設定');
    await expect(page.locator('[data-walk]')).toHaveCount(0);
    await expect(page.locator('#park-route button')).toHaveCount(0);
    await expect(page.locator('#garden button:visible')).toHaveCount(0);
    await expect(page.locator('#prev-action')).toBeDisabled();
    await checkLayout(page,profile.name);
    await capture(page,testInfo,profile.name,'entrance');

    await press('#primary-action');await arrived(page,'花');
    await checkLayout(page,profile.name,true);
    await press('[data-choice="flower.leaf"]');
    await expect(page.locator('#activity-title')).toContainText('葉');
    await capture(page,testInfo,profile.name,'flower');
    await press('#task-action');
    await press('[data-choice="flower.stem"]');
    await expect(page.locator('#primary-action')).toBeEnabled();
    await expect(page.locator('#primary-action')).not.toContainText('提示');
    await press('#primary-action');await arrived(page,'樹');await checkLayout(page,profile.name,true);
    await capture(page,testInfo,profile.name,'tree');
    await press('#prev-action');await arrived(page,'花');
    await press('#primary-action');await arrived(page,'樹');
    await press('#primary-action');await arrived(page,'草');await checkLayout(page,profile.name,true);
    await capture(page,testInfo,profile.name,'grass');
    await press('#primary-action');await arrived(page,/成長|生長|育苗/);await checkLayout(page,profile.name,true);
    await expect(page.locator('#growth-lab')).toBeVisible();
    await expect(page.locator('#conditions-lab')).toBeHidden();
    await expect(page.locator('#growth-track button')).toHaveCount(5);
    for(let index=0;index<5;index++){
      await press(`[data-growth="${index}"]`);
      await expect(page.locator(`[data-growth="${index}"]`)).toHaveAttribute('aria-pressed','true');
      if(profile.name==='desktop')await capture(page,testInfo,profile.name,`growth-${index}`);
    }
    await capture(page,testInfo,profile.name,'growth');
    await press('[data-growth="2"]');
    const beforeWater=await page.locator('#growth-stage-name').textContent();
    await press('#primary-action');await arrived(page,/照顧|需要|條件/);await checkLayout(page,profile.name,true);
    await expect(page.locator('#growth-lab')).toBeHidden();
    await expect(page.locator('#conditions-lab')).toBeVisible();
    for(const key of ['sun','water','air'])await press(`[data-condition="${key}"]`);
    await expect(page.locator('#condition-description')).toContainText('空氣');
    await press('#park-water');
    await expect(page.locator('#scene-status')).toContainText(/水|澆/);
    await expect(page.locator('#growth-stage-name')).toHaveText(beforeWater);
    await page.waitForTimeout(2000);
    await capture(page,testInfo,profile.name,'conditions');
    await checkLayout(page,profile.name);
    await press('#primary-action');await expect(page.locator('#primary-action')).toContainText(/再|重新/);
    await expect(page.locator('#scene-label')).toContainText(/完成|總結|回顧|發現/);
    await capture(page,testInfo,profile.name,'summary');
    await press('#primary-action');await arrived(page,'入口');
    await expect(page.locator('#prev-action')).toBeDisabled();
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('independent recycling activity remains separate and functional',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/green-little-world/dist/',{waitUntil:'networkidle'});
  await expect(page.locator('#scene-loading')).toBeHidden();
  await page.locator('#tab-recycle').click();
  await expect(page.locator('#recycle-world canvas')).toBeVisible();
  await expect(page.locator('#scene-loading')).toBeHidden();
  await expect(page.locator('#park-route-wrap')).toBeHidden();
  await expect(page.locator('#park-world')).toBeHidden();
  for(const key of ['paper','metal','plastic']){
    await page.locator(`[data-choice="${key}"]`).click();
    await expect(page.locator('#feedback-text')).toContainText('做到了');
    await page.locator('#primary-action').click();
  }
  await expect(page.locator('#activity-title')).toContainText('做到了');
  await page.locator('#tab-nature').click();
  await expect(page.locator('#park-world canvas')).toBeVisible();
  await expect(page.locator('#scene-label')).toContainText('入口');
  expect(errors).toEqual([]);
});

test('focused desktop growth controls stay above the fixed navigation',async({page},testInfo)=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/green-little-world/dist/',{waitUntil:'networkidle'});
  await expect(page.locator('#scene-loading')).toBeHidden();
  for(const label of ['花','樹','草',/成長|生長|育苗/]){
    await page.locator('#primary-action').click();await arrived(page,label);
  }
  const stage=await page.locator('#growth-next').boundingBox(),navigation=await page.locator('#tour-nav').boundingBox();
  expect(stage.y).toBeGreaterThanOrEqual(0);
  expect(stage.y+stage.height).toBeLessThanOrEqual(navigation.y+1);
  const imagePath=process.env.PARK_SCREENSHOTS?path.join(process.env.PARK_SCREENSHOTS,'desktop-growth-controls-viewport.png'):testInfo.outputPath('desktop-growth-controls-viewport.png');
  await page.screenshot({path:imagePath,fullPage:false});
  await testInfo.attach('growth-stage control is unobstructed',{path:imagePath,contentType:'image/png'});
});
